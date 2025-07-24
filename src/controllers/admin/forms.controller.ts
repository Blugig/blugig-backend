import { Request } from 'express';

import { prisma } from '../../lib/prisma';
import CustomResponse from '../../utils/customResponse';
import { createPaginatedResponse, getPagination } from '../../utils/queryHelpers';
import { stat } from 'fs';

export const getAllFormsOfType = async (req: Request, res: CustomResponse) => {
    try {
        const { formType } = req.params;
        const { page, take, skip } = getPagination(req);

        const validFormTypes = ['SOL', 'API', 'EXP', 'ADM', 'ADH', 'PRM', 'ONE', 'PMO', 'LIR'];
        if (!validFormTypes.includes(formType)) {
            return res.failure('Invalid form type', { formType }, 400);
        }

        const includeMap = {
            SOL: { solution_implementation: true },
            API: { api_integration: true },
            EXP: { hire_smartsheet_expert: true },
            ADM: { system_admin_support: true },
            ADH: { adhoc_request: true },
            PRM: { premium_app_support: true },
            ONE: { book_one_on_one: true },
            PMO: { pmo_control_center: true },
            LIR: { license_request: true },
        };

        // Add user relation (just id and name)
        const include = {
            ...includeMap[formType],
            user: { select: { id: true, name: true } }
        };

        const [formSubmissions, totalCount] = await Promise.all([
            prisma.formSubmission.findMany({
                where: { form_type: formType as any },
                orderBy: { created_at: 'desc' },
                include,
                skip,
                take,
            }),
            prisma.formSubmission.count({ where: { form_type: formType as any } }),
        ]);

        const detailsList = formSubmissions.map((sub: any) => {
            let details: any;
            switch (formType) {
                case 'SOL': details = sub.solution_implementation; break;
                case 'API': details = sub.api_integration; break;
                case 'EXP': details = sub.hire_smartsheet_expert; break;
                case 'ADM': details = sub.system_admin_support; break;
                case 'ADH': details = sub.adhoc_request; break;
                case 'PRM': details = sub.premium_app_support; break;
                case 'ONE': details = sub.book_one_on_one; break;
                case 'PMO': details = sub.pmo_control_center; break;
                case 'LIR': details = sub.license_request; break;
            }

            return {
                ...details,
                user: sub.user ? { id: sub.user.id, name: sub.user.name } : null
            };
        });

        const paginatedResponse = createPaginatedResponse(detailsList, totalCount, page, take);

        res.success("Form details fetched successfully", paginatedResponse, 200);
    } catch (error) {
        res.failure("Failed to fetch forms", { error: error.message }, 500);
    }
};

export const getFormDetails = async (req: Request, res: CustomResponse) => {
    try {
        const { formId, formType } = req.body;

        const validFormTypes = ['SOL', 'API', 'EXP', 'ADM', 'ADH', 'PRM', 'ONE', 'PMO', 'LIR'];
        if (!validFormTypes.includes(formType)) {
            return res.failure('Invalid form type', { formType }, 400);
        }

        if (!formId || isNaN(formId)) {
            return res.failure('Invalid form ID', { formId }, 400);
        }

        const formSubmission = await prisma.formSubmission.findUnique({
            where: { id: +formId },
            include: {
                solution_implementation: formType === 'SOL',
                api_integration: formType === 'API',
                hire_smartsheet_expert: formType === 'EXP',
                system_admin_support: formType === 'ADM',
                adhoc_request: formType === 'ADH',
                premium_app_support: formType === 'PRM',
                book_one_on_one: formType === 'ONE',
                pmo_control_center: formType === 'PMO',
                license_request: formType === 'LIR',
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                conversation: {
                    select: {
                        id: true,
                        user_id: true,
                        messages: {
                            select: {
                                id: true,
                                body: true,
                                time: true,
                                media_url: true,
                                media_type: true,
                                message_type: true,
                                offer: true,
                                conversation_id: true,
                                sender_admin_id: true, // Changed from null to true
                                sender_user_id: true, // Changed from null to true
                            },
                            orderBy: {
                                time: 'asc'
                            }
                        }
                    }
                }
            }
        });

        if (!formSubmission) {
            return res.failure("Form not found", { formId }, 404);
        }

        let details: any;
        switch (formType) {
            case 'SOL': details = formSubmission.solution_implementation; break;
            case 'API': details = formSubmission.api_integration; break;
            case 'EXP': details = formSubmission.hire_smartsheet_expert; break;
            case 'ADM': details = formSubmission.system_admin_support; break;
            case 'ADH': details = formSubmission.adhoc_request; break;
            case 'PRM': details = formSubmission.premium_app_support; break;
            case 'ONE': details = formSubmission.book_one_on_one; break;
            case 'PMO': details = formSubmission.pmo_control_center; break;
            case 'LIR': details = formSubmission.license_request; break;
        }

        const {
            solution_implementation,
            api_integration,
            hire_smartsheet_expert,
            system_admin_support,
            adhoc_request,
            premium_app_support,
            book_one_on_one,
            pmo_control_center,
            license_request,
            ...base
        } = formSubmission;

        return res.success("Form details fetched successfully", {
            ...base,
            details
        }, 200);
    } catch (error) {
        res.failure("Failed to fetch form details", { error: error.message }, 500);
    }
};

export const createOffer = async (req: Request, res: CustomResponse) => {
    try {
        const { name, description, timeline, budget, type, user_id } = req.body;

        const offer = await prisma.offer.create({
            data: {
                name,
                description,
                type,
                timeline,
                budget,
                user_id: parseInt(user_id) as number,
                status: 'pending'
            }
        });

        res.success("Offer created successfully", offer, 201);
    } catch (error) {
        res.failure("Failed to create offer", { error: error.message }, 500);
    }
};

export const getAvailableSlots = async (req: Request, res: CustomResponse) => {
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

export const createTimeSlots = async (req: Request, res: CustomResponse) => {
    try {
        const { slots } = req.body;

        // slots: [{ start_time: "9:00 AM", capacity: 2 }, ...]
        if (!Array.isArray(slots) || slots.length === 0) {
            return res.failure("Slots array is required", {}, 400);
        }

        const created = await prisma.timeSlot.createMany({
            data: slots.map((slot: any) => ({
                start_time: slot.start_time,
                capacity: slot.capacity ?? 1,
                is_active: slot.is_active ?? true,
            }))
        });

        const createdSlots = await prisma.timeSlot.findMany({
            orderBy: { id: 'desc' },
            take: slots.length,
        });

        res.success("Time slots created successfully", createdSlots, 201);
    } catch (error) {
        res.failure("Failed to create time slots", { error: error.message }, 500);
    }
}