import express from 'express';
import { prisma } from '../lib/prisma';
import CustomResponse from '../utils/customResponse';
import { authenticate } from '../middleware/authenticate';

const timeSlotRouter: any = express.Router();

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        userType: string;
    };
}

// Get all time slots
timeSlotRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: CustomResponse) => {
    try {
        const timeSlots = await prisma.timeSlot.findMany({
            orderBy: [
                { is_active: 'desc' },  // Active slots first
                { start_time: 'asc' }   // Then by time
            ],
            include: {
                bookings: {
                    select: {
                        id: true,
                        date: true,
                        book_one_on_one: {
                            select: {
                                form_submission: {
                                    select: {
                                        user: {
                                            select: {
                                                name: true,
                                                email: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        res.success('Time slots fetched successfully', timeSlots);
    } catch (error) {
        console.error('Error fetching time slots:', error);
        res.failure('Failed to fetch time slots', { error: error.message }, 500);
    }
});

// Create multiple time slots
timeSlotRouter.post('/', authenticate, async (req, res: CustomResponse) => {
    try {
        const { slots } = req.body;

        if (!Array.isArray(slots) || slots.length === 0) {
            return res.failure('Slots array is required', {}, 400);
        }

        // Validate each slot
        for (const slot of slots) {
            if (!slot.start_time || typeof slot.start_time !== 'string') {
                return res.failure('Each slot must have a valid start_time', {}, 400);
            }
            if (!slot.capacity || slot.capacity < 1 || slot.capacity > 50) {
                return res.failure('Each slot must have a capacity between 1 and 50', {}, 400);
            }
        }

        // Check for duplicate time slots
        const existingSlots = await prisma.timeSlot.findMany({
            where: {
                start_time: {
                    in: slots.map(slot => slot.start_time)
                }
            }
        });

        if (existingSlots.length > 0) {
            const duplicateTimes = existingSlots.map(slot => slot.start_time);
            return res.failure('Some time slots already exist', { duplicateTimes }, 400);
        }

        const createdSlots = await prisma.timeSlot.createMany({
            data: slots.map(slot => ({
                start_time: slot.start_time,
                capacity: slot.capacity,
                is_active: slot.is_active ?? true
            }))
        });

        // Fetch the created slots to return them
        const newSlots = await prisma.timeSlot.findMany({
            where: {
                start_time: {
                    in: slots.map(slot => slot.start_time)
                }
            },
            orderBy: { start_time: 'asc' }
        });

        res.success('Time slots created successfully', newSlots, 201);
    } catch (error) {
        console.error('Error creating time slots:', error);
        res.failure('Failed to create time slots', { error: error.message }, 500);
    }
});

// Update a time slot
timeSlotRouter.post('/:id', authenticate, async (req, res: CustomResponse) => {
    try {
        const { id } = req.params;
        const { start_time, capacity, is_active } = req.body;

        if (isNaN(parseInt(id))) {
            return res.failure('Invalid time slot ID', { id }, 400);
        }

        // Validate input
        if (start_time && typeof start_time !== 'string') {
            return res.failure('start_time must be a string', {}, 400);
        }
        if (capacity && (capacity < 1 || capacity > 50)) {
            return res.failure('capacity must be between 1 and 50', {}, 400);
        }

        // Check if time slot exists
        const existingSlot = await prisma.timeSlot.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingSlot) {
            return res.failure('Time slot not found', { id }, 404);
        }

        // Check for duplicate start_time if it's being updated
        if (start_time && start_time !== existingSlot.start_time) {
            const duplicateSlot = await prisma.timeSlot.findFirst({
                where: {
                    start_time,
                    id: { not: parseInt(id) }
                }
            });

            if (duplicateSlot) {
                return res.failure('A time slot with this start time already exists', { start_time }, 400);
            }
        }

        const updatedSlot = await prisma.timeSlot.update({
            where: { id: parseInt(id) },
            data: {
                ...(start_time && { start_time }),
                ...(capacity && { capacity }),
                ...(typeof is_active === 'boolean' && { is_active }),
                updated_at: new Date()
            }
        });

        res.success('Time slot updated successfully', updatedSlot);
    } catch (error) {
        console.error('Error updating time slot:', error);
        res.failure('Failed to update time slot', { error: error.message }, 500);
    }
});

// Delete a time slot
timeSlotRouter.delete('/:id', authenticate, async (req, res: CustomResponse) => {
    try {
        const { id } = req.params;

        if (isNaN(parseInt(id))) {
            return res.failure('Invalid time slot ID', { id }, 400);
        }

        // Check if time slot exists
        const existingSlot = await prisma.timeSlot.findUnique({
            where: { id: parseInt(id) },
            include: {
                bookings: true
            }
        });

        if (!existingSlot) {
            return res.failure('Time slot not found', { id }, 404);
        }

        // Check if there are any bookings for this slot
        if (existingSlot.bookings.length > 0) {
            return res.failure('Cannot delete time slot with existing bookings', { 
                bookingCount: existingSlot.bookings.length 
            }, 400);
        }

        await prisma.timeSlot.delete({
            where: { id: parseInt(id) }
        });

        res.success('Time slot deleted successfully', { deletedId: parseInt(id) });
    } catch (error) {
        console.error('Error deleting time slot:', error);
        res.failure('Failed to delete time slot', { error: error.message }, 500);
    }
});

// Get available slots for a specific date
timeSlotRouter.post('/available', authenticate, async (req, res: CustomResponse) => {
    try {
        const { date } = req.body;

        if (!date) {
            return res.failure('Date is required', {}, 400);
        }

        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
            return res.failure('Invalid date format', { date }, 400);
        }

        const timeSlots = await prisma.timeSlot.findMany({
            where: { is_active: true },
            include: {
                bookings: {
                    where: {
                        date: {
                            gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                            lt: new Date(targetDate.setHours(23, 59, 59, 999))
                        }
                    }
                }
            },
            orderBy: { start_time: 'asc' }
        });

        const availableSlots = timeSlots.filter(slot => slot.bookings.length < slot.capacity);

        res.success('Available slots fetched successfully', { 
            date: date,
            availableSlots: availableSlots.map(slot => ({
                id: slot.id,
                start_time: slot.start_time,
                capacity: slot.capacity,
                currentBookings: slot.bookings.length,
                remainingCapacity: slot.capacity - slot.bookings.length
            }))
        });
    } catch (error) {
        console.error('Error fetching available slots:', error);
        res.failure('Failed to fetch available slots', { error: error.message }, 500);
    }
});

export default timeSlotRouter;
