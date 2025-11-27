import { Request } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import CustomResponse from '../../utils/customResponse';
import sendVerificationEmail, { generateAccessToken, sendCredentialEmail } from '../../utils/sendMail';
import { AuthenticatedRequest } from '@/utils/misc';

export const login = async (req: Request, res: CustomResponse) => {
    try {
        const { email, password } = req.body;

        console.log("aaya", email, password);

        // Find user
        const user = await prisma.freelancer.findUnique({
            where: { email }
        });

        if (!user) {
            return res.failure("Invalid credentials", null, 401);
        }

        if (!user.is_active || !user.is_approved) {
            return res.failure("Your account is not active or approved by the admin.", null, 403);
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

export const register = async (req: Request, res: CustomResponse) => {
    try {
        const { name, email, phone, country_code, skills } = req.body;

        // Check if freelancer already exists
        const existingFreelancer = await prisma.freelancer.findUnique({
            where: { email }
        });

        if (existingFreelancer) {
            return res.failure("Freelancer with this email already exists", null, 400);
        }

        // Create new freelancer
        const newFreelancer = await prisma.$transaction(async (tx) => {
            const freelancer = await tx.freelancer.create({
                data: {
                    name,
                    email,
                    phone,
                    country_code,
                    skills,
                    is_active: false,
                },
            });

            await tx.freelancerWallet.create({
                data: {
                    user_id: freelancer.id,
                    balance: 0,
                },
            });

            return freelancer;
        });

        return res.success("Your request was submitted successfully", newFreelancer, 201);
    } catch (error) {
        res.failure("Failed to register freelancer", error, 500);
    }
};

export const withdrawEarnings = async (req: AuthenticatedRequest, res: CustomResponse) => {
    try {
        const freelancerId = req.user.id;

        if (!freelancerId) {
            return res.failure("Unauthorized: User ID not found", null, 401);
        }

        const { amount } = req.body;

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            return res.failure("Invalid withdrawal amount", null, 400);
        }

        const withdrawalAmount = Number(amount);

        // If withdrawal exists with requested status, prevent new withdrawal
        const existingRequestedWithdrawal = await prisma.withdrawal.findFirst({
            where: {
                user_id: freelancerId,
                status: "requested"
            }
        });

        if (existingRequestedWithdrawal) {
            return res.failure("Existing withdrawal request is still pending", null, 400);
        }

        // Execute withdrawal in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get freelancer wallet
            const wallet = await tx.freelancerWallet.findUnique({
                where: { user_id: freelancerId }
            });

            if (!wallet) {
                throw new Error("Freelancer wallet not found");
            }

            // 2. Check if sufficient balance
            if (wallet.balance.toNumber() < withdrawalAmount) {
                throw new Error("Insufficient balance for withdrawal");
            }

            // 3. Create withdrawal request
            const withdrawal = await tx.withdrawal.create({
                data: {
                    amount: withdrawalAmount,
                    user_id: freelancerId,
                }
            });

            // 4. Deduct amount from wallet balance
            const updatedWallet = await tx.freelancerWallet.update({
                where: { user_id: freelancerId },
                data: {
                    balance: {
                        decrement: withdrawalAmount
                    }
                }
            });

            // 5. Create transaction ledger entry
            const transaction = await tx.transactionLedger.create({
                data: {
                    freelancer_id: freelancerId,
                    type: "freelancer_withdrawal",
                    amount: -withdrawalAmount, // Negative because it's a debit
                    description: `Withdrawal request #${withdrawal.id}`,
                    withdrawal_id: withdrawal.id,
                }
            });

            return {
                withdrawal,
                updatedWallet,
                transaction
            };
        });

        res.success("Withdrawal request submitted successfully", {
            withdrawal: result.withdrawal,
            newBalance: result.updatedWallet.balance.toNumber(),
        }, 200);

    } catch (error) {
        console.error("Withdrawal error:", error);

        if (error.message === "Freelancer wallet not found") {
            return res.failure(error.message, null, 404);
        }

        if (error.message === "Insufficient balance for withdrawal") {
            return res.failure(error.message, null, 400);
        }

        res.failure("Failed to process withdrawal request", error, 500);
    }
};

export const getEarningsHistory = async (req: AuthenticatedRequest, res: CustomResponse) => {
    try {
        const freelancerId = req.user.id;

        if (!freelancerId) {
            return res.failure("Unauthorized: User ID not found", null, 401);
        }

        // Fetch all data in parallel using Promise.all
        const [wallet, withdrawals, transactions] = await Promise.all([
            // Get freelancer wallet information
            prisma.freelancerWallet.findUnique({
                where: { user_id: freelancerId }
            }),
            // Get all withdrawal requests for this freelancer
            prisma.withdrawal.findMany({
                where: { user_id: freelancerId },
                orderBy: { created_at: 'desc' }
            }),
            // Get all transaction ledger entries for this freelancer
            prisma.transactionLedger.findMany({
                where: { freelancer_id: freelancerId },
                orderBy: { created_at: 'desc' },
                include: {
                    payment: {
                        select: {
                            id: true,
                            total_amount: true,
                            created_at: true
                        }
                    },
                    withdrawal: {
                        select: {
                            id: true,
                            amount: true,
                            created_at: true
                        }
                    }
                }
            })
        ]);

        if (!wallet) {
            return res.failure("Freelancer wallet not found", null, 404);
        }

        res.success("Earnings history fetched successfully", {
            wallet: {
                current_balance: wallet.balance.toNumber(),
                total_earned: wallet.total_earned.toNumber(),
            },
            withdrawals: withdrawals.map(w => ({
                id: w.id,
                amount: w.amount.toNumber(),
                status: w.status,
                created_at: w.created_at,
                updated_at: w.updated_at
            })),
            transactions: transactions.map(t => ({
                id: t.id,
                type: t.type,
                amount: t.amount.toNumber(),
                description: t.description,
                created_at: t.created_at,
                payment: t.payment,
                withdrawal: t.withdrawal
            }))
        }, 200);

    } catch (error) {
        console.error("Error fetching earnings history:", error);
        res.failure("Failed to fetch earnings history", error, 500);
    }
};