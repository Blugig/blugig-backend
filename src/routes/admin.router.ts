import express from "express";

import * as adminController from "../controllers/admin.controller";
import * as adminFormController from "../controllers/admin/forms.controller";
import * as adminCRUDController from "../controllers/admin/index.controller";

import { authenticate } from "../middleware/authenticate";

const adminRouter: any = express.Router();

adminRouter.post('/login', adminController.login);
adminRouter.post('/verify-email', adminController.verifyEmail);
adminRouter.post('/get-email', adminController.getEmail);

adminRouter.get('/dashboard-data', authenticate, adminController.getDashboardData);
adminRouter.get('/get-users', authenticate, adminController.getAllUsers);
adminRouter.get('/get-user-details/:id', authenticate, adminController.getUserDetails);

adminRouter.get('/get-admins', authenticate, adminCRUDController.getAllAdmins);
adminRouter.get('/get-admin-details/:email', authenticate, adminCRUDController.getAdminDetails);
adminRouter.post('/create-admin', authenticate, adminCRUDController.addAdmin);
adminRouter.post('/delete-admin', authenticate, adminCRUDController.deleteAdmin);
adminRouter.post('/update-admin', authenticate, adminCRUDController.updateAdmin);

adminRouter.get('/get-all-forms/:formType', authenticate, adminFormController.getAllFormsOfType);
adminRouter.post('/get-form-details', authenticate, adminFormController.getFormDetails);

adminRouter.post('/conversations/create', authenticate, adminController.createConverstaion);
adminRouter.get('/conversations', authenticate, adminController.getAllConversations);

export default adminRouter;