import express from "express";

import * as adminController from "../controllers/admin.controller";
import * as adminFormController from "../controllers/admin/forms.controller";
import * as adminCRUDController from "../controllers/admin/index.controller";
import * as adminFreelancerController from "../controllers/admin/freelancer.controller";

import { uploadFile } from "../controllers/user.controller"
import upload from '../lib/fileUpload';

import { authenticate } from "../middleware/authenticate";

const adminRouter: any = express.Router();

// Admin Auth Routes
adminRouter.post('/login', adminController.login);
adminRouter.post('/verify-email', adminController.verifyEmail);
adminRouter.post('/get-email', adminController.getEmail);

// Dashboard Main Routes
adminRouter.get('/dashboard-data', authenticate, adminController.getDashboardData);
adminRouter.get('/get-users', authenticate, adminController.getAllUsers);
adminRouter.get('/get-user-details/:id', authenticate, adminController.getUserDetails);
adminRouter.get('/get-freelancers', authenticate, adminController.getFreelancers);
adminRouter.get('/get-freelancer-details/:id', authenticate, adminController.getFreelancerDetails);
adminRouter.get('/get-jobs', authenticate, adminController.getAllJobs);

adminRouter.post('/file-upload', authenticate, upload.single('file'), uploadFile);

// Dashboard Freelancer Routes
adminRouter.post('/onboard-freelancers', authenticate, adminFreelancerController.onboardFreelancer);
adminRouter.post('/mark-jobs-as-open', authenticate, adminFreelancerController.markJobsAsOpen);

// CRUD Admin Routes
adminRouter.get('/get-profile', authenticate, adminCRUDController.getProfile);
adminRouter.get('/get-admins', authenticate, adminCRUDController.getAllAdmins);
adminRouter.get('/get-admin-details/:email', authenticate, adminCRUDController.getAdminDetails);
adminRouter.post('/create-admin', authenticate, adminCRUDController.addAdmin);
adminRouter.post('/delete-admin', authenticate, adminCRUDController.deleteAdmin);
adminRouter.post('/update-admin', authenticate, upload.single('profile_photo'), adminCRUDController.updateAdmin);

// Dashboard Form Routes
adminRouter.get('/get-all-forms/:formType', authenticate, adminFormController.getAllFormsOfType);
adminRouter.post('/get-form-details', authenticate, adminFormController.getFormDetails);
adminRouter.post('/create-offer', authenticate, adminFormController.createOffer);

// Dashboard Conversation Routes
adminRouter.post('/conversations/create', authenticate, adminController.createConverstaion);
adminRouter.get('/conversations', authenticate, adminController.getAllConversations);

export default adminRouter;