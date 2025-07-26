import { Request } from 'express';
import { prisma } from '../lib/prisma';
import CustomResponse from '../utils/customResponse';
import { generateFileUrl } from '../lib/fileUpload';
import { Prisma } from '@prisma/client';
import { formSelectFields } from '../lib/serializers/form';

class FormController {
    async createForm(req: Request, res: CustomResponse) {
        try {
            const { formType, ...formData } = req.body;
            const userId = (req as any).user.id as any;

            const validFormTypes = ['SOL', 'API', 'EXP', 'ADM', 'PRM', 'ONE', 'PMO', 'LIR', 'ADH'];
            if (!validFormTypes.includes(formType)) {
                return res.failure('Invalid form type', { formType }, 400);
            }

            const result = await prisma.$transaction(async (tx) => {
                const formSubmission = await tx.formSubmission.create({
                    data: {
                        user_id: parseInt(userId) as number,
                        form_type: formType,
                    } as Prisma.FormSubmissionUncheckedCreateInput
                });

                let detailsData: any;
                switch (formType) {
                    case 'SOL':
                        detailsData = await tx.solutionImplementation.create({
                            data: {
                                form_submission_id: formSubmission.id,
                                project_title: formData.project_title,
                                implementation_type: formData.implementation_type,
                                description: formData.description,
                                team_size: formData.team_size,
                                departments_involved: formData.departments_involved,
                                current_tools: formData.current_tools,
                                implementation_features: formData.implementation_features,
                                timeline: formData.timeline,
                                budget: formData.budget,
                                requirements: formData.requirements
                            }
                        });
                        break;
                    case 'API':
                        detailsData = await tx.apiIntegration.create({
                            data: {
                                form_submission_id: formSubmission.id,
                                integration_type: formData.integration_type,
                                source_system: formData.source_system,
                                data_to_sync: formData.data_to_sync,
                                sync_direction: formData.sync_direction,
                                sync_frequency: formData.sync_frequency,
                                api_access_available: formData.api_access_available,
                                data_volumne: formData.data_volumne,
                                technical_requirements: formData.technical_requirements,
                                integration_features: formData.integration_features,
                                timeline: formData.timeline,
                                budget: formData.budget,
                                description: formData.description
                            }
                        });
                        break;
                    case 'EXP':
                        detailsData = await tx.hireSmartsheetExpert.create({
                            data: {
                                form_submission_id: formSubmission.id,
                                position_type: formData.position_type,
                                job_title: formData.job_title,
                                company_name: formData.company_name,
                                location: formData.location,
                                required_skills: formData.required_skills,
                                experience_level: formData.experience_level,
                                budget: formData.budget,
                                start_date: formData.start_date,
                                contract_duration: formData.contract_duration,
                                job_description: formData.job_description
                            }
                        });
                        break;
                    case 'ADM':
                        detailsData = await tx.systemAdminSupport.create({
                            data: {
                                form_submission_id: formSubmission.id,
                                support_needed: formData.support_needed,
                                smartsheet_plan: formData.smartsheet_plan,
                                number_of_users: formData.number_of_users,
                                current_admin_experience: formData.current_admin_experience,
                                current_challenges: formData.current_challenges,
                                admin_task_needed: formData.admin_task_needed,
                                support_frequency: formData.support_frequency,
                                timezone: formData.timezone,
                                urgency_level: formData.urgency_level,
                                budget: formData.budget,
                                requirements: formData.requirements
                            }
                        });
                        break;
                    case 'PRM':
                        detailsData = await tx.premiumAppSupport.create({
                            data: {
                                form_submission_id: formSubmission.id,
                                organization_name: formData.organization_name,
                                premium_addons: formData.premium_addons,
                                primary_use_case: formData.primary_use_case,
                                current_smartsheet_plan: formData.current_smartsheet_plan,
                                team_size: formData.team_size,
                                implementation_scope: formData.implementation_scope,
                                requirements: formData.requirements,
                                timeline: formData.timeline,
                                budget: formData.budget,
                                primary_contact_email: formData.primary_contact_email
                            }
                        });
                        break;
                    case 'ONE':
                        // Check if the slot is available based on capacity
                        const slotBookings = await tx.timeSlotBooking.count({
                            where: {
                                date: new Date(formData.preferred_date),
                                time_slot_id: formData.time_slot_id
                            }
                        });

                        const timeSlot = await tx.timeSlot.findUnique({
                            where: { id: formData.time_slot_id },
                            select: { capacity: true }
                        });

                        if (!timeSlot) {
                            throw new Error('Selected time slot does not exist.');
                        }

                        if (slotBookings >= timeSlot.capacity) {
                            throw new Error('Selected time slot is already fully booked for this date.');
                        }

                        // Create the BookOneOnOne form
                        detailsData = await tx.bookOneOnOne.create({
                            data: {
                                form_submission_id: formSubmission.id,
                                preferred_date: formData.preferred_date,
                                preferred_time: formData.preferred_time,
                                consultation_focus: formData.consultation_focus,
                                smartsheet_experience: formData.smartsheet_experience,
                                team_size: formData.team_size
                            }
                        });

                        // Create the TimeSlotBooking
                        await tx.timeSlotBooking.create({
                            data: {
                                date: new Date(formData.preferred_date),
                                time_slot_id: formData.time_slot_id,
                                book_one_on_one_id: detailsData.id
                            }
                        });
                        break;
                    case 'PMO':
                        detailsData = await tx.pmoControlCenter.create({
                            data: {
                                form_submission_id: formSubmission.id,
                                organization_name: formData.organization_name,
                                control_centre_type: formData.control_centre_type,
                                required_features: formData.required_features,
                                expected_project_scale: formData.expected_project_scale,
                                team_size: formData.team_size,
                                current_smartsheet_experience: formData.current_smartsheet_experience,
                                budget: formData.budget,
                                timeline: formData.timeline,
                                primary_contact_email: formData.primary_contact_email
                            }
                        });
                        break;
                    case 'LIR':
                        detailsData = await tx.licenseRequest.create({
                            data: {
                                form_submission_id: formSubmission.id,
                                license_type: formData.license_type,
                                company_name: formData.company_name,
                                industry: formData.industry,
                                team_size: formData.team_size,
                                full_name: formData.full_name,
                                email: formData.email,
                                phone: formData.phone,
                                job_title: formData.job_title,
                                timeline: formData.timeline,
                                project_needs: formData.project_needs
                            }
                        });
                        break;
                    case 'ADH':
                        detailsData = await tx.adhocRequest.create({
                            data: {
                                form_submission_id: formSubmission.id,
                                need_help_with: formData.need_help_with,
                                description: formData.description,
                                urgency_level: formData.urgency_level,
                                budget: formData.budget,
                                expected_timeline: formData.expected_timeline
                            }
                        });
                        break;
                }

                return { formSubmission, detailsData };
            });

            return res.success('Form created successfully', {
                formSubmission: result.formSubmission,
                details: result.detailsData
            }, 201);
        } catch (error) {
            console.error('Error creating form:', error);
            return res.failure('Failed to create form', { error: error.message }, 500);
        }
    }

