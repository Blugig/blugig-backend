import { Request } from 'express';

import { prisma } from '../../lib/prisma';
import CustomResponse from '../../utils/customResponse';
import { createPaginatedResponse, getPagination } from '../../utils/queryHelpers';
import { generateAccessToken } from '../../utils/sendMail';

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

        const user = (req as any).user;
        const tempToken = generateAccessToken(user.id, user.userType, "3h");

        return res.success("Form details fetched successfully", {
            ...base,
            session: tempToken,
            details
        }, 200);
    } catch (error) {
        res.failure("Failed to fetch form details", { error: error.message }, 500);
    }
};

export const createOffer = async (req: Request, res: CustomResponse) => {
    try {
        const { 
            name, description, timeline, 
            budget, type, user_id,
            estimated_hours, total_cost, deliverables 
        } = req.body;

        let strDeliverables = deliverables.join(",");

        const offer = await prisma.offer.create({
            data: {
                name,
                description,
                type,
                timeline,
                budget,
                estimated_hours: estimated_hours,
                total_cost: total_cost ? parseInt(total_cost) : null,
                deliverables: strDeliverables,
                user_id: parseInt(user_id) as number,
                status: 'pending'
            }
        });

        res.success("Offer created successfully", offer, 201);
    } catch (error) {
        res.failure("Failed to create offer", { error: error.message }, 500);
    }
};