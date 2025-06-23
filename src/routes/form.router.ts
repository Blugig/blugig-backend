import express from 'express';
import FormController from '../controllers/form.controller';
import { authenticate } from '../middleware/authenticate';
import upload from '../lib/fileUpload';

const formRouter: any = express.Router();

// Get all forms for authenticated user
formRouter.get(
    '/get-user-forms',
    authenticate,
    FormController.getUserForms
);

formRouter.get(
    '/chat-list',
    authenticate,
    FormController.getChatList
)

// Get form by ID
formRouter.post(
    '/get-form-details',
    authenticate,
    FormController.getFormDetails
);

// Get Form Conversation
formRouter.post(
    '/get-form-messages',
    authenticate,
    FormController.getFormMessages
)

// Create a new form
formRouter.post(
    '/',
    authenticate,
    FormController.createForm
);

export default formRouter;