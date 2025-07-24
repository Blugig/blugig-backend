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

export const getAvailableSlots = async (req: AuthenticatedRequest, res: CustomResponse) => {
    try {

        const { date } = req.body;

        // Fetch all time slots
        const timeSlots = await prisma.timeSlot.findMany({
            where: { is_active: true },
            include: {
                bookings: {
                    where: {
                        date: new Date(date),
                    },
                    select: { id: true },
                },
            },
        });

        // Filter slots where bookings.length < capacity
        const availableSlots = timeSlots.filter(slot => slot.bookings.length < slot.capacity);

        res.success("Fetched available slots successfully", { availableSlots }, 200);
    } catch (error) {
        res.failure("Failed to fetch available slots", error, 500);
    }
}