import { Request } from 'express';
import bcrypt from 'bcrypt';

import { prisma } from '../lib/prisma';
import CustomResponse from '../utils/customResponse';
import sendVerificationEmail, { generateAccessToken } from '../utils/sendMail';
import { basicUserFields } from '../lib/serializers/user';
import { generateFileUrl } from '../lib/fileUpload';

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

        const user = await prisma.user.create({
            data: {
                ...rest,
                email,
                password: hashed_password,
                user_type: rest.user_type.toLowerCase(),
                is_active: false
            }
        });

        res.success("User registered successfully.", {
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
            where: { email }
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
        const { uid } = req.body;

        const user = await prisma.user.findFirst({
            where: { id: uid }
        });

        if (!user) {
            return res.failure("User not found", null, 404);
        }

        const generated_otp = Math.floor(100000 + Math.random() * 900000);

        await prisma.user.update({
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
        const file = req.file;

        const url = generateFileUrl(file!.filename);

        return res.success("File uploaded successfully", {
            url,
            filename: file!.filename,
            media_type: file!.mimetype,
        });
    } catch (error) {
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
                access_token: null
            }
        });

        res.success("User deleted successfully", null, 200);
    } catch (error) {
        res.failure("Failed to delete user", error, 500);
    }
};
