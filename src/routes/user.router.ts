import express from 'express';
import { 
    register,
    login,
    verifyEmail,
    getEmail,
    forgotPassword,

    getAllUsers,
    uploadFile,
    getUserProfile,
    updateUser,
    deleteUser,
    getHistory,
    acceptRejectOffer,
    makePayment
} from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';
import upload from '../lib/fileUpload';

const userRouter: any = express.Router();

// Auth routes
userRouter.post('/register', register);
userRouter.post('/login', login);
userRouter.post('/verify-email', verifyEmail);
userRouter.post('/get-email', getEmail);
userRouter.post('/forgot-password', authenticate, forgotPassword);

// User management routes
userRouter.get('/', getAllUsers);

userRouter.post('/file-upload', authenticate, upload.single('attachment'), uploadFile);
userRouter.get('/get-profile', authenticate, getUserProfile);
userRouter.get('/history', authenticate, getHistory);
userRouter.post('/update-profile', authenticate, upload.single('profile_photo'), updateUser);
userRouter.post('/delete-user', authenticate, deleteUser);

userRouter.post('/accept-reject-offer', authenticate, acceptRejectOffer);
userRouter.post('/payment', authenticate, makePayment);

export default userRouter;
