import { Request } from 'express';
import bcrypt from 'bcrypt';

import { prisma } from '../lib/prisma';
import CustomResponse from '../utils/customResponse';
import sendVerificationEmail, { generateAccessToken } from '../utils/sendMail';
import { basicUserFields } from '../lib/serializers/user';
import { generateFileUrl } from '../lib/fileUpload';
import { getFormDescriptionKey, getFormName, getFormTitleKey } from '../utils/misc';

export const register = async (req: Request, res: CustomResponse) => {
    try {
        const { email, password, ...rest } = req.body;

        // Check if user already exists
        const existing_user = await prisma.user.findFirst({
            where: { email, is_active: true }
        });

        if (existing_user) {
            return res.failure("Email already registered", null, 400);
        }

        const hashed_password = await bcrypt.hash(password, 14);

        // Deleting users with same email but inactive state
        await prisma.user.deleteMany({
            where: { email, is_active: false }
        });

        const user = await prisma.user.create({
            data: {
                ...rest,
                email,
                password: hashed_password,
                user_type: rest.user_type.toLowerCase(),
                is_active: false
            }
        });

        const generated_otp = Math.floor(100000 + Math.random() * 900000);

        await prisma.user.update({
            where: { id: user.id },
            data: { generated_otp, otp_generated_at: new Date() }
        });

        sendVerificationEmail(user.email, user.name, generated_otp);

        res.success("Email sent to user", {
            id: user.id,
            email: user.email,
            user_type: user.user_type,
            is_active: user.is_active,
        }, 201);
    } catch (error) {
        res.failure("Failed to register user", error, 500);
    }
};

export const login = async (req: Request, res: CustomResponse) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findFirst({
            where: { email, is_active: true },
        });

        if (!user) {
            return res.failure("Invalid credentials", null, 401);
        }

        // Check password
        const is_valid_password = await bcrypt.compare(password, user.password);
        if (!is_valid_password) {
            return res.failure("Invalid credentials", null, 401);
        }

        if (!user.is_active) {
            return res.failure("Please verify your email first", null, 401);
        }

        // Generate JWT token
        const token = generateAccessToken(user.id, user.user_type)
        await prisma.user.update({
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
            user_type: user.user_type,
            access_token: user.access_token,
        }, 200);
    } catch (error) {
        res.failure("Failed to login", error, 500);
    }
};

export const getEmail = async (req: Request, res: CustomResponse) => {
    try {
        const { type } = req.body;

        let user: any;

        if (type === 'forgot-password') {
            const { email } = req.body;
            user = await prisma.user.findFirst({
                where: { email, is_active: true }
            });
        } else if (type === 'create-account') {
            const { uid, email } = req.body;
            user = await prisma.user.findFirst({
                where: { id: uid, email }
            });
        }

        if (!user) {
            return res.failure("User not found", null, 404);
        }

        const generated_otp = Math.floor(100000 + Math.random() * 900000);

        await prisma.user.update({
            where: { id: user.id },
            data: { generated_otp, otp_generated_at: new Date() }
        });

        sendVerificationEmail(user.email, user.name, generated_otp);

        res.success("Email sent successfully", {
            id: user.id,
            email: user.email,
        }, 200);
    } catch (error) {
        res.failure("Failed to get email", error, 500);
    }
}

export const verifyEmail = async (req: Request, res: CustomResponse) => {
    try {
        const { uid, otp } = req.body;

        const user = await prisma.user.findFirst({
            where: { id: uid },
        });

        if (!user) {
            return res.failure("User not found", null, 404);
        }

        if (user.generated_otp !== parseInt(otp)) {
            return res.failure("Invalid OTP", null, 400);
        }

        // check if otp is expired
        const otp_generated_time = user.otp_generated_at;
        const current_time = new Date();
        const time_difference = current_time.getTime() - otp_generated_time.getTime();
        const minutes_difference = Math.floor(time_difference / (1000 * 60));

        if (minutes_difference > 15) {
            return res.failure("OTP has expired", null, 400);
        }

        // Generate JWT token
        const token = generateAccessToken(user.id, user.user_type)
        await prisma.user.update({
            where: { id: uid },
            data: {
                is_active: true,
                generated_otp: null,
                otp_generated_at: null,
                access_token: token,
                last_login: new Date()
            }
        });

        res.success("Email verified successfully", {
            id: user.id,
            name: user.name,
            email: user.email,
            user_type: user.user_type,
            access_token: token,
        }, 200);
    } catch (error) {
        res.failure("Failed to verify email", error, 500);
    }
};

export const forgotPassword = async (req: Request, res: CustomResponse) => {
    try {
        const { id } = (req as any).user;
        const { password } = req.body;

        const hashed_password = await bcrypt.hash(password, 14);

        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.failure("User not found", null, 404);
        }

        await prisma.user.update({
            where: { id },
            data: { password: hashed_password }
        })

        res.success("Password updated successfully", null, 200);

    } catch (error) {
        console.log(error);
        res.failure("Failed to update password", error, 500);
    }
}

