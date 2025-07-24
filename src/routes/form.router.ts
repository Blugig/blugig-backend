import express from 'express';
import FormController from '../controllers/form.controller';
import * as serviceViewController from '../controllers/service/view.controller';
import { authenticate } from '../middleware/authenticate';

const formRouter: any = express.Router();

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

// Edit an existing form
formRouter.post(
    '/edit',
    authenticate,
    FormController.editForm
);

formRouter.post(
    '/get-available-slots',
    authenticate,
    serviceViewController.getAvailableSlots
);

export default formRouter;