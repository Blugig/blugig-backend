import { Request } from 'express';

import { prisma } from '../../lib/prisma';
import CustomResponse from '../../utils/customResponse';
import { Prisma } from '@prisma/client';

interface AuthenticatedRequest extends Request {
    user?: {
        id: number; // Assuming user ID is a number based on your prisma schema and usage
        user_type: string;
    };
    file?: Express.Multer.File; // For file uploads, if using Multer
}
