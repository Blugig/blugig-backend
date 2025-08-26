import { Request } from 'express';
import { prisma } from '../../lib/prisma';
import CustomResponse from '../../utils/customResponse';
import { createPaginatedResponse, getPagination } from '../../utils/queryHelpers';
import { AwardedUserType, JobType } from '@prisma/client';
import { getFormDescriptionKey, getFormName, getFormTitleKey } from '../../utils/misc';
import { generateAccessToken } from '@/utils/sendMail';



export const getAllJobs = async (req: Request, res: CustomResponse) => {
    try {
        const { page, take, skip } = getPagination(req);

        const [fetchedJobs, totalCount] = await Promise.all([
            prisma.job.findMany({
                where: {
                    job_type: JobType.open
                },
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    form_submission: {
                        include: {
                            solution_implementation: true,
                            api_integration: true,
                            hire_smartsheet_expert: true,
                            system_admin_support: true,
                            adhoc_request: true,
                            premium_app_support: true,
                            book_one_on_one: true,
                            pmo_control_center: true,
                            license_request: true,
                        }
                    },
                },
                skip,
                take,
                orderBy: { created_at: "desc" },
            }),
            prisma.job.count({ where: { job_type: JobType.open } }),
        ]);

        // Remove unwanted fields from each job before further processing
        const jobs = fetchedJobs.map(job => {
            const { awarded_admin_id, awarded_freelancer_id, awarded_to_user_type, job_type, awarded_at, ...rest } = job as any;
            return rest;
        });

        // Process jobs to add form details
        const processedJobs = jobs.map(job => {
            if (job.form_submission) {
                let details: any;
                switch (job.form_submission.form_type) {
                    case 'SOL':
                        details = job.form_submission.solution_implementation;
                        break;
                    case 'API':
                        details = job.form_submission.api_integration;
                        break;
                    case 'EXP':
                        details = job.form_submission.hire_smartsheet_expert;
                        break;
                    case 'ADM':
                        details = job.form_submission.system_admin_support;
                        break;
                    case 'ADH':
                        details = job.form_submission.adhoc_request;
                        break;
                    case 'PRM':
                        details = job.form_submission.premium_app_support;
                        break;
                    case 'ONE':
                        details = job.form_submission.book_one_on_one;
                        break;
                    case 'PMO':
                        details = job.form_submission.pmo_control_center;
                        break;
                    case 'LIR':
                        details = job.form_submission.license_request;
                        break;
                }

                return {
                    ...job,
                    form_submission: {
                        form_type: job.form_submission.form_type,
                        form_name: getFormName(job.form_submission.form_type),
                        form_title: details ? details[getFormTitleKey(job.form_submission.form_type)] || null : null,
                        form_description: details ? details[getFormDescriptionKey(job.form_submission.form_type)] || null : null,
                    }
                };
            }
            return job;
        });

        const paginatedResponse = createPaginatedResponse(processedJobs, totalCount, page, take);

        res.success("Jobs fetched successfully", paginatedResponse, 200);
    } catch (error) {
        console.log(error);
        res.failure("Failed to fetch jobs", error, 500);
    }
}

