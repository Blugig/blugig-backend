import { Request } from 'express';
import bcrypt from 'bcrypt';

import { prisma } from '../lib/prisma';
import CustomResponse from '../utils/customResponse';
import sendVerificationEmail, { generateAccessToken } from '../utils/sendMail';
import { createPaginatedResponse, getPagination } from '../utils/queryHelpers';
import { basicUserFields } from '../lib/serializers/user';
import { getFormDescriptionKey, getFormName, getFormTitleKey } from '../utils/misc';
import { formSelectFields } from '../lib/serializers/form';
import { ConversationType } from '@prisma/client';

export const login = async (req: Request, res: CustomResponse) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.admin.findUnique({
            where: { email }
        });

        if (!user) {
            return res.failure("Invalid credentials", null, 401);
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.failure("Invalid credentials", null, 401);
        }

        if (!user.is_active) {
            return res.failure("Please verify your email first", null, 401);
        }

        // Generate JWT token
        const token = generateAccessToken(user.id, "admin");
        await prisma.admin.update({
            where: { id: user.id },
            data: {
                access_token: token,
                last_login: new Date()
            }
        });

        res.success("Login successful", {
            id: user.id,
            name: user.name,
            email: user.email,
            access_token: token,
            is_super_admin: user.is_super_admin,
            permissions: user.permissions,
        }, 200);
    } catch (error) {
        res.failure("Failed to login", error, 500);
    }
};

export const getEmail = async (req: Request, res: CustomResponse) => {
    try {
        const { uid } = req.body;

        const user = await prisma.admin.findUnique({
            where: { id: uid }
        });

        if (!user) {
            return res.failure("User not found", null, 404);
        }

        const generated_otp = Math.floor(100000 + Math.random() * 900000);

        await prisma.admin.update({
            where: { id: uid },
            data: { generated_otp, otp_generated_at: new Date() }
        });

        sendVerificationEmail(user.email, user.name, generated_otp);

        res.success("Email sent successfully", null, 200);
    } catch (error) {
        res.failure("Failed to get email", error, 500);
    }
}

export const verifyEmail = async (req: Request, res: CustomResponse) => {
    try {
        const { uid, otp } = req.body;

        const user = await prisma.admin.findFirst({
            where: { id: uid },
        });

        if (!user) {
            return res.failure("User not found", null, 404);
        }

        if (user.generated_otp !== parseInt(otp)) {
            return res.failure("Invalid OTP", null, 400);
        }

        // check if otp is expired
        const otpGeneratedTime = user.otp_generated_at;
        const currentTime = new Date();
        const timeDifference = currentTime.getTime() - otpGeneratedTime.getTime();
        const minutesDifference = Math.floor(timeDifference / (1000 * 60));

        if (minutesDifference > 15) {
            return res.failure("OTP has expired", null, 400);
        }

        // Generate JWT token
        const token = generateAccessToken(user.id, "admin")
        await prisma.admin.update({
            where: { id: uid },
            data: {
                is_active: true,
                generated_otp: null, otp_generated_at: null,
                access_token: token,
                last_login: new Date()
            }
        });

        res.success("Email verified successfully", {
            id: user.id,
            name: user.name,
            email: user.email,
            access_token: user.access_token,
        }, 200);
    } catch (error) {
        res.failure("Failed to verify email", error, 500);
    }
};

export const getDashboardData = async (req: Request, res: CustomResponse) => {
    try {
        const users = await prisma.user.count();
        const freelancers = await prisma.freelancer.count();
        const forms = await prisma.formSubmission.count();
        const jobs = await prisma.job.count();
        const conversations = await prisma.conversation.count();

        const [acceptedOffers, totalBudget, adminConversations, freelancerConversations] = await Promise.all([
            prisma.offer.count({
                where: { status: 'accepted' }
            }),
            prisma.offer.aggregate({
                where: { status: 'accepted' },
                _sum: {
                    budget: true
                }
            }),
            prisma.conversation.count({
                where: { conversation_type: 'admin' }
            }),
            prisma.conversation.count({
                where: { conversation_type: 'freelancer' }
            })
        ]);

        const offers: any = await prisma.$queryRaw`
            SELECT 
                TO_CHAR("created_at", 'YYYY-MM') AS month,
                status,
                COUNT(*) as count
            FROM "Offer"
            GROUP BY month, status
            ORDER BY month ASC;
        `;

        // Format result into { [month]: { accepted: x, rejected: y, pending: z } }
        const acceptedRejectOffersData = {};

        offers.forEach(({ month, status, count }) => {
            const label = new Date(month).toLocaleString('default', { month: 'short' });
            if (!acceptedRejectOffersData[label]) {
                acceptedRejectOffersData[label] = { accepted: 0, rejected: 0, pending: 0 };
            }
            acceptedRejectOffersData[label][status] = Number(count);
        });

        res.success("Dashboard data fetched successfully", {
            users,
            freelancers,
            forms,
            jobs,
            conversations,
            adminConversations,
            freelancerConversations,
            acceptedOffers,
            totalBudget: totalBudget._sum.budget || 0,
            acceptedRejectOffersData
        }, 200);

    } catch (error) {
        res.failure("Failed to get dashboard data", error, 500);
    }
}