    async editForm(req: Request, res: CustomResponse) {
        try {
            const { formId, formType, ...formData } = req.body;
            const userId = (req as any).user.id as any;

            if (!formId || isNaN(formId)) {
                return res.failure('Invalid form ID', { formId }, 400);
            }

            const validFormTypes = ['SOL', 'API', 'EXP', 'ADM', 'PRM', 'ONE', 'PMO', 'LIR', 'ADH'];
            if (!validFormTypes.includes(formType)) {
                return res.failure('Invalid form type', { formType }, 400);
            }

            // Check if form exists and belongs to the user
            const existingForm = await prisma.formSubmission.findFirst({
                where: {
                    id: parseInt(formId),
                    user_id: parseInt(userId),
                    form_type: formType
                }
            });

            if (!existingForm) {
                return res.failure('Form not found or unauthorized', { formId }, 404);
            }

            const result = await prisma.$transaction(async (tx) => {
                // Update the form submission
                const formSubmission = await tx.formSubmission.update({
                    where: { id: parseInt(formId) },
                    data: {
                        updated_at: new Date()
                    } as Prisma.FormSubmissionUncheckedUpdateInput
                });

                let detailsData: any;
                switch (formType) {
                    case 'SOL':
                        detailsData = await tx.solutionImplementation.update({
                            where: { form_submission_id: formSubmission.id },
                            data: {
                                project_title: formData.project_title,
                                implementation_type: formData.implementation_type,
                                description: formData.description,
                                team_size: formData.team_size,
                                departments_involved: formData.departments_involved,
                                current_tools: formData.current_tools,
                                implementation_features: formData.implementation_features,
                                timeline: formData.timeline,
                                budget: formData.budget,
                                requirements: formData.requirements
                            }
                        });
                        break;
                    case 'API':
                        detailsData = await tx.apiIntegration.update({
                            where: { form_submission_id: formSubmission.id },
                            data: {
                                integration_type: formData.integration_type,
                                source_system: formData.source_system,
                                data_to_sync: formData.data_to_sync,
                                sync_direction: formData.sync_direction,
                                sync_frequency: formData.sync_frequency,
                                api_access_available: formData.api_access_available,
                                data_volumne: formData.data_volumne,
                                technical_requirements: formData.technical_requirements,
                                integration_features: formData.integration_features,
                                timeline: formData.timeline,
                                budget: formData.budget,
                                description: formData.description
                            }
                        });
                        break;
                    case 'EXP':
                        detailsData = await tx.hireSmartsheetExpert.update({
                            where: { form_submission_id: formSubmission.id },
                            data: {
                                position_type: formData.position_type,
                                job_title: formData.job_title,
                                company_name: formData.company_name,
                                location: formData.location,
                                required_skills: formData.required_skills,
                                experience_level: formData.experience_level,
                                budget: formData.budget,
                                start_date: formData.start_date,
                                contract_duration: formData.contract_duration,
                                job_description: formData.job_description
                            }
                        });
                        break;
                    case 'ADM':
                        detailsData = await tx.systemAdminSupport.update({
                            where: { form_submission_id: formSubmission.id },
                            data: {
                                support_needed: formData.support_needed,
                                smartsheet_plan: formData.smartsheet_plan,
                                number_of_users: formData.number_of_users,
                                current_admin_experience: formData.current_admin_experience,
                                current_challenges: formData.current_challenges,
                                admin_task_needed: formData.admin_task_needed,
                                support_frequency: formData.support_frequency,
                                timezone: formData.timezone,
                                urgency_level: formData.urgency_level,
                                budget: formData.budget,
                                requirements: formData.requirements
                            }
                        });
                        break;
                    case 'PRM':
                        detailsData = await tx.premiumAppSupport.update({
                            where: { form_submission_id: formSubmission.id },
                            data: {
                                organization_name: formData.organization_name,
                                premium_addons: formData.premium_addons,
                                primary_use_case: formData.primary_use_case,
                                current_smartsheet_plan: formData.current_smartsheet_plan,
                                team_size: formData.team_size,
                                implementation_scope: formData.implementation_scope,
                                requirements: formData.requirements,
                                timeline: formData.timeline,
                                budget: formData.budget,
                                primary_contact_email: formData.primary_contact_email
                            }
                        });
                        break;
                    case 'ONE':
                        detailsData = await tx.bookOneOnOne.update({
                            where: { form_submission_id: formSubmission.id },
                            data: {
                                preferred_date: formData.preferred_date,
                                preferred_time: formData.preferred_time,
                                consultation_focus: formData.consultation_focus,
                                smartsheet_experience: formData.smartsheet_experience,
                                team_size: formData.team_size
                            }
                        });
                        break;
                    case 'PMO':
                        detailsData = await tx.pmoControlCenter.update({
                            where: { form_submission_id: formSubmission.id },
                            data: {
                                organization_name: formData.organization_name,
                                control_centre_type: formData.control_centre_type,
                                required_features: formData.required_features,
                                expected_project_scale: formData.expected_project_scale,
                                team_size: formData.team_size,
                                current_smartsheet_experience: formData.current_smartsheet_experience,
                                budget: formData.budget,
                                timeline: formData.timeline,
                                primary_contact_email: formData.primary_contact_email
                            }
                        });
                        break;
                    case 'LIR':
                        detailsData = await tx.licenseRequest.update({
                            where: { form_submission_id: formSubmission.id },
                            data: {
                                license_type: formData.license_type,
                                company_name: formData.company_name,
                                industry: formData.industry,
                                team_size: formData.team_size,
                                full_name: formData.full_name,
                                email: formData.email,
                                phone: formData.phone,
                                job_title: formData.job_title,
                                timeline: formData.timeline,
                                project_needs: formData.project_needs
                            }
                        });
                        break;
                    case 'ADH':
                        detailsData = await tx.adhocRequest.update({
                            where: { form_submission_id: formSubmission.id },
                            data: {
                                need_help_with: formData.need_help_with,
                                description: formData.description,
                                urgency_level: formData.urgency_level,
                                budget: formData.budget,
                                expected_timeline: formData.expected_timeline
                            }
                        });
                        break;
                }

                return { formSubmission, detailsData };
            });

            return res.success('Form updated successfully', {
                formSubmission: result.formSubmission,
                details: result.detailsData
            }, 200);
        } catch (error) {
            console.error('Error updating form:', error);
            return res.failure('Failed to update form', { error: error.message }, 500);
        }
    }

