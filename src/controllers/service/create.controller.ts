import { Request } from 'express';

import { prisma } from '../../lib/prisma';
import CustomResponse from '../../utils/customResponse';
import { generateFileUrl } from '../../lib/fileUpload';
import { AwardedUserType, JobType, Prisma } from '@prisma/client';

interface AuthenticatedRequest extends Request {
    user?: {
        id: number; // Assuming user ID is a number based on your prisma schema and usage
        user_type: string;
    };
    file?: Express.Multer.File; // For file uploads, if using Multer
}

// Leave a review
export const createReview = async (req: Request, res: CustomResponse) => {
    try {

        const { id } = (req as any).user;
        const {
            formId,
            review,
            communication,
            quality_of_work,
            timeliness,
            value_for_money
        } = req.body;

        const form = await prisma.formSubmission.findUnique({
            where: { id: +formId },
            include: {
                job: { select: { id: true } }
            },
        });

        const existingReview = await prisma.review.findFirst({
            where: {
                job_id: form.job.id,
                user_id: +id,
            }
        });

        if (existingReview) {
            return res.failure('You have already reviewed this submission.', null, 400);
        }

        const newReview = await prisma.review.create({
            data: {
                job_id: form.job.id,
                user_id: +id,
                review,
                communication,
                quality_of_work,
                timeliness,
                value_for_money
            }
        });

        res.success("Review created successfully", newReview, 200);
    } catch (error) {
        res.failure("Failed to create review", error, 500);
    }
}

export const createFeedback = async (req: AuthenticatedRequest, res: CustomResponse) => {
    try {
        // Ensure user is authenticated and user ID is available
        if (!req.user || !req.user.id) {
            return res.failure('Unauthorized: User not found in request.', null, 401);
        }

        const { id: userId } = req.user;
        const { comment } = req.body;
        const attachmentFile = req.file; // Multer makes the file available on req.file

        // Validate incoming data
        if (!comment) {
            return res.failure('Comment is required for feedback.', null, 400);
        }

        let attachmentUrl = null;
        if (attachmentFile) {
            attachmentUrl = generateFileUrl(attachmentFile?.filename);
        }

        // Create the new feedback entry in the database
        const newFeedback = await prisma.feedback.create({
            data: {
                comment,
                attachment: attachmentUrl, // Store the URL if a file was uploaded
                user_id: +userId,
            }
        });

        res.success("Feedback submitted successfully", newFeedback, 200);
    } catch (error) {
        console.error("Error creating feedback:", error); // Log the error for debugging
        res.failure("Failed to submit feedback", error, 500);
    }
};

export const createReport = async (req: AuthenticatedRequest, res: CustomResponse) => {
    try {
        // Ensure user is authenticated and user ID is available
        if (!req.user || !req.user.id) {
            return res.failure('Unauthorized: User not found in request.', null, 401);
        }

        const { id: userId } = req.user;
        const {
            issue,
            description,
            priority,
            formId
        } = req.body;

        // Validate incoming data
        if (!issue || !description || !priority || formId === undefined) {
            return res.failure('Missing required fields for report.', null, 400);
        }

        // Validate priority enum
        const validPriorities = ['low', 'medium', 'high'];
        if (!validPriorities.includes(priority)) {
            return res.failure('Invalid priority value. Must be "low", "medium", or "high".', null, 400);
        }

        const attachmentFile = req.file;
        let attachmentUrl = null;
        if (attachmentFile) {
            attachmentUrl = generateFileUrl(attachmentFile?.filename);
        }

        // Create the new report entry in the database
        const newReport = await prisma.report.create({
            data: {
                issue,
                description,
                priority, // Prisma will handle the enum conversion
                user_id: +userId,
                form_submission_id: +formId, // Convert to number
                attachment: attachmentUrl,
            }
        });

        res.success("Report submitted successfully", newReport, 200);
    } catch (error) {
        console.error("Error creating report:", error); // Log the error for debugging
        res.failure("Failed to submit report", error, 500);
    }
};