export const getJobDetails = async (req: Request, res: CustomResponse) => {
    try {
        const { jobId } = req.body;
        const { id: freelancerId, userType } = (req as any).user;

        if (!jobId) {
            return res.failure("Job ID is required", null, 400);
        }

        // Fetch job details with all related data
        const job = await prisma.job.findUnique({
            where: { id: parseInt(jobId) },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile_photo: true
                    }
                },
                form_submission: {
                    include: {
                        solution_implementation: true,
                        api_integration: true,
                        hire_smartsheet_expert: true,
                        system_admin_support: true,
                        adhoc_request: true,
                        premium_app_support: true,
                        book_one_on_one: true,
                        pmo_control_center: true,
                        license_request: true,
                    }
                }
            }
        });

        if (!job) {
            return res.failure("Job not found", null, 404);
        }

        // Check if freelancer has access to this job
        // Freelancers can access:
        // 1. Open jobs
        // 2. Jobs awarded to them
        const hasAccess = job.job_type === JobType.open || 
                         (job.job_type === JobType.awarded && 
                          job.awarded_to_user_type === AwardedUserType.freelancer && 
                          job.awarded_freelancer_id === parseInt(freelancerId));

        if (!hasAccess) {
            return res.failure("Access denied to this job", null, 403);
        }

        // Check if conversation exists between freelancer and client for this job
        const conversation = await prisma.conversation.findFirst({
            where: {
                job_id: parseInt(jobId),
                OR: [
                    { 
                        freelancer_id: parseInt(freelancerId),
                        user_id: job.client_id 
                    }
                ]
            },
            include: {
                messages: {
                    include: {
                        offer: true
                    },
                    orderBy: { time: 'asc' }
                }
            }
        });

        // Process form submission data like in form details
        const formSubmission = job.form_submission;
        let details = {};
        let formType = '';

        if (formSubmission) {
            // Determine form type and extract details
            if (formSubmission.solution_implementation) {
                formType = 'solution_implementation';
                const { id, form_submission_id, ...rest } = formSubmission.solution_implementation;
                details = rest;
            } else if (formSubmission.api_integration) {
                formType = 'api_integration';
                const { id, form_submission_id, ...rest } = formSubmission.api_integration;
                details = rest;
            } else if (formSubmission.hire_smartsheet_expert) {
                formType = 'hire_smartsheet_expert';
                const { id, form_submission_id, ...rest } = formSubmission.hire_smartsheet_expert;
                details = rest;
            } else if (formSubmission.system_admin_support) {
                formType = 'system_admin_support';
                const { id, form_submission_id, ...rest } = formSubmission.system_admin_support;
                details = rest;
            } else if (formSubmission.adhoc_request) {
                formType = 'adhoc_request';
                const { id, form_submission_id, ...rest } = formSubmission.adhoc_request;
                details = rest;
            } else if (formSubmission.premium_app_support) {
                formType = 'premium_app_support';
                const { id, form_submission_id, ...rest } = formSubmission.premium_app_support;
                details = rest;
            } else if (formSubmission.book_one_on_one) {
                formType = 'book_one_on_one';
                const { id, form_submission_id, ...rest } = formSubmission.book_one_on_one;
                details = rest;
            } else if (formSubmission.pmo_control_center) {
                formType = 'pmo_control_center';
                const { id, form_submission_id, ...rest } = formSubmission.pmo_control_center;
                details = rest;
            } else if (formSubmission.license_request) {
                formType = 'license_request';
                const { id, form_submission_id, ...rest } = formSubmission.license_request;
                details = rest;
            }
        }

        const tempToken = generateAccessToken(freelancerId, userType, "5h");

        // Prepare response data
        const responseData = {
            job: {
                id: job.id,
                form_submission_id: job.form_submission_id,
                client_id: job.client_id,
                job_type: job.job_type,
                created_at: job.created_at,
                updated_at: job.updated_at,
                ...(job.job_type === JobType.awarded && {
                    awarded_at: job.awarded_at,
                    awarded_to_user_type: job.awarded_to_user_type
                })
            },
            client: job.client,
            session: tempToken,
            details,
            formType: job.form_submission.form_type,
            formName: job.form_submission.form_type ? getFormName(job.form_submission.form_type) : 'Job Details',
            conversation: conversation ? {
                id: conversation.id,
                messages: conversation.messages
            } : null,
        };

        res.success("Job details fetched successfully", responseData, 200);
    } catch (error) {
        console.log(error);
        res.failure("Failed to fetch job details", error, 500);
    }
}

