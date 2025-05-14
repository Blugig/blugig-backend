import { Request } from 'express';
import { prisma } from '../lib/prisma';
import CustomResponse from '../utils/customResponse';
import { generateFileUrl } from '../lib/fileUpload';

class FormController {
    async createForm(req: Request, res: CustomResponse) {
        try {
            const { formType, ...formData } = req.body;
            const userId = (req as any).user.id;

            const validFormTypes = ['SOL', 'API', 'EXP', 'ADM', 'REP', 'PRM', 'ONE', 'PMO', 'LIR'];
            if (!validFormTypes.includes(formType)) {
                return res.failure('Invalid form type', { formType }, 400);
            }

            const generatedAttachmentUrl = generateFileUrl(req.file?.filename);

            const result = await prisma.$transaction(async (tx) => {
                const formSubmission = await tx.formSubmission.create({
                    data: {
                        user_id: parseInt(userId),
                        form_type: formType
                    }
                });

                let detailsData: any;
                switch (formType) {
                    case 'SOL':
                        detailsData = await tx.solutionImplementation.create({
                            data: {
                                form_submission_id: formSubmission.id,
                                project_name: formData.project_name,
                                project_type: formData.project_type,
                                industry: formData.industry,
                                project_goals: formData.project_goals,
                                timeline: formData.timeline,
                                requirements: formData.requirements,
                                budget: formData.budget,
                                contact_preference: formData.contact_preference,
                                attachment: generatedAttachmentUrl,
                                attachmentType: req.file?.mimetype,
                            }
                        });
                        break;
                    case 'API':
                        detailsData = await tx.apiIntegration.create({
                            data: {
                                form_submission_id: formSubmission.id,
                                integration_type: formData.integration_type,
                                target_application: formData.target_application,
                                integration_objective: formData.integration_objective,
                                timeline: formData.timeline,
                                budget: formData.budget,
                                instructions: formData.instructions,
                                attachment: generatedAttachmentUrl,
                                attachmentType: req.file?.mimetype,
                            }
                        });
                        break;
                    case 'EXP':
                        detailsData = await tx.hireSmartsheetExpert.create({
                            data: {
                                form_submission_id: formSubmission.id,
                                requirements: formData.requirements,
                                is_full_time: formData.is_full_time,
                                project_scope: formData.project_scope,
                                expected_duration: formData.expected_duration,
                                domain_focus: formData.domain_focus,
                                start_date: new Date(formData.start_date),
                                additional_notes: formData.additional_notes,
                                contact_preference: formData.contact_preference,
                                attachment: generatedAttachmentUrl,
                                attachmentType: req.file?.mimetype,
                            }
                        });
                        break;
                    case 'ADM':
                        detailsData = await tx.systemAdminSupport.create({
                            data: {
                                form_submission_id: formSubmission.id,
                                company_name: formData.company_name,
                                number_of_users: formData.number_of_users,
                                type_of_support: formData.type_of_support,
                                start_date: new Date(formData.start_date),
                                budget: formData.budget,
                                support_needs: formData.support_needs,
                                contact_preference: formData.contact_preference,
                                attachment: generatedAttachmentUrl,
                                attachmentType: req.file?.mimetype,
                            }
                        });
                        break;
                    case 'REP':
                        detailsData = await tx.reportsDashboard.create({
                            data: {
                                form_submission_id: formSubmission.id,
                                request_type: formData.request_type,
                                requirements: formData.requirements,
                                attachment: generatedAttachmentUrl,
                                attachmentType: req.file?.mimetype,
                                budget: parseInt(formData.budget) || null,
                                timeline: formData.timeline,
                                instructions: formData.instructions,
                                contact_preference: formData.contact_preference,
                            }
                        });
                        break;
                    case 'PRM':
                        detailsData = await tx.premiumAppSupport.create({
                            data: {
                                form_submission_id: formSubmission.id,
                                add_on_to_configure: formData.add_on_to_configure,
                                objective: formData.objective,
                                current_setup_status: formData.current_setup_status,
                                integration_needs: formData.integration_needs,
                                start_date: new Date(formData.start_date),
                                instruction: formData.instruction,
                                contact_preference: formData.contact_preference,
                                attachment: generatedAttachmentUrl,
                                attachmentType: req.file?.mimetype,
                            }
                        });
                        break;
                    case 'ONE':
                        detailsData = await tx.bookOneOnOne.create({
                            data: {
                                form_submission_id: formSubmission.id,
                                consultation_focus: formData.consultation_focus,
                                time_slot: formData.time_slot,
                                time_zone: formData.time_zone,
                                preferred_date: new Date(formData.preferred_date),
                                preferred_meeting_platform: formData.preferred_meeting_platform,
                                full_name: formData.full_name,
                                company_name: formData.company_name,
                                business_email: formData.business_email,
                                phone_number: formData.phone_number,
                                agenda: formData.agenda,
                                attachment: generatedAttachmentUrl,
                                attachmentType: req.file?.mimetype,
                            }
                        });
                        break;
                    case 'PMO':
                        detailsData = await tx.pmoControlCenter.create({
                            data: {
                                form_submission_id: formSubmission.id,
                                service_type: formData.service_type,
                                industry: formData.industry,
                                project_details: formData.project_details,
                                expected_projects: parseInt(formData.expected_projects),
                                smartsheet_admin_access: formData.smartsheet_admin_access,
                                current_setup: formData.current_setup,
                                timeline: formData.timeline,
                                additional_notes: formData.additional_notes,
                                contact_preference: formData.contact_preference,
                                attachment: generatedAttachmentUrl,
                                attachmentType: req.file?.mimetype,
                            }
                        });
                        break;
                    case 'LIR':
                        detailsData = await tx.licenseRequest.create({
                            data: {
                                form_submission_id: formSubmission.id,
                                name: formData.name,
                                company_name: formData.company_name,
                                company_email: formData.company_email,
                                company_address: formData.company_address,
                                state: formData.state,
                                country: formData.country,
                                pincode: parseInt(formData.pincode),
                                license_type: formData.license_type,
                                number_of_licenses: formData.number_of_licenses,
                                premium_add_ons: formData.premium_add_ons,
                                instructions: formData.instructions,
                                selected_plan: formData.selected_plan,
                                plan_duration: formData.plan_duration,
                                attachment: generatedAttachmentUrl,
                                attachmentType: req.file?.mimetype,
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
                    reports_dashboard: formType === 'REP',
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
                            messages: true
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
                include: {
                    solution_implementation: true,
                    api_integration: true,
                    hire_smartsheet_expert: true,
                    system_admin_support: true,
                    reports_dashboard: true,
                    premium_app_support: true,
                    book_one_on_one: true,
                    pmo_control_center: true,
                    license_request: true,
                }
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
                    case 'REP':
                        details = submission.reports_dashboard;
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
                    reports_dashboard,
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
