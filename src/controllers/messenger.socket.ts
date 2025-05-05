import { prisma } from '../lib/prisma';
import { Server, Socket } from 'socket.io';

export const socketHandler = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Join a conversation room
        socket.on('join_room', ({ conversation_id }) => {
            socket.join(conversation_id);
            console.log(`Socket ${socket.id} joined room ${conversation_id}`);
        });

        // Handle sending a message
        socket.on('send_message', async (data) => {
            try {
                const messageData: any = {
                    body: data?.body,
                    message_type: data.message_type,
                    media_url: data?.media_url,
                    media_type: data?.media_type,
                    conversation_id: data.conversation_id,
                    offer_id: data?.offer_id,
                    time: new Date(),
                };

                // Check sender_role: 'user' or 'admin'
                if (data.sender_role === 'user') {
                    messageData.sender_user_id = parseInt(data.sender_id); // Make sure it's int
                } else if (data.sender_role === 'admin') {
                    messageData.sender_admin_id = data.sender_id; // String
                } else {
                    throw new Error('Invalid sender role');
                }

                // Save the new message
                const new_message = await prisma.message.create({
                    data: messageData,
                });

                // Emit the message to others in the room
                socket.to(data.conversation_id).emit('new_message', new_message);

            } catch (error) {
                console.error('Error saving message:', error);
                // socket.emit('error', { message: 'Message send failed' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};