export const getAwardedJobs = async (req: Request, res: CustomResponse) => {
    try {
        const { id } = (req as any).user;
        const { page, take, skip } = getPagination(req);

        const [jobs, totalCount] = await Promise.all([
            prisma.job.findMany({
                where: {
                    job_type: JobType.awarded,
                    awarded_to_user_type: AwardedUserType.freelancer,
                    awarded_freelancer_id: +id
                },
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    form_submission: {
                        include: {
                            solution_implementation: true,
                            api_integration: true,
                            hire_smartsheet_expert: true,
                            system_admin_support: true,
                            adhoc_request: true,
                            premium_app_support: true,
                            book_one_on_one: true,
                            pmo_control_center: true,
                            license_request: true,
                        }
                    },
                },
                skip,
                take,
                orderBy: { created_at: "desc" },
            }),
            prisma.job.count({
                where: {
                    job_type: JobType.awarded,
                    awarded_to_user_type: AwardedUserType.freelancer,
                    awarded_freelancer_id: +id
                }
            }),
        ]);

        // Process jobs to add form details
        const processedJobs = jobs.map(job => {
            if (job.form_submission) {
                let details: any;
                switch (job.form_submission.form_type) {
                    case 'SOL':
                        details = job.form_submission.solution_implementation;
                        break;
                    case 'API':
                        details = job.form_submission.api_integration;
                        break;
                    case 'EXP':
                        details = job.form_submission.hire_smartsheet_expert;
                        break;
                    case 'ADM':
                        details = job.form_submission.system_admin_support;
                        break;
                    case 'ADH':
                        details = job.form_submission.adhoc_request;
                        break;
                    case 'PRM':
                        details = job.form_submission.premium_app_support;
                        break;
                    case 'ONE':
                        details = job.form_submission.book_one_on_one;
                        break;
                    case 'PMO':
                        details = job.form_submission.pmo_control_center;
                        break;
                    case 'LIR':
                        details = job.form_submission.license_request;
                        break;
                }

                return {
                    ...job,
                    form_submission: {
                        form_type: job.form_submission.form_type,
                        form_name: getFormName(job.form_submission.form_type),
                        form_title: details ? details[getFormTitleKey(job.form_submission.form_type)] || null : null,
                        form_description: details ? details[getFormDescriptionKey(job.form_submission.form_type)] || null : null,
                    }
                };
            }
            return job;
        });

        const paginatedResponse = createPaginatedResponse(processedJobs, totalCount, page, take);

        res.success("Jobs fetched successfully", paginatedResponse, 200);
    } catch (error) {
        console.log(error);
        res.failure("Failed to fetch jobs", error, 500);
    }
}

export const getPendingJobs = async (req: Request, res: CustomResponse) => {
    try {
        const { id } = (req as any).user;
        const { page, take, skip } = getPagination(req);

        const [jobs, totalCount] = await Promise.all([
            prisma.job.findMany({
                where: {
                    job_type: JobType.open,
                    conversations: {
                        some: {
                            freelancer_id: +id
                        }
                    }
                },
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    form_submission: {
                        include: {
                            solution_implementation: true,
                            api_integration: true,
                            hire_smartsheet_expert: true,
                            system_admin_support: true,
                            adhoc_request: true,
                            premium_app_support: true,
                            book_one_on_one: true,
                            pmo_control_center: true,
                            license_request: true,
                        }
                    },
                    conversations: {
                        where: {
                            freelancer_id: +id
                        },
                        select: {
                            id: true,
                            conversation_type: true,
                            created_at: true
                        }
                    }
                },
                skip,
                take,
                orderBy: { created_at: "desc" },
            }),
            prisma.job.count({
                where: {
                    job_type: JobType.open,
                    conversations: {
                        some: {
                            freelancer_id: +id
                        }
                    }
                }
            }),
        ]);

        console.log(jobs);

        // Process jobs to add form details
        const processedJobs = jobs.map(job => {
            if (job.form_submission) {
                let details: any;
                switch (job.form_submission.form_type) {
                    case 'SOL':
                        details = job.form_submission.solution_implementation;
                        break;
                    case 'API':
                        details = job.form_submission.api_integration;
                        break;
                    case 'EXP':
                        details = job.form_submission.hire_smartsheet_expert;
                        break;
                    case 'ADM':
                        details = job.form_submission.system_admin_support;
                        break;
                    case 'ADH':
                        details = job.form_submission.adhoc_request;
                        break;
                    case 'PRM':
                        details = job.form_submission.premium_app_support;
                        break;
                    case 'ONE':
                        details = job.form_submission.book_one_on_one;
                        break;
                    case 'PMO':
                        details = job.form_submission.pmo_control_center;
                        break;
                    case 'LIR':
                        details = job.form_submission.license_request;
                        break;
                }

                return {
                    ...job,
                    form_submission: {
                        form_type: job.form_submission.form_type,
                        form_name: getFormName(job.form_submission.form_type),
                        form_title: details ? details[getFormTitleKey(job.form_submission.form_type)] || null : null,
                        form_description: details ? details[getFormDescriptionKey(job.form_submission.form_type)] || null : null,
                    }
                };
            }
            return job;
        });

        const paginatedResponse = createPaginatedResponse(processedJobs, totalCount, page, take);

        res.success("Jobs fetched successfully", paginatedResponse, 200);
    } catch (error) {
        console.log(error);
        res.failure("Failed to fetch jobs", error, 500);
    }
}