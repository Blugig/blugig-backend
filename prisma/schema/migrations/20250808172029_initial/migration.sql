-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('admin', 'freelancer');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'MEDIA', 'OFFER');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('pending', 'accepted', 'rejected', 'revoked');

-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('general', 'meeting');

-- CreateEnum
CREATE TYPE "FormPermissions" AS ENUM ('SOL', 'API', 'EXP', 'ADM', 'PRM', 'ONE', 'PMO', 'LIR', 'ADH');

-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('submitted', 'offer_pending', 'inprogress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "FormPaymentStatus" AS ENUM ('pending', 'paid');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('internal', 'open', 'awarded');

-- CreateEnum
CREATE TYPE "AwardedUserType" AS ENUM ('admin', 'freelancer');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('received', 'approved', 'processing', 'bank_processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "ReportPriority" AS ENUM ('low', 'medium', 'high');

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "conversation_type" "ConversationType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "admin_id" INTEGER,
    "freelancer_id" INTEGER,
    "job_id" INTEGER,
    "last_seen_message_id" INTEGER,
    "latest_message_id" INTEGER,
    "unread_count" INTEGER DEFAULT 0,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "body" TEXT,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "media_url" TEXT,
    "media_type" TEXT,
    "message_type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "offer_id" INTEGER,
    "conversation_id" TEXT NOT NULL,
    "sender_user_id" INTEGER,
    "sender_admin_id" INTEGER,
    "sender_freelancer_id" INTEGER,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "budget" INTEGER NOT NULL,
    "estimated_hours" TEXT,
    "total_cost" INTEGER,
    "deliverables" TEXT[],
    "status" "OfferStatus" NOT NULL DEFAULT 'pending',
    "type" "OfferType" NOT NULL DEFAULT 'general',
    "user_id" INTEGER NOT NULL,
    "job_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" SERIAL NOT NULL,
    "form_type" "FormPermissions" NOT NULL,
    "status" "FormStatus" NOT NULL DEFAULT 'submitted',
    "payment_status" "FormPaymentStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolutionImplementation" (
    "id" SERIAL NOT NULL,
    "project_title" TEXT NOT NULL,
    "implementation_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "team_size" TEXT NOT NULL,
    "departments_involved" TEXT[],
    "current_tools" TEXT NOT NULL,
    "implementation_features" TEXT[],
    "timeline" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,

    CONSTRAINT "SolutionImplementation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiIntegration" (
    "id" SERIAL NOT NULL,
    "integration_type" TEXT NOT NULL,
    "source_system" TEXT NOT NULL,
    "data_to_sync" TEXT NOT NULL,
    "sync_direction" TEXT NOT NULL,
    "sync_frequency" TEXT NOT NULL,
    "api_access_available" TEXT NOT NULL,
    "data_volumne" TEXT NOT NULL,
    "technical_requirements" TEXT[],
    "integration_features" TEXT[],
    "timeline" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,

    CONSTRAINT "ApiIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_one_on_ones" (
    "id" SERIAL NOT NULL,
    "preferred_date" TEXT NOT NULL,
    "preferred_time" TEXT NOT NULL,
    "consultation_focus" TEXT NOT NULL,
    "smartsheet_experience" TEXT NOT NULL,
    "team_size" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,

    CONSTRAINT "book_one_on_ones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HireSmartsheetExpert" (
    "id" SERIAL NOT NULL,
    "position_type" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "required_skills" TEXT[],
    "experience_level" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "start_date" TEXT NOT NULL,
    "contract_duration" TEXT NOT NULL,
    "job_description" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,

    CONSTRAINT "HireSmartsheetExpert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemAdminSupport" (
    "id" SERIAL NOT NULL,
    "support_needed" TEXT NOT NULL,
    "smartsheet_plan" TEXT NOT NULL,
    "number_of_users" TEXT NOT NULL,
    "current_admin_experience" TEXT NOT NULL,
    "current_challenges" TEXT NOT NULL,
    "admin_task_needed" TEXT[],
    "support_frequency" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "urgency_level" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,

    CONSTRAINT "SystemAdminSupport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PremiumAppSupport" (
    "id" SERIAL NOT NULL,
    "organization_name" TEXT NOT NULL,
    "premium_addons" TEXT[],
    "primary_use_case" TEXT NOT NULL,
    "current_smartsheet_plan" TEXT NOT NULL,
    "team_size" TEXT NOT NULL,
    "implementation_scope" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "primary_contact_email" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,

    CONSTRAINT "PremiumAppSupport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PmoControlCenter" (
    "id" SERIAL NOT NULL,
    "organization_name" TEXT NOT NULL,
    "control_centre_type" TEXT NOT NULL,
    "required_features" TEXT[],
    "expected_project_scale" TEXT NOT NULL,
    "team_size" TEXT NOT NULL,
    "current_smartsheet_experience" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "primary_contact_email" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,

    CONSTRAINT "PmoControlCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseRequest" (
    "id" SERIAL NOT NULL,
    "license_type" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "team_size" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "project_needs" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,

    CONSTRAINT "LicenseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdhocRequest" (
    "id" SERIAL NOT NULL,
    "need_help_with" TEXT[],
    "description" TEXT NOT NULL,
    "urgency_level" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "expected_timeline" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,

    CONSTRAINT "AdhocRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freelancers" (
    "id" SERIAL NOT NULL,
    "profile_photo" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT,
    "skills" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "access_token" TEXT,
    "last_login" TIMESTAMP(3),
    "generated_otp" INTEGER,
    "otp_generated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "freelancers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" SERIAL NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "awarded_admin_id" INTEGER,
    "awarded_freelancer_id" INTEGER,
    "awarded_to_user_type" "AwardedUserType",
    "job_type" "JobType" NOT NULL DEFAULT 'internal',
    "awarded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "comment" TEXT NOT NULL,
    "attachment" TEXT,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "review" TEXT NOT NULL,
    "communication" INTEGER NOT NULL,
    "quality_of_work" INTEGER NOT NULL,
    "timeliness" INTEGER NOT NULL,
    "value_for_money" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "job_id" INTEGER NOT NULL,
    "reviewed_admin_id" INTEGER,
    "reviewed_freelancer_id" INTEGER,
    "reviewed_user_type" "AwardedUserType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cancellation" (
    "id" SERIAL NOT NULL,
    "comments" TEXT,
    "reason" TEXT[],
    "is_refund_eligible" BOOLEAN NOT NULL DEFAULT false,
    "user_id" INTEGER NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cancellation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" SERIAL NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'received',
    "user_id" INTEGER NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    "job_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "issue" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "ReportPriority" NOT NULL,
    "attachment" TEXT,
    "user_id" INTEGER NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    "job_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "client_secret" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "ephemeral_key_secret" TEXT,
    "tax_rate" DECIMAL(65,30) NOT NULL,
    "platform_fee_rate" DECIMAL(65,30) NOT NULL,
    "base_amount" DECIMAL(65,30) NOT NULL,
    "tax_amount" DECIMAL(65,30) NOT NULL,
    "platform_fee_amount" DECIMAL(65,30) NOT NULL,
    "discount_amount" DECIMAL(65,30) NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "offer_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "profile_photo" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "user_type" TEXT NOT NULL DEFAULT 'customer',
    "company_name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "company_size" TEXT,
    "website" TEXT,
    "certificate_link" TEXT,
    "domain_expertise" TEXT NOT NULL,
    "preferred_communication" TEXT[],
    "timezone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "access_token" TEXT,
    "last_login" TIMESTAMP(3),
    "generated_otp" INTEGER,
    "otp_generated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "profile_photo" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_super_admin" BOOLEAN NOT NULL DEFAULT false,
    "access_token" TEXT,
    "last_login" TIMESTAMP(3),
    "generated_otp" INTEGER,
    "otp_generated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_job_id_key" ON "Conversation"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_latest_message_id_key" ON "Conversation"("latest_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_user_id_admin_id_job_id_key" ON "Conversation"("user_id", "admin_id", "job_id");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_user_id_freelancer_id_job_id_key" ON "Conversation"("user_id", "freelancer_id", "job_id");

-- CreateIndex
CREATE UNIQUE INDEX "SolutionImplementation_form_submission_id_key" ON "SolutionImplementation"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "ApiIntegration_form_submission_id_key" ON "ApiIntegration"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_one_on_ones_form_submission_id_key" ON "book_one_on_ones"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "HireSmartsheetExpert_form_submission_id_key" ON "HireSmartsheetExpert"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "SystemAdminSupport_form_submission_id_key" ON "SystemAdminSupport"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "PremiumAppSupport_form_submission_id_key" ON "PremiumAppSupport"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "PmoControlCenter_form_submission_id_key" ON "PmoControlCenter"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "LicenseRequest_form_submission_id_key" ON "LicenseRequest"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "AdhocRequest_form_submission_id_key" ON "AdhocRequest"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "freelancers_email_key" ON "freelancers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_form_submission_id_key" ON "jobs"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "Review_job_id_key" ON "Review"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "Review_user_id_job_id_key" ON "Review"("user_id", "job_id");

-- CreateIndex
CREATE UNIQUE INDEX "Cancellation_user_id_key" ON "Cancellation"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Cancellation_form_submission_id_key" ON "Cancellation"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "Cancellation_user_id_form_submission_id_key" ON "Cancellation"("user_id", "form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_user_id_key" ON "Refund"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_form_submission_id_key" ON "Refund"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_job_id_key" ON "Refund"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_user_id_form_submission_id_key" ON "Refund"("user_id", "form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_user_id_key" ON "Payment"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_offer_id_key" ON "Payment"("offer_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_user_id_offer_id_key" ON "Payment"("user_id", "offer_id");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "freelancers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_latest_message_id_fkey" FOREIGN KEY ("latest_message_id") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sender_admin_id_fkey" FOREIGN KEY ("sender_admin_id") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sender_freelancer_id_fkey" FOREIGN KEY ("sender_freelancer_id") REFERENCES "freelancers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolutionImplementation" ADD CONSTRAINT "SolutionImplementation_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiIntegration" ADD CONSTRAINT "ApiIntegration_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_one_on_ones" ADD CONSTRAINT "book_one_on_ones_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HireSmartsheetExpert" ADD CONSTRAINT "HireSmartsheetExpert_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemAdminSupport" ADD CONSTRAINT "SystemAdminSupport_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PremiumAppSupport" ADD CONSTRAINT "PremiumAppSupport_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmoControlCenter" ADD CONSTRAINT "PmoControlCenter_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseRequest" ADD CONSTRAINT "LicenseRequest_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdhocRequest" ADD CONSTRAINT "AdhocRequest_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_awarded_admin_id_fkey" FOREIGN KEY ("awarded_admin_id") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_awarded_freelancer_id_fkey" FOREIGN KEY ("awarded_freelancer_id") REFERENCES "freelancers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewed_admin_id_fkey" FOREIGN KEY ("reviewed_admin_id") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewed_freelancer_id_fkey" FOREIGN KEY ("reviewed_freelancer_id") REFERENCES "freelancers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
