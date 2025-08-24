import { Request } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import CustomResponse from '../../utils/customResponse';
import sendVerificationEmail, { generateAccessToken, sendCredentialEmail } from '../../utils/sendMail';
import { JobType } from '@prisma/client';

export const onboardFreelancer = async (req: Request, res: CustomResponse) => {
    try {
        const { ids } = req.body;

        // Fetch freelancers to be onboarded
        const freelancers = await prisma.freelancer.findMany({
            where: { id: { in: ids }, is_active: false, is_approved: false },
        });

        // Prepare updated users with unique passwords
        const updatedUsers = [];
        for (const freelancer of freelancers) {
            const plainPassword = Math.random().toString(36).slice(-8);
            const password = await bcrypt.hash(plainPassword, 14);

            const updatedUser = await prisma.freelancer.update({
            where: { id: freelancer.id },
            data: {
                password,
                is_active: true,
                is_approved: true
            },
            });

            // Attach plainPassword for email sending
            updatedUsers.push({ ...updatedUser, plainPassword });
        }

        // Send credentials email to each user
        updatedUsers.forEach(user => {
            sendCredentialEmail(user.email, user.name, user.plainPassword, "Your Freelancer request has been approved.");
        });

        return res.success("Onboarding mails sent successfully", 200);
    } catch (error) {
        res.failure("Failed to onboard freelancer", error, 500);
    }
};

export const markJobsAsOpen = async (req: Request, res: CustomResponse) => {
    try {
        const { ids } = req.body;

        // Update job status to open
        await prisma.job.updateMany({
            where: { id: { in: ids }, job_type: JobType.internal },
            data: { job_type: JobType.open },
        });

        return res.success("Jobs marked as open successfully", 200);
    } catch (error) {
        res.failure("Failed to mark jobs as open", error, 500);
    }
}