export const getFreelancers = async (req: Request, res: CustomResponse) => {
    try {
        const { page, take, skip } = getPagination(req);
        const { user_id, is_active, is_approved } = req.query;

        const where: any = {};
        if (user_id) where.id = user_id;
        if (is_active !== 'all') where.is_active = is_active === 'true';
        if (is_approved !== 'all') where.is_approved = is_approved === 'true';

        console.log("ye hai", is_active, is_approved);

        const [freelancers, totalCount] = await Promise.all([
            prisma.freelancer.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    country_code: true,
                    is_active: true,
                    is_approved: true,
                    created_at: true,
                },
                skip,
                take,
                orderBy: { created_at: "desc" },
            }),
            prisma.freelancer.count({ where }),
        ]);

        const paginatedResponse = createPaginatedResponse(freelancers, totalCount, page, take);

        res.success("Freelancers fetched successfully", paginatedResponse, 200);
    } catch (error) {
        res.failure("Failed to fetch freelancers", error, 500);
    }
}

export const getFreelancerDetails = async (req: Request, res: CustomResponse) => {
    try {
        const { id } = req.params;
        const freelancerId = parseInt(id);

        const user = await prisma.freelancer.findUnique({
            where: { id: freelancerId },
            select: {
                id: true,
                profile_photo: true,
                name: true,
                email: true,
                country_code: true,
                phone: true,
                is_active: true,
                is_approved: true,
                last_login: true,
                created_at: true,
            }
        });

        if (!user) {
            return res.failure("Freelancer not found", null, 404);
        }

        // Get freelancer statistics
        const [
            awardedJobs,
            activeConversations,
            totalJobsApplied,
            totalOffersReceived
        ] = await Promise.all([
            // Jobs awarded to this freelancer
            prisma.job.count({
                where: {
                    job_type: 'awarded',
                    awarded_to_user_type: 'freelancer',
                    awarded_freelancer_id: freelancerId
                }
            }),
            // Jobs with active conversations by this freelancer
            prisma.job.count({
                where: {
                    job_type: 'open',
                    conversations: {
                        some: {
                            freelancer_id: freelancerId
                        }
                    }
                }
            }),
            // Total jobs applied to (conversations started)
            prisma.conversation.count({
                where: {
                    freelancer_id: freelancerId
                }
            }),
            // Total offers received by jobs this freelancer was awarded
            prisma.offer.count({
                where: {
                    job: {
                        awarded_freelancer_id: freelancerId,
                        job_type: 'awarded'
                    },
                    status: 'accepted'
                }
            })
        ]);

        // Calculate total earnings from jobs this freelancer was awarded
        const totalEarningsResult = await prisma.offer.aggregate({
            where: {
                job: {
                    awarded_freelancer_id: freelancerId,
                    job_type: 'awarded'
                },
                status: 'accepted'
            },
            _sum: {
                budget: true
            }
        });

        // Calculate conversion rate (awarded jobs / total applied jobs * 100)
        const conversionRate = totalJobsApplied > 0 
            ? ((awardedJobs / totalJobsApplied) * 100).toFixed(1)
            : 0;

        const stats = {
            awardedJobs,
            activeConversations,
            totalEarnings: totalEarningsResult._sum.budget || 0,
            conversionRate: parseFloat(conversionRate as string)
        };

        // Get jobs that this freelancer is involved in
        const freelancerJobs = await prisma.job.findMany({
            where: {
                OR: [
                    // Jobs awarded to this freelancer
                    {
                        job_type: 'awarded',
                        awarded_to_user_type: 'freelancer',
                        awarded_freelancer_id: freelancerId
                    },
                    // Jobs where freelancer has conversations
                    {
                        conversations: {
                            some: {
                                freelancer_id: freelancerId
                            }
                        }
                    }
                ]
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
                        freelancer_id: freelancerId
                    },
                    select: {
                        id: true,
                        conversation_type: true,
                        created_at: true
                    }
                },
                _count: {
                    select: {
                        offers: true,
                        conversations: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        // Process jobs to add form details
        const processedJobs = freelancerJobs.map(job => {
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
                        ...job.form_submission,
                        form_name: getFormName(job.form_submission.form_type),
                        form_title: details ? details[getFormTitleKey(job.form_submission.form_type)] || null : null,
                        form_description: details ? details[getFormDescriptionKey(job.form_submission.form_type)] || null : null,
                    }
                };
            }
            return job;
        });

        return res.success("Freelancer details fetched successfully", {
            user,
            stats,
            jobs: processedJobs
        }, 200);

    } catch (error) {
        console.log(error);
        res.failure("Failed to fetch freelancer details", error, 500);
    }
}

export const getAllJobs = async (req: Request, res: CustomResponse) => {
    try {
        const { page, take, skip } = getPagination(req);
        const { job_type, awarded_to_user_type, client_id, job_id } = req.query;

        const where: any = {};
        if (job_type && job_type !== 'all') where.job_type = job_type;
        if (awarded_to_user_type && awarded_to_user_type !== 'all') where.awarded_to_user_type = awarded_to_user_type;
        if (client_id) where.client_id = parseInt(client_id as string);
        if (job_id) where.id = parseInt(job_id as string);

        const [jobs, totalCount] = await Promise.all([
            prisma.job.findMany({
                where,
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    awarded_admin: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    awarded_freelancer: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    form_submission: {
                        include: formSelectFields
                    },
                    _count: {
                        select: {
                            offers: true,
                            conversations: true
                        }
                    }
                },
                skip,
                take,
                orderBy: { created_at: "desc" },
            }),
            prisma.job.count({ where }),
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
                        ...job.form_submission,
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
        const { id, userType } = (req as any).user;
        const { id: jobId } = req.params;

        // Fetch the job with all related data
        const job = await prisma.job.findUnique({
            where: { id: parseInt(jobId) },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        user_type: true
                    }
                },
                awarded_admin: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                awarded_freelancer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                form_submission: {
                    include: formSelectFields
                },
                conversations: {
                    include: {
                        admin: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        },
                        freelancer: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        },
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                offers: true
            }
        });

        if (!job) {
            return res.failure("Job not found", null, 404);
        }

        // Process form details
        let formDetails: any = null;
        if (job.form_submission) {
            switch (job.form_submission.form_type) {
                case 'SOL':
                    formDetails = job.form_submission.solution_implementation;
                    break;
                case 'API':
                    formDetails = job.form_submission.api_integration;
                    break;
                case 'EXP':
                    formDetails = job.form_submission.hire_smartsheet_expert;
                    break;
                case 'ADM':
                    formDetails = job.form_submission.system_admin_support;
                    break;
                case 'ADH':
                    formDetails = job.form_submission.adhoc_request;
                    break;
                case 'PRM':
                    formDetails = job.form_submission.premium_app_support;
                    break;
                case 'ONE':
                    formDetails = job.form_submission.book_one_on_one;
                    break;
                case 'PMO':
                    formDetails = job.form_submission.pmo_control_center;
                    break;
                case 'LIR':
                    formDetails = job.form_submission.license_request;
                    break;
            }
        }

        // Calculate stats
        const freelancersWithActiveConversation = job.conversations.filter(conv => 
            conv.conversation_type === 'freelancer' && conv.freelancer_id
        ).length;

        const adminsWithActiveConversation = job.conversations.filter(conv => 
            conv.conversation_type === 'admin' && conv.admin_id
        ).length;

        const totalOffers = job.offers.length;

        // Get offer details with participant info
        const offersWithParticipants = await prisma.offer.findMany({
            where: { job_id: parseInt(jobId) },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        user_type: true
                    }
                }
            }
        });

        // Prepare participants data for table
        const participants = [];
        
        // Group offers by participant (users who made offers)
        const offersByParticipant = new Map();
        
        offersWithParticipants.forEach(offer => {
            const participantKey = `user_${offer.user_id}`;
            const participantData = {
                id: offer.user_id,
                name: offer.user?.name || 'Unknown User',
                user_type: offer.user?.user_type || 'user',
                email: offer.user?.email
            };
            
            if (!offersByParticipant.has(participantKey)) {
                offersByParticipant.set(participantKey, {
                    ...participantData,
                    offers_count: 0
                });
            }
            offersByParticipant.get(participantKey).offers_count++;
        });

        // Convert to array
        participants.push(...Array.from(offersByParticipant.values()));

        // Add conversation participants who haven't made offers
        job.conversations.forEach(conv => {
            if (conv.admin_id) {
                const key = `admin_${conv.admin_id}`;
                if (!Array.from(offersByParticipant.keys()).includes(key)) {
                    participants.push({
                        id: conv.admin_id,
                        name: conv.admin?.name || 'Unknown Admin',
                        user_type: 'admin',
                        email: conv.admin?.email,
                        offers_count: 0
                    });
                }
            } else if (conv.freelancer_id) {
                const key = `freelancer_${conv.freelancer_id}`;
                if (!Array.from(offersByParticipant.keys()).includes(key)) {
                    participants.push({
                        id: conv.freelancer_id,
                        name: conv.freelancer?.name || 'Unknown Freelancer',
                        user_type: 'freelancer',
                        email: conv.freelancer?.email,
                        offers_count: 0
                    });
                }
            }
        });

        // Process job data
        const processedJob = {
            ...job,
            form_submission: job.form_submission ? {
                ...job.form_submission,
                form_name: getFormName(job.form_submission.form_type),
                form_title: formDetails ? formDetails[getFormTitleKey(job.form_submission.form_type)] || null : null,
                form_description: formDetails ? formDetails[getFormDescriptionKey(job.form_submission.form_type)] || null : null,
                details: formDetails
            } : null
        };

        res.success("Job details fetched successfully", {
            job: processedJob,
            stats: {
                freelancersWithActiveConversation,
                adminsWithActiveConversation,
                totalOffers
            },
            participants
        }, 200);
    } catch (error) {
        console.log(error);
        res.failure("Failed to fetch job details", error, 500);
    }
}

