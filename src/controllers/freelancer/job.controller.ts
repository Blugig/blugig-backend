import { Request } from 'express';
import { prisma } from '../../lib/prisma';
import CustomResponse from '../../utils/customResponse';
import { createPaginatedResponse, getPagination } from '../../utils/queryHelpers';
import { AwardedUserType, JobType } from '@prisma/client';
import { getFormDescriptionKey, getFormName, getFormTitleKey } from '../../utils/misc';



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