// Get all Users
export const getAllUsers = async (req: Request, res: CustomResponse) => {
    try {
        const users = await prisma.user.findMany({
            select: basicUserFields,
        });
        res.success("All Users retrieved successfully", users, 200);
    } catch (error) {
        console.log(error);
        res.failure("Failed to fetch users", error, 500);
    }
};

export const uploadFile = async (req: Request, res: CustomResponse) => {
    try {
        if (!req.file) {
            return res.failure("No file uploaded", null, 400);
        }

        const url = generateFileUrl(req.file?.filename);

        return res.success("File uploaded successfully", {
            url,
            filename: req.file?.filename,
            media_type: req.file?.mimetype,
        });
    } catch (error) {
        console.log(error);
        res.failure("Failed to upload file", error, 500);
    }
}

// Get User by ID
export const getUserProfile = async (req: Request, res: CustomResponse) => {
    try {
        const { id } = (req as any).user;
        const user = await prisma.user.findUnique({
            where: { id },
            select: basicUserFields
        });

        if (!user) {
            return res.failure("User not found", null, 404);
        }

        res.success("User retrieved successfully", user, 200);
    } catch (error) {
        res.failure("Failed to fetch user", error, 500);
    }
};

export const getHistory = async (req: Request, res: CustomResponse) => {
    try {
        const { id } = (req as any).user;

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

        return res.success('Form history retrieved successfully', history);

    } catch (error) {
        res.failure("Failed to fetch history", error, 500);
    }
}

// Update User
export const updateUser = async (req: Request, res: CustomResponse) => {
    try {
        const { id } = (req as any).user;

        const ALLOWED_FIELDS = ['name', 'email', 'phone', 'company_name', 'certificate_link', 'domain_expertise'];

        // Check if any field other than allowed fields is being updated
        const invalidFields = Object.keys(req.body).filter(field => !ALLOWED_FIELDS.includes(field));
        if (invalidFields.length > 0) {
            return res.failure(`Invalid fields: ${invalidFields.join(', ')}`, null, 400);
        }

        const user = await prisma.user.update({
            where: { id: id },
            data: req.body,
            select: basicUserFields
        });

        res.success("User updated successfully", user, 200);
    } catch (error) {
        res.failure("Failed to update user", error, 500);
    }
};

// Delete User
export const deleteUser = async (req: Request, res: CustomResponse) => {
    try {
        const { id } = (req as any).user;

        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.failure("User not found", null, 404);
        }

        // Append ID to email to allow reuse of original email
        const newEmail = `${user.email}_deleted_${id}`;

        await prisma.user.update({
            where: { id },
            data: {
                is_active: false,
                email: newEmail,
                access_token: null,
                deleted_at: new Date()
            }
        });

        res.success("User deleted successfully", null, 200);
    } catch (error) {
        res.failure("Failed to delete user", error, 500);
    }
};


export const acceptRejectOffer = async (req: Request, res: CustomResponse) => {
    try {
        const { id } = (req as any).user;
        const { offer_id, status, txn_id } = req.body;

        if (status !== 'accepted' && status !== 'rejected') {
            return res.failure("Invalid status", null, 400);
        }

        const offer = await prisma.offer.findUnique({
            where: { id: offer_id },
            include: {
                user: true
            }
        });

        if (!offer) {
            return res.failure("Offer not found", null, 404);
        }

        if (offer.user_id !== id) {
            return res.failure("You are not authorized to accept or reject this offer", null, 403);
        }

        if (offer.status !== 'pending') {
            return res.failure("Offer has already been accepted or rejected", null, 400);
        }

        await prisma.offer.update({
            where: { id: offer_id },
            data: { status, txn_id }
        });

        res.success("Offer accepted/rejected successfully", null, 200);
    } catch (error) {
        res.failure("Failed to accept/reject offer", error, 500);
    }
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export const makePayment = async (req: Request, res: CustomResponse) => {
    try {
        const { offerId } = req.body;

        const offer = await prisma.offer.findUnique({
            where: { id: parseInt(offerId as any) },
            include: {
                user: true
            }
        });

        if (!offer) {
            return res.failure("Offer not found", null, 404);
        }

        if (offer.user_id !== (req as any).user.id) {
            return res.failure("You are not authorized to make this payment", null, 403);
        }

        const customer = await stripe.customers.create();
        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: customer.id },
            { apiVersion: '2025-04-30.basil' }
        );
        const paymentIntent = await stripe.paymentIntents.create({
            amount: offer.budget * 100,
            currency: 'usd',
            customer: customer.id,
            // In the latest version of the API, specifying the `automatic_payment_methods` parameter
            // is optional because Stripe enables its functionality by default.
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                offer_id: offer.id,
                user_id: offer.user_id
            }
        });

        return res.success("Created Payment Intent", {
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customer.id,
            publishableKey: process.env.STRIPE_PUBLIC_KEY
        });

    } catch (error) {
        console.log(error);
        res.failure("Failed to make payment", 500);
    }
}