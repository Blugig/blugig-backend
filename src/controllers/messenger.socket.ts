import { prisma } from '../lib/prisma';
import { Server, Socket } from 'socket.io';
import { incrementRoomCount, decrementRoomCount, getRoomCount } from '../lib/redis';

export const socketHandler = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on('join_room', async ({ conversation_id }) => {
            try {
                const currentCount = await getRoomCount(conversation_id);

                // Only allow joining if room count is less than 2
                if (currentCount < 2) {
                    socket.join(conversation_id);
                    const roomCount = await incrementRoomCount(conversation_id);
                    
                    console.log(`Socket ${socket.id} joined room ${conversation_id}. Room count: ${roomCount}`);
                } else {
                    console.log(`Socket ${socket.id} attempted to join full room ${conversation_id}. Current count: ${currentCount}`);
                    socket.disconnect();
                }
            } catch (error) {
                console.error('Error updating room count:', error);
                socket.emit('join_error', { conversation_id, error: 'Failed to join room' });
            }
        });

        socket.on('send_message', async (data) => {
            try {
                const roomCount = await getRoomCount(data.conversation_id);
                const bothUsersOnline = roomCount === 2;

                const messageData: any = {
                    body: data?.body,
                    message_type: data.message_type,
                    media_url: data?.media_url,
                    media_type: data?.media_type,
                    conversation_id: data.conversation_id,
                    offer_id: data?.offer_id,
                    time: new Date(),
                    is_read: bothUsersOnline,
                };

                // Check sender_role
                if (data.sender_role === 'user') {
                    messageData.sender_user_id = parseInt(data.sender_id);
                } else if (data.sender_role === 'admin') {
                    messageData.sender_admin_id = data.sender_id;
                } else {
                    throw new Error('Invalid sender role');
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
                        unread_count: bothUsersOnline ? 0 : {
                            increment: 1
                        }
                    },
                });

                let msg_to_send: any;

                if (messageData.message_type === 'OFFER' && messageData.offer_id) {
                    const offer = await prisma.offer.findUnique({
                        where: { id: messageData.offer_id },
                    });

                    msg_to_send = {
                        ...new_message,
                        offer: offer,
                    };
                } else {
                    msg_to_send = new_message;
                }

                // Emit to others in the room
                socket.to(data.conversation_id).emit('new_message', msg_to_send);
            } catch (error) {
                console.error('Error saving message:', error);
            }
        });

        socket.on('disconnect', async () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });

        socket.on('mark_as_read', async ({ conversation_id, message_ids }) => {
            try {
                // Check if message_ids is defined and is an array
                if (!message_ids || !Array.isArray(message_ids) || message_ids.length === 0) {
                    console.error('Invalid message_ids:', message_ids);
                    return;
                }

                const updateResult = await prisma.message.updateMany({
                    where: {
                        id: {
                            in: message_ids
                        },
                        conversation_id: conversation_id,
                        is_read: false
                    },
                    data: {
                        is_read: true
                    }
                });
                
                const unreadCount = updateResult.count;

                // Update conversation's unread count only if there were unread messages
                if (unreadCount > 0) {
                    await prisma.conversation.update({
                        where: { id: conversation_id },
                        data: {
                            unread_count: {
                                decrement: unreadCount
                            }
                        }
                    });
                }

                // Emit to others in the room
                // socket.to(conversation_id).emit('message_read', { 
                //     conversation_id,
                //     message_ids 
                // });
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        socket.on('leave_room', async ({ conversation_id }) => {
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