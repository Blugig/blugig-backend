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
        socket.on('send_message', async ({ conversation_id, sender_id, body, message_type, media_url, media_type }) => {
            console.log("aaya message");
            
            try {
                const new_message = await prisma.message.create({
                    data: {
                        body,
                        message_type,
                        media_url,
                        media_type,
                        conversation_id,
                        sender_id,
                        time: new Date(),
                    },
                });

                socket.to(conversation_id).emit('new_message', new_message);
            } catch (error) {
                console.error('Error saving message:', error);
                socket.emit('error', { message: 'Message send failed' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};