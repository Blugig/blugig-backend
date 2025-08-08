import { Request } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import CustomResponse from '../../utils/customResponse';
import sendVerificationEmail, { generateAccessToken, sendCredentialEmail } from '../../utils/sendMail';

export const login = async (req: Request, res: CustomResponse) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.freelancer.findUnique({
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
        const token = generateAccessToken(user.id, "freelancer");
        await prisma.freelancer.update({
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
        }, 200);
    } catch (error) {
        res.failure("Failed to login", error, 500);
    }
};

export const onboardFreelancer = async (req: Request, res: CustomResponse) => {
    try {
        const { email } = req.body;

        const plainPassword = Math.random().toString(36).slice(-8);
        const password = await bcrypt.hash(plainPassword, 14);

        const existingAdmin = await prisma.freelancer.findUnique({
            where: { email }
        });

        if (existingAdmin) {
            return res.failure("Freelancer with this email already exists", null, 400);
        }

        const user = await prisma.freelancer.update({
            where: { email },
            data: {
                email,
                password,
                is_active: true,
            },
        });

        sendCredentialEmail(email, user.name, plainPassword, "Your Freelancer request has been approved.");

        return res.success("Admin added successfully", user, 200);
    } catch (error) {
        res.failure("Failed to onboard freelancer", error, 500);
    }
};