    async getFormDetails(req: Request, res: CustomResponse) {
        try {
            const { formId, formType } = req.body;

            if (isNaN(formId)) {
                return res.failure('Invalid form ID', { id: req.params.id }, 400);
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
                        }
                    },
                    payment: {
                        select: {
                            id: true,
                            base_amount: true,
                            platform_fee_amount: true,
                            tax_amount: true,
                            total_amount: true,
                            created_at: true
                        }
                    }
                }
            });

            if (!formSubmission) {
                return res.failure("Form not found", { formId }, 404);
            }

            if (formSubmission.user_id !== (req as any).user.id) {
                return res.failure('Unauthorized to access this form', {}, 403);
            }

            return res.success("Form details fetched successfully", { ...formSubmission }, 200);
        } catch (error) {
            console.error('Error fetching form:', error);
            return res.failure('Failed to fetch form', { error: error.message }, 500);
        }
    }

    async getFormMessages(req: Request, res: CustomResponse) {
        try {
            const { formId, formType } = req.body;

            if (isNaN(formId)) {
                return res.failure('Invalid form ID', { id: formId }, 400);
            }

            const formSubmission = await prisma.formSubmission.findUnique({
                where: { id: +formId },
                include: {
                    ...formSelectFields,
                    conversation: {
                        select: {
                            id: true,
                            user_id: true,
                            admin: {
                                select: {
                                    id: true,
                                    name: true,
                                    profile_photo: true,
                                }
                            },
                            messages: {
                                include: {
                                    offer: {
                                        select: {
                                            id: true,
                                            status: true,
                                            type: true,
                                            budget: true,
                                            description: true,
                                            timeline: true,
                                            name: true,
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!formSubmission) {
                return res.failure("Form not found", { formId }, 404);
            }

            if (formSubmission.user_id !== (req as any).user.id) {
                return res.failure('Unauthorized to access this form', {}, 403);
            }

            return res.success("Form messages fetched successfully", formSubmission.conversation);

        } catch (error) {
            console.error('Error fetching form messages:', error);
            return res.failure('Failed to fetch form messages', { error: error.message }, 500);
        }
    }

    async getChatList(req: Request, res: CustomResponse) {
        try {
            const userId = (req as any).user.id;

            const conversations = await prisma.conversation.findMany({
                where: { user_id: userId },
                orderBy: {
                    updated_at: 'desc'
                },
                include: {
                    admin: {
                        select: {
                            id: true,
                            name: true,
                            profile_photo: true,
                        }
                    },
                    latest_message: {
                        select: {
                            body: true,
                            time: true,
                            message_type: true,
                            is_read: true,
                        }
                    },
                }
            });


            return res.success('Chat list fetched successfully', conversations);

        } catch (error) {
            console.error('Error fetching chat list:', error);
            return res.failure('Failed to fetch chat list', { error: error.message }, 500);
        }
    }

    async getUserForms(req: Request, res: CustomResponse) {
        try {
            const userId = (req as any).user.id;
            const formType = req.query.formType as string | undefined;

            const whereClause: any = { user_id: userId };
            if (formType) {
                whereClause.form_type = formType;
            }

            const formSubmissions = await prisma.formSubmission.findMany({
                where: whereClause,
                orderBy: {
                    created_at: 'desc'
                },
                include: formSelectFields
            });

            const formattedSubmissions = formSubmissions.map(submission => {
                let details: any;
                switch (submission.form_type) {
                    case 'SOL':
                        details = submission.solution_implementation;
                        break;
                    case 'API':
                        details = submission.api_integration;
                        break;
                    case 'EXP':
                        details = submission.hire_smartsheet_expert;
                        break;
                    case 'ADM':
                        details = submission.system_admin_support;
                        break;
                    case 'ADH':
                        details = submission.adhoc_request;
                        break;
                    case 'PRM':
                        details = submission.premium_app_support;
                        break;
                    case 'ONE':
                        details = submission.book_one_on_one;
                        break;
                    case 'PMO':
                        details = submission.pmo_control_center;
                        break;
                    case 'LIR':
                        details = submission.license_request;
                        break;
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
                    ...baseSubmission
                } = submission;

                return {
                    ...baseSubmission,
                    details
                };
            });

            return res.success('Forms retrieved successfully', formattedSubmissions);
        } catch (error) {
            console.error('Error fetching user forms:', error);
            return res.failure('Failed to fetch forms', { error: error.message }, 500);
        }
    }
}

export default new FormController();
