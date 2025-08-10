import express from 'express';
import * as freelancerController from '../controllers/freelancer/crud.controller';
import { authenticate } from '../middleware/authenticate';
import upload from '../lib/fileUpload';

const freelancerRouter: any = express.Router();

freelancerRouter.post('/login', freelancerController.login);
freelancerRouter.post('/register', freelancerController.register);

export default freelancerRouter;