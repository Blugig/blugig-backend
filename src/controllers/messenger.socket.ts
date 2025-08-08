import { prisma } from '../lib/prisma';
import { Server, Socket } from 'socket.io';
import { incrementRoomCount, decrementRoomCount, getRoomCount } from '../lib/redis';
import { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken'; // Import jsonwebtoken

// Define the interface for the authenticated socket
interface AuthenticatedSocket extends Socket {
    user?: {
        id: number | string;
        userType: 'customer' | 'admin' | 'freelancer';
    };
}

/**
 * Marks messages in a conversation as "seen" by a specific participant (user or admin).
 * This function updates the `last_seen_message_id` and `unread_count`
 * for the given conversation, from the perspective of the `participantId` provided.
 * It specifically marks messages *not* sent by the `participantId` as seen.
 *
 * @param conversationId The ID of the conversation to update.
 * @param participantId The ID of the participant (user or admin) who is viewing the conversation.
 * @param participantRole The role of the participant ('customer', 'admin', or 'freelancer').
 * @returns The number of messages that were newly marked as seen.
 */
export const markMessagesAsSeen = async (
    conversationId: string,
    participantId: number | string,
    participantRole: 'customer' | 'admin' | 'freelancer'
): Promise<number> => {
    try {
        // 1. Fetch the conversation to get its current last_seen_message_id
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            select: {
                id: true,
                last_seen_message_id: true,
                unread_count: true,
                user_id: true,
                admin_id: true,
                freelancer_id: true,
                conversation_type: true,
            },
        });

        if (!conversation) {
            console.warn(`Conversation with ID ${conversationId} not found.`);
            return 0;
        }

        // Ensure the participant is actually part of this conversation
        if (
            (participantRole === 'customer' && conversation.user_id !== (participantId as number)) ||
            (participantRole === 'admin' && conversation.admin_id !== (participantId as number)) ||
            (participantRole === 'freelancer' && conversation.freelancer_id !== (participantId as number))
        ) {
            console.warn(`Participant ${participantId} (${participantRole}) is not associated with conversation ${conversationId}.`);
            return 0;
        }

        // Construct the sender exclusion filter based on the participant's role
        let senderExclusionFilter: Prisma.MessageWhereInput;
        if (participantRole === 'customer') {
            // Customer wants to see messages NOT from themselves (from admin or freelancer)
            senderExclusionFilter = { sender_user_id: null };
        } else if (participantRole === 'admin') {
            // Admin wants to see messages NOT from themselves (from user or freelancer)
            senderExclusionFilter = { sender_admin_id: null };
        } else {
            // Freelancer wants to see messages NOT from themselves (from user or admin)
            senderExclusionFilter = { sender_freelancer_id: null };
        }

        let currentLastSeenMessageId = conversation.last_seen_message_id || null;
        if (!currentLastSeenMessageId) {
            // fetch last seen msg
            const latestOpponentMessage = await prisma.message.findFirst({
                where: {
                    conversation_id: conversationId,
                    is_read: true,
                    ...senderExclusionFilter,
                },
                orderBy: {
                    id: 'desc',
                },
                select: {
                    id: true,
                },
            });
            console.log(latestOpponentMessage);

            if (latestOpponentMessage) {
                currentLastSeenMessageId = latestOpponentMessage.id;
            } else {
                currentLastSeenMessageId = 1;
            }
        }

        let updatedCount;

        // Get all unread messages not sent by the participant
        const unseenMessages = await prisma.message.findMany({
            where: {
                conversation_id: conversationId,
                is_read: false,
                ...senderExclusionFilter,
                id: {
                    gt: currentLastSeenMessageId
                }
            },
            orderBy: {
                id: 'desc'
            },
            select: {
                id: true
            }
        });

        // Get the highest message ID that will be marked as seen
        const newLastSeenMessageId = unseenMessages.length > 0 ? unseenMessages[0].id : null;

        if (newLastSeenMessageId) {
            // Mark messages as seen and update conversation
            updatedCount = await prisma.message.updateMany({
                where: {
                    conversation_id: conversationId,
                    is_read: false,
                    ...senderExclusionFilter,
                    id: {
                        lte: newLastSeenMessageId
                    }
                },
                data: {
                    is_read: true
                }
            });

            // Update conversation's last seen message and unread count
            await prisma.conversation.update({
                where: { id: conversationId },
                data: {
                    last_seen_message_id: newLastSeenMessageId,
                    unread_count: 0
                }
            });

            console.log(`Conversation ${conversationId}: Marked ${updatedCount} new messages as seen by ${participantRole} ${participantId}.`);
        } else {
            // If no new messages from the opponent are found, or if last_seen_message_id is already up-to-date,
            // ensure unread_count is 0 if it's not already.
            if (conversation.unread_count !== 0) {
                await prisma.conversation.update({
                    where: { id: conversationId },
                    data: {
                        unread_count: 0,
                    },
                });
                console.log(`Conversation ${conversationId}: Unread count reset to 0 for ${participantRole} ${participantId}.`);
            }
            console.log(`Conversation ${conversationId}: No new messages to mark as seen for ${participantRole} ${participantId}.`);
        }

        return updatedCount;
    } catch (error) {
        console.error(`Error marking messages as seen for conversation ${conversationId} by ${participantRole} ${participantId}:`, error);
        throw new Error("Failed to mark messages as seen.");
    }
};


