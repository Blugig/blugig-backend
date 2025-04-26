import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';

import { socketHandler } from './controllers/messenger.socket';
import { responseEnhancer } from './middleware/responseEnhancer';

import userRouter from './routes/user.router';
import adminRouter from './routes/admin.router';
import formRouter from './routes/form.router';

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
});

const PORT = process.env.PORT || 8000;

// ───── Middlewares ─────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseEnhancer);

const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// ───── Routes ─────
app.use('/admin', adminRouter)
app.use('/users', userRouter);
app.use('/forms', formRouter);


app.get('/ping', (req, res) => {
    res.status(200).json({ message: 'pong' });
});

// ───── Socket.IO Events ─────
socketHandler(io);

// ───── Start Server ─────
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
