-- CreateTable
CREATE TABLE "time_slots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "start_time" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "time_slot_bookings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "time_slot_id" INTEGER NOT NULL,
    "book_one_on_one_id" INTEGER NOT NULL,
    "booked_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "time_slot_bookings_time_slot_id_fkey" FOREIGN KEY ("time_slot_id") REFERENCES "time_slots" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "time_slot_bookings_book_one_on_one_id_fkey" FOREIGN KEY ("book_one_on_one_id") REFERENCES "book_one_on_ones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "book_one_on_ones" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "preferred_date" TEXT NOT NULL,
    "preferred_time" TEXT NOT NULL,
    "consultation_focus" TEXT NOT NULL,
    "smartsheet_experience" TEXT NOT NULL,
    "team_size" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "book_one_on_ones_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "user_id" INTEGER NOT NULL,
    "admin_id" TEXT,
    "form_id" INTEGER NOT NULL,
    "latest_message_id" INTEGER,
    "unread_count" INTEGER DEFAULT 0,
    CONSTRAINT "Conversation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Conversation_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conversation_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conversation_latest_message_id_fkey" FOREIGN KEY ("latest_message_id") REFERENCES "Message" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "body" TEXT,
    "time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "media_url" TEXT,
    "media_type" TEXT,
    "message_type" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "offer_id" INTEGER,
    "conversation_id" TEXT NOT NULL,
    "sender_user_id" INTEGER,
    "sender_admin_id" TEXT,
    CONSTRAINT "Message_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "Offer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Message_sender_admin_id_fkey" FOREIGN KEY ("sender_admin_id") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "budget" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "txn_id" TEXT,
    "user_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Offer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "form_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "FormSubmission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SolutionImplementation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "project_title" TEXT NOT NULL,
    "implementation_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "team_size" TEXT NOT NULL,
    "departments_involved" TEXT NOT NULL,
    "current_tools" TEXT NOT NULL,
    "implementation_features" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "SolutionImplementation_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApiIntegration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "integration_type" TEXT NOT NULL,
    "source_system" TEXT NOT NULL,
    "data_to_sync" TEXT NOT NULL,
    "sync_direction" TEXT NOT NULL,
    "sync_frequency" TEXT NOT NULL,
    "api_access_available" TEXT NOT NULL,
    "data_volumne" TEXT NOT NULL,
    "technical_requirements" TEXT NOT NULL,
    "integration_features" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "ApiIntegration_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HireSmartsheetExpert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "position_type" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "required_skills" TEXT NOT NULL,
    "experience_level" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "start_date" TEXT NOT NULL,
    "contract_duration" TEXT NOT NULL,
    "job_description" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "HireSmartsheetExpert_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemAdminSupport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "support_needed" TEXT NOT NULL,
    "smartsheet_plan" TEXT NOT NULL,
    "number_of_users" TEXT NOT NULL,
    "current_admin_experience" TEXT NOT NULL,
    "current_challenges" TEXT NOT NULL,
    "admin_task_needed" TEXT NOT NULL,
    "support_frequency" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "urgency_level" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "SystemAdminSupport_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PremiumAppSupport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_name" TEXT NOT NULL,
    "premium_addons" TEXT NOT NULL,
    "primary_use_case" TEXT NOT NULL,
    "current_smartsheet_plan" TEXT NOT NULL,
    "team_size" TEXT NOT NULL,
    "implementation_scope" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "primary_contact_email" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "PremiumAppSupport_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PmoControlCenter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_name" TEXT NOT NULL,
    "control_centre_type" TEXT NOT NULL,
    "required_features" TEXT NOT NULL,
    "expected_project_scale" TEXT NOT NULL,
    "team_size" TEXT NOT NULL,
    "current_smartsheet_experience" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "primary_contact_email" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "PmoControlCenter_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LicenseRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    CONSTRAINT "LicenseRequest_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdhocRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "need_help_with" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "urgency_level" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "expected_timeline" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "AdhocRequest_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "comment" TEXT NOT NULL,
    "attachment" TEXT,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "Feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "review" TEXT NOT NULL,
    "communication" INTEGER NOT NULL,
    "quality_of_work" INTEGER NOT NULL,
    "timeliness" INTEGER NOT NULL,
    "value_for_money" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cancellation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "comments" TEXT,
    "reason" TEXT NOT NULL,
    "is_refund_eligible" BOOLEAN NOT NULL DEFAULT false,
    "user_id" INTEGER NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cancellation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cancellation_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Refund_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Refund_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "issue" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Report_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "client_secret" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "ephemeral_key_secret" TEXT,
    "tax_rate" DECIMAL NOT NULL,
    "platform_fee_rate" DECIMAL NOT NULL,
    "base_amount" DECIMAL NOT NULL,
    "tax_amount" DECIMAL NOT NULL,
    "platform_fee_amount" DECIMAL NOT NULL,
    "discount_amount" DECIMAL NOT NULL,
    "total_amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "offer_id" INTEGER NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "Offer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "preferred_communication" TEXT,
    "timezone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "access_token" TEXT,
    "last_login" DATETIME,
    "generated_otp" INTEGER,
    "otp_generated_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profile_photo" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_super_admin" BOOLEAN NOT NULL DEFAULT false,
    "access_token" TEXT,
    "last_login" DATETIME,
    "generated_otp" INTEGER,
    "otp_generated_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "permissions" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "time_slot_bookings_book_one_on_one_id_key" ON "time_slot_bookings"("book_one_on_one_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_one_on_ones_form_submission_id_key" ON "book_one_on_ones"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_form_id_key" ON "Conversation"("form_id");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_latest_message_id_key" ON "Conversation"("latest_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_user_id_admin_id_form_id_key" ON "Conversation"("user_id", "admin_id", "form_id");

-- CreateIndex
CREATE UNIQUE INDEX "SolutionImplementation_form_submission_id_key" ON "SolutionImplementation"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "ApiIntegration_form_submission_id_key" ON "ApiIntegration"("form_submission_id");

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
CREATE UNIQUE INDEX "Feedback_user_id_key" ON "Feedback"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Review_user_id_key" ON "Review"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Review_form_submission_id_key" ON "Review"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "Review_user_id_form_submission_id_key" ON "Review"("user_id", "form_submission_id");

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
CREATE UNIQUE INDEX "Refund_user_id_form_submission_id_key" ON "Refund"("user_id", "form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "Report_user_id_key" ON "Report"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_user_id_key" ON "Payment"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_offer_id_key" ON "Payment"("offer_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_form_submission_id_key" ON "Payment"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_user_id_form_submission_id_offer_id_key" ON "Payment"("user_id", "form_submission_id", "offer_id");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");