export const socketHandler = (io: Server) => {
    io.on('connection', (socket: AuthenticatedSocket) => { // Use AuthenticatedSocket type here
        console.log(`Socket connected: ${socket.id}`);

        // Authentication for the socket connection
        const token = socket.handshake.headers.token; // Expect token in handshake.auth

        if (!token) {
            console.log(`Socket ${socket.id} disconnected: No token provided.`);
            socket.emit('auth_error', { message: 'Authentication token required.' });
            return socket.disconnect();
        }

        try {
            const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string) as { userId: number | string, userType: 'customer' | 'admin' | 'freelancer' };

            // Attach decoded user info to the socket object
            socket.user = {
                id: decoded.userId,
                userType: decoded.userType
            };
            console.log(`Socket ${socket.id} authenticated as ${socket.user.userType} with ID ${socket.user.id}`);

        } catch (err) {
            console.log(`Socket ${socket.id} disconnected: Invalid token.`, err);
            socket.emit('auth_error', { message: 'Invalid authentication token.' });
            return socket.disconnect();
        }

        // Event for joining a specific conversation room
        socket.on('join_room', async ({ conversation_id }) => {
            // Ensure the socket is authenticated before proceeding
            if (!socket.user) {
                console.error(`Socket ${socket.id} attempted to join room without authentication.`);
                socket.emit('join_error', { error: 'Authentication required to join room.' });
                return;
            }

            try {
                if (!conversation_id) {
                    console.error('Missing required data for join_room: conversation_id');
                    socket.emit('join_error', { error: 'Missing conversation_id' });
                    return;
                }

                const participantId = socket.user.id;
                const participantRole = socket.user.userType;

                const currentCount = await getRoomCount(conversation_id);

                // Only allow joining if room count is less than 2 (for a 1-on-1 chat)
                if (currentCount < 2) {
                    socket.join(conversation_id);
                    const roomCount = await incrementRoomCount(conversation_id);

                    console.log(`Socket ${socket.id} joined room ${conversation_id}. Room count: ${roomCount}`);

                    // Mark messages as seen for the joining participant
                    await markMessagesAsSeen(conversation_id, participantId, participantRole);

                } else {
                    console.log(`Socket ${socket.id} attempted to join full room ${conversation_id}. Current count: ${currentCount}`);
                    socket.emit('join_error', { conversation_id, error: 'Room is full' });
                    // Optionally, disconnect if room is full and it's a hard limit
                    // socket.disconnect();
                }
            } catch (error) {
                console.error('Error joining room or marking messages as seen:', error);
                socket.emit('join_error', { conversation_id, error: 'Failed to join room' });
            }
        });

        // Event for sending a message
        socket.on('send_message', async (data) => {
            // Ensure the socket is authenticated before proceeding
            if (!socket.user) {
                console.error(`Socket ${socket.id} attempted to send message without authentication.`);
                socket.emit('message_error', { error: 'Authentication required to send message.' });
                return;
            }

            try {
                // Validate essential message data
                if (!data.conversation_id || (!data.body && data.message_type === 'TEXT')) {
                    console.error('Missing required message data:', data);
                    socket.emit('message_error', { error: 'Missing required message fields' });
                    return;
                }

                const senderId = socket.user.id;
                const senderRole = socket.user.userType;

                const roomCount = await getRoomCount(data.conversation_id);
                const bothUsersOnline = roomCount === 2;

                const messageData: Prisma.MessageCreateInput = {
                    body: data.body,
                    message_type: data.message_type || 'TEXT',
                    media_url: data.media_url,
                    media_type: data.media_type,
                    conversation: { connect: { id: data.conversation_id } },
                    offer: data.offer_id ? { connect: { id: data.offer_id } } : undefined,
                    is_read: bothUsersOnline,
                    time: new Date(),
                };

                // Assign sender based on role from authenticated socket.user
                if (senderRole === 'customer') {
                    messageData.sender_user = { connect: { id: senderId as number } };
                } else if (senderRole === 'admin') {
                    messageData.sender_admin = { connect: { id: senderId as number } };
                } else if (senderRole === 'freelancer') {
                    messageData.sender_freelancer = { connect: { id: senderId as number } };
                } else {
                    // This case should ideally not be reached if userType is strictly 'customer' | 'admin' | 'freelancer'
                    throw new Error('Invalid sender role from authenticated user.');
                }

                // Create the message
                const new_message = await prisma.message.create({
                    data: messageData,
                });

                // Update the conversation's latest message and unread count
                await prisma.conversation.update({
                    where: { id: data.conversation_id },
                    data: {
                        latest_message_id: new_message.id,
                        unread_count: bothUsersOnline ? 0 : { increment: 1 },
                    },
                });

                let msg_to_send: any;

                // If it's an OFFER message, include offer details
                if (new_message.message_type === 'OFFER' && new_message.offer_id) {
                    const offer = await prisma.offer.findUnique({
                        where: { id: new_message.offer_id },
                    });

                    if (offer.status === 'pending') {
                        await prisma.formSubmission.updateMany({
                            where: { job: { conversations: { some: { id: new_message.conversation_id } } } },
                            data: { status: 'offer_pending' }
                        });
                    }


                    msg_to_send = {
                        ...new_message,
                        offer: offer,
                    };
                } else {
                    msg_to_send = new_message;
                }

                // Emit the new message to others in the room
                socket.to(data.conversation_id).emit('new_message', msg_to_send);
                // Also emit to the sender, if needed for immediate UI update on sender's side
                socket.emit('message_sent_success', msg_to_send);

            } catch (error) {
                console.error('Error sending or saving message:', error);
                socket.emit('message_error', { error: 'Failed to send message' });
            }
        });

        // Event for when a socket disconnects
        socket.on('disconnect', async () => {
            console.log(`Socket disconnected: ${socket.id}`);
            // Iterate over all rooms the socket was in and decrement count
            for (const room of socket.rooms) {
                if (room !== socket.id) { // Exclude the default room (socket.id)
                    try {
                        const newCount = await decrementRoomCount(room);
                        console.log(`Socket ${socket.id} left room ${room} on disconnect. Room count: ${newCount}`);
                    } catch (error) {
                        console.error(`Error decrementing room count for room ${room} on disconnect:`, error);
                    }
                }
            }
        });

        // Event for explicitly leaving a room
        socket.on('leave_room', async ({ conversation_id }) => {
            if (!conversation_id) {
                console.error('Missing conversation_id for leave_room event.');
                return;
            }
            socket.leave(conversation_id);

            try {
                const newCount = await decrementRoomCount(conversation_id);
                console.log(`Socket ${socket.id} left room ${conversation_id}. Room count: ${newCount}`);
            } catch (error) {
                console.error('Error updating room count on leave:', error);
            }
        });
    });
};