// validate the data -> check form exists -> cancel form -> if refund, create one
export const createCancellation = async (req: AuthenticatedRequest, res: CustomResponse) => {
    try {
        // Ensure user is authenticated and user ID is available
        if (!req.user || !req.user.id) {
            return res.failure('Unauthorized: User not found in request.', null, 401);
        }

        const { id: userId } = req.user;
        const { formId, comments, reason } = req.body;

        // 1. Validate incoming data
        if (!formId || !reason) {
            return res.failure('Missing required fields: formId and reason are required.', null, 400);
        }

        // Convert formSubmissionId to a number
        const parsedFormSubmissionId = +formId;

        // 2. Check if the form submission exists and belongs to the authenticated user
        const formSubmission = await prisma.formSubmission.findUnique({
            where: {
                id: parsedFormSubmissionId,
            },
        });

        if (!formSubmission) {
            return res.failure('Form submission not found.', null, 404);
        }

        if (formSubmission.user_id !== userId) {
            return res.failure('Not authorized to cancel this form submission.', null, 403);
        }

        // 3. Check if a cancellation already exists for this form submission by this user
        // Using the compound unique constraint @@unique([user_id, form_submission_id])
        const existingCancellation = await prisma.cancellation.findUnique({
            where: {
                user_id_form_submission_id: {
                    user_id: userId,
                    form_submission_id: parsedFormSubmissionId,
                },
            },
        });

        if (existingCancellation) {
            return res.failure('This form submission has already been cancelled by you.', null, 400);
        }

        // 4. Determine refund eligibility
        let isRefundEligible = false;
        let refundAmount: number | null = null;

        
        // TODO: PENDING REFUND
        // const refundNotEligibleStatuses = ['submitted', 'offer_pending', 'inprogress'];
        // if (!refundNotEligibleStatuses.includes(formSubmission.status)) {
        //     isRefundEligible = true;
        // }
        // if (formSubmission.created_at >= sevenDaysAgo && isNotCompleted) {
        //     isRefundEligible = true;
        //     // Only base amount is refundable
        //     if (formSubmission.payment && formSubmission.payment.base_amount) {
        //         refundAmount = formSubmission.payment.base_amount.toNumber(); // Convert Decimal to number
        //     } else {
        //         // If payment info is missing but refund is eligible, this indicates a data inconsistency
        //         console.warn(`Refund eligible for form ${parsedFormSubmissionId} but payment base_amount is missing.`);
        //         isRefundEligible = false; // Or handle as an error, depending on business logic
        //     }
        // }

        // 5. Create the Cancellation record and update FormSubmission status in a transaction
        const [cancellation, updatedFormSubmission] = await prisma.$transaction([
            prisma.cancellation.create({
                data: {
                    comments,
                    reason,
                    is_refund_eligible: isRefundEligible,
                    user_id: userId,
                    form_submission_id: parsedFormSubmissionId,
                },
            }),
            prisma.formSubmission.update({
                where: { id: parsedFormSubmissionId },
                data: { status: 'cancelled' },
            }),
        ]);

        let refundRecord = null;
        // 6. If refund is eligible, create a Refund record
        if (isRefundEligible && refundAmount !== null) {
            // Check if a refund record already exists for this unique combination
            // (though the cancellation check should prevent this from being called twice for the same cancellation)
            const existingRefund = await prisma.refund.findUnique({
                where: {
                    user_id_form_submission_id: {
                        user_id: userId,
                        form_submission_id: parsedFormSubmissionId,
                    },
                },
            });

            if (!existingRefund) {
                refundRecord = await prisma.refund.create({
                    data: {
                        amount: refundAmount,
                        user_id: userId,
                        form_submission_id: parsedFormSubmissionId,
                    },
                });
            } else {
                console.warn(`Refund record already exists for form ${parsedFormSubmissionId}. Skipping creation.`);
            }
        }

        res.success(
            "Form submission cancelled successfully.",
            {
                cancellation,
                updatedFormSubmission,
                refund: refundRecord,
                refundEligibility: isRefundEligible,
            },
            200
        );
    } catch (error) {
        console.error("Error cancelling form submission:", error);
        res.failure("Failed to cancel form submission.", error, 500);
    }
};

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const DEFAULT_TAX_RATE_PERCENTAGE = 5; // 5%
const DEFAULT_PLATFORM_FEE_RATE_PERCENTAGE = 10; // 10%

