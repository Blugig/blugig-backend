import express from 'express';
import * as freelancerController from '../controllers/freelancer/crud.controller';
import * as jobController from '../controllers/freelancer/job.controller';
import * as adminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/authenticate';
import upload from '../lib/fileUpload';

const freelancerRouter: any = express.Router();

// Auth Routes
freelancerRouter.post('/login', freelancerController.login);
freelancerRouter.post('/register', freelancerController.register);

// Jobs Routes
freelancerRouter.get('/jobs', authenticate, jobController.getAllJobs);
freelancerRouter.post('/job-details', authenticate, jobController.getJobDetails);
freelancerRouter.get('/jobs/awarded', authenticate, jobController.getAwardedJobs);
freelancerRouter.get('/jobs/pending', authenticate, jobController.getPendingJobs);

freelancerRouter.post('/update-job-progress', authenticate, jobController.updateJobProgress);

// Conversation Routes
freelancerRouter.post('/conversations/create', authenticate, adminController.createConversation);

export default freelancerRouter;