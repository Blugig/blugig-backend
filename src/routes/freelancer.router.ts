import express from 'express';
import * as freelancerController from '../controllers/freelancer/crud.controller';
import * as jobController from '../controllers/freelancer/job.controller';
import { authenticate } from '../middleware/authenticate';
import upload from '../lib/fileUpload';

const freelancerRouter: any = express.Router();

// Auth Routes
freelancerRouter.post('/login', freelancerController.login);
freelancerRouter.post('/register', freelancerController.register);

// Jobs Routes
freelancerRouter.get('/jobs', authenticate, jobController.getAllJobs);
freelancerRouter.get('/jobs/awarded', authenticate, jobController.getAllJobs);
freelancerRouter.get('/jobs/pending', authenticate, jobController.getAllJobs);

export default freelancerRouter;