export const getAllUsers = async (req: Request, res: CustomResponse) => {
    try {
        const { user_type, user_id } = req.query;
        const { page, take, skip } = getPagination(req);

        const where: any = {};
        if (user_type) where.user_type = user_type;
        if (user_id) where.id = user_id;

        const [users, totalCount] = await Promise.all([
            prisma.user.findMany({
                where,
                select: basicUserFields,
                skip,
                take,
                orderBy: { created_at: "desc" },
            }),
            prisma.user.count({ where }),
        ]);

        const paginatedResponse = createPaginatedResponse(users, totalCount, page, take);

        res.success("Users fetched successfully", paginatedResponse, 200);
    } catch (error) {
        res.failure("Failed to fetch users", error, 500);
    }
}

export const getUserDetails = async (req: Request, res: CustomResponse) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                ...basicUserFields,
                last_login: true
            }
        });

        if (!user) {
            return res.failure("User not found", null, 404);
        }

        const formSubmissions = await prisma.formSubmission.findMany({
            where: { user_id: parseInt(id) },
            orderBy: { created_at: 'desc' },
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
                job: {
                    include: {
                        conversations: {
                            select: {
                                id: true,
                                conversation_type: true,
                                created_at: true
                            }
                        }
                    }
                }
            }
        });

        const history = formSubmissions.map(submission => {
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

            return {
                created_at: submission.created_at,
                form_id: submission.id,
                form_type: submission.form_type,
                form_name: getFormName(submission.form_type),
                form_title: details ? details[getFormTitleKey(submission.form_type)] || null : null,
                form_description: details ? details[getFormDescriptionKey(submission.form_type)] || null : null,
                job_id: submission.job?.id || null,
                conversations: submission.job?.conversations || []
            };
        });

        res.success("User details fetched successfully", {
            user,
            submissions: history,
        }, 200);

    } catch (error) {
        console.log(error);
        res.failure("Failed to fetch user details", error, 500);
    }
}

export const createConversation = async (req: Request, res: CustomResponse) => {
    try {
        const { id, userType } = (req as any).user;
        const { userId, jobId } = req.body;

        let convoType = {};
        if (userType === "admin") {
            convoType = {
                conversation_type: ConversationType.admin,
                admin_id: id
            }
        } else if (userType === "freelancer") {
            convoType = {
                conversation_type: ConversationType.freelancer,
                freelancer_id: id
            }
        }
        
        // Check if conversation already exists for this job
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                user_id: userId,
                job_id: jobId,
                ...convoType
            }
        });

        if (existingConversation) {
            return res.success("Conversation already exists", { conversationId: existingConversation.id }, 200);
        }

        // Create new conversation
        const conversationData: any = {
            user_id: userId,
            job_id: jobId,
            ...convoType
        };

        const conversation = await prisma.conversation.create({
            data: conversationData,
        });

        res.success("Chat session created successfully", {}, 200);

    } catch (error) {
        res.failure("Failed to create chat session", error, 500);
    }
}

export const getAllConversations = async (req: Request, res: CustomResponse) => {
    try {
        const conversations = await prisma.conversation.findMany({
            include: {
                messages: {
                    orderBy: { time: 'desc' },
                    take: 1 // Get latest message for preview
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    }
                },
                admin: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                freelancer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    }
                },
                job: {
                    select: {
                        id: true,
                        job_type: true,
                    }
                }
            },
            orderBy: { updated_at: 'desc' }
        });

        res.success("Chat sessions fetched successfully", conversations, 200);
    } catch (error) {
        res.failure("Failed to fetch chat sessions", error, 500);
    }
}