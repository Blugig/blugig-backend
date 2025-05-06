import { Request } from 'express';
import bcrypt from 'bcrypt';

import { prisma } from '../lib/prisma';
import CustomResponse from '../utils/customResponse';
import sendVerificationEmail, { generateAccessToken } from '../utils/sendMail';
import { createPaginatedResponse, getPagination } from '../utils/queryHelpers';
import { basicUserFields } from '../lib/serializers/user';
import { getFormDescriptionKey, getFormName, getFormTitleKey } from '../utils/misc';

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
            permissions: user.permissions.split(","),
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
        const forms = await prisma.formSubmission.count();
        const conversations = await prisma.conversation.count();

        const [acceptedOffers, totalBudget] = await Promise.all([
            prisma.offer.count({
                where: { status: 'accepted' }
            }),
            prisma.offer.aggregate({
                where: { status: 'accepted' },
                _sum: {
                    budget: true
                }
            })
        ]);

        const offers: any = await prisma.$queryRaw`
            SELECT 
                strftime('%Y-%m', "createdAt") AS month,
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
            forms,
            conversations,
            acceptedOffers,
            totalBudget: totalBudget._sum.budget || 0,
            acceptedRejectOffersData
        }, 200);

    } catch (error) {
        res.failure("Failed to get dashboard data", error, 500);
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
                reports_dashboard: true,
                premium_app_support: true,
                book_one_on_one: true,
                pmo_control_center: true,
                license_request: true,
                conversation: true
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

            return {
                created_at: submission.created_at,
                form_id: submission.id,
                form_type: submission.form_type,
                form_name: getFormName(submission.form_type),
                form_title: details[getFormTitleKey(submission.form_type)] || null,
                form_description: details[getFormDescriptionKey(submission.form_type)] || null,
                conversation_uuid: submission.conversation?.id || null
            };
        });

        res.success("User details fetched successfully", {
            user,
            submissions: history,
        }, 200);

    } catch (error) {
        res.failure("Failed to fetch user details", error, 500);
    }
}


export const createConverstaion = async (req: Request, res: CustomResponse) => {
    try {
        const { userId, formId } = req.body;

        const conversation = await prisma.conversation.create({
            data: {
                user_id: userId,
                form_id: formId,
            }
        });

        res.success("Chat session created successfully", conversation, 200);

    } catch (error) {
        res.failure("Failed to create chat session", error, 500);
    }
}

export const getAllConversations = async (req: Request, res: CustomResponse) => {
    try {
        const conversations = await prisma.conversation.findMany({
            include: {
                messages: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    }
                }
            }
        });

        res.success("Chat sessions fetched successfully", conversations, 200);
    } catch (error) {
        res.failure("Failed to fetch chat sessions", error, 500);
    }
}