export const makePayment = async (req: AuthenticatedRequest, res: CustomResponse) => {
    try {
        if (!req?.user || !req?.user.id) {
            return res.failure('Unauthorized: User not found in request.', null, 401);
        }
        
        const uid = req?.user.id;
        const { offerId, formId } = req.body;
        
        const parsedOfferId = parseInt(offerId as string);
        const parsedFormSubmissionId = parseInt(formId as string);

        const offer = await prisma.offer.findUnique({
            where: { id: parsedOfferId },
            include: {
                user: true,
                Message: {
                    select: {
                        sender_admin_id: true,
                        sender_freelancer_id: true,
                    }
                }
            }
        });

        if (!offer) {
            return res.failure("Offer not found", null, 404);
        }

        if (offer.user_id !== uid) {
            return res.failure("You are not authorized to make this payment", null, 403);
        }

        if (!parsedFormSubmissionId || isNaN(parsedFormSubmissionId)) {
            return res.failure("Invalid or missing form submission ID.", null, 400);
        }

        const formSubmission = await prisma.formSubmission.findUnique({
            where: { id: parsedFormSubmissionId },
        });

        if (!formSubmission) {
            return res.failure("Form Submission not found.", null, 404);
        }

        if (formSubmission.user_id !== uid) {
            return res.failure("Form Submission does not belong to the authenticated user.", null, 403);
        }

        // TODO: Fix 
        // const existingPayment = await prisma.payment.findUnique({
        //     where: {
        //         user_id_form_submission_id_offer_id: {
        //             user_id: uid,
        //             form_submission_id: parsedFormSubmissionId,
        //             offer_id: parsedOfferId,
        //         },
        //     },
        // });

        // if (existingPayment) {
        //     // If a payment already exists, return its details or an error indicating it's already paid
        //     return res.failure("Payment for this offer and form submission already exists.", existingPayment, 400);
        // }

        // 4. Calculate amounts based on the offer budget and defined rates
        const baseAmount = new Prisma.Decimal(offer.budget);
        const taxRate = new Prisma.Decimal(DEFAULT_TAX_RATE_PERCENTAGE);
        const platformFeeRate = new Prisma.Decimal(DEFAULT_PLATFORM_FEE_RATE_PERCENTAGE);

        // Calculate tax amount: base_amount * (tax_rate / 100)
        const taxAmount = baseAmount.mul(taxRate.div(100));
        // Calculate platform fee amount: base_amount * (platform_fee_rate / 100)
        const platformFeeAmount = baseAmount.mul(platformFeeRate.div(100));
        const discountAmount = new Prisma.Decimal(0); // Assuming no discount for now

        // Total amount: base_amount + tax_amount + platform_fee_amount - discount_amount
        const totalAmount = baseAmount.plus(taxAmount).plus(platformFeeAmount).minus(discountAmount);

        // Stripe requires amount in cents
        const stripeAmountInCents = Math.round(totalAmount.toNumber() * 100);
        const currency = 'usd'; // Hardcoded as per your original code

        // 5. Create Stripe Customer, Ephemeral Key, and Payment Intent
        const customer = await stripe.customers.create({
            email: offer.user.email, // Use user's email for the Stripe customer
            name: offer.user.name, // Use user's name for the Stripe customer
        });

        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: customer.id },
            { apiVersion: '2025-04-30.basil' } // Use the same API version as Stripe initialization
        );

        const paymentIntent = await stripe.paymentIntents.create({
            amount: stripeAmountInCents,
            currency: currency,
            customer: customer.id,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                offer_id: offer.id.toString(), // Store as string in metadata
                user_id: offer.user_id.toString(), // Store as string in metadata
                form_submission_id: parsedFormSubmissionId.toString(), // Store as string
            }
        });

        // 6. Store payment details in your database
        const newPaymentRecord = await prisma.payment.create({
            data: {
                client_secret: paymentIntent.client_secret as string,
                customer_id: customer.id,
                ephemeral_key_secret: ephemeralKey.secret,
                tax_rate: taxRate,
                platform_fee_rate: platformFeeRate,
                base_amount: baseAmount,
                tax_amount: taxAmount,
                platform_fee_amount: platformFeeAmount,
                discount_amount: discountAmount,
                total_amount: totalAmount,
                currency: currency,
                user_id: uid,
                offer_id: parsedOfferId,
            }
        });

        // 7. Update Offer status to 'accepted' / update formSubmission status 
        await prisma.offer.update({
            where: { id: parsedOfferId },
            data: { status: 'accepted' },
        });

        await prisma.formSubmission.update({
            where: { id: parsedFormSubmissionId },
            data: { status: 'inprogress', payment_status: 'paid' },
        });
        
        // also mark awarded to user for the offer for the job
        const msg = offer.Message[0];
        const awardedTo = {
            awarded_at: new Date().toISOString(),
            job_type: JobType.awarded
        };

        if (msg.sender_admin_id) {
            awardedTo['awarded_admin_id'] = msg.sender_admin_id;
            awardedTo['awarded_to_user_type'] = AwardedUserType.admin;
        } else if (msg.sender_freelancer_id) {
            awardedTo['awarded_freelancer_id'] = msg.sender_freelancer_id;
            awardedTo['awarded_to_user_type'] = AwardedUserType.freelancer;
        }
        await prisma.job.update({
            where: { form_submission_id: parsedFormSubmissionId },
            data: awardedTo,
        });

        // 8. Return necessary details to the client
        return res.success("Created Payment Intent and recorded payment.", {
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customer.id,
            publishableKey: process.env.STRIPE_PUBLIC_KEY, // Ensure this env variable is set
            paymentRecord: newPaymentRecord, // Optionally return the created payment record
        });

    } catch (error) {
        console.log(error);
        res.failure("Failed to make payment", 500);
    }
}