import express from 'express';
import * as userController from '../controllers/user.controller';
import * as serviceController from '../controllers/service/create.controller';
import { authenticate } from '../middleware/authenticate';
import upload from '../lib/fileUpload';

const userRouter: any = express.Router();

// Auth routes
userRouter.post('/register', userController.register);
userRouter.post('/login', userController.login);
userRouter.post('/verify-email', userController.verifyEmail);
userRouter.post('/get-email', userController.getEmail);
userRouter.post('/forgot-password', authenticate, userController.forgotPassword);

// User management Routes
userRouter.get('/', userController.getAllUsers);

userRouter.post('/file-upload', authenticate, upload.single('attachment'), userController.uploadFile);
userRouter.get('/get-profile', authenticate, userController.getUserProfile);
userRouter.get('/history', authenticate, userController.getHistory);
userRouter.post('/update-profile', authenticate, upload.single('profile_photo'), userController.updateUser);
userRouter.post('/delete-user', authenticate, userController.deleteUser);

// User Service Routes
userRouter.post('/create-review', authenticate, serviceController.createReview);
userRouter.post('/create-report', authenticate, serviceController.createReport);
userRouter.post('/create-cancellation', authenticate, serviceController.createCancellation);
userRouter.post('/feedback', authenticate, upload.single('attachment'), serviceController.createFeedback);

userRouter.post('/accept-reject-offer', authenticate, userController.acceptRejectOffer);
userRouter.post('/payment', authenticate, serviceController.makePayment);

export default userRouter;
