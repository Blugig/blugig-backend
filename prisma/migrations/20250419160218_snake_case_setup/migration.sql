-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    CONSTRAINT "AdminPermission_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "access_token" TEXT,
    "last_login" DATETIME,
    "generated_otp" INTEGER,
    "otp_generated_at" DATETIME,
    "user_type" TEXT NOT NULL DEFAULT 'customer',
    "certificate_link" TEXT,
    "domain_expertise" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "form_type" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "user_id" TEXT NOT NULL,
    CONSTRAINT "FormSubmission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SolutionImplementation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "project_name" TEXT NOT NULL,
    "project_type" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "project_goals" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "requirements" TEXT,
    "budget" TEXT NOT NULL,
    "contact_preference" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "SolutionImplementation_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApiIntegration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "integration_type" TEXT NOT NULL,
    "target_application" TEXT NOT NULL,
    "integration_objective" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "budget" TEXT,
    "instructions" TEXT,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "ApiIntegration_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HireSmartsheetExpert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requirements" TEXT NOT NULL,
    "is_full_time" BOOLEAN NOT NULL,
    "project_scope" TEXT NOT NULL,
    "expected_duration" TEXT NOT NULL,
    "domain_focus" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "additional_notes" TEXT,
    "contact_preference" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "HireSmartsheetExpert_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemAdminSupport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "company_name" TEXT NOT NULL,
    "number_of_users" INTEGER NOT NULL,
    "type_of_support" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "budget" TEXT,
    "support_needs" TEXT NOT NULL,
    "contact_preference" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "SystemAdminSupport_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportsDashboard" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "request_type" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "attachment" TEXT,
    "timeline" TEXT NOT NULL,
    "instructions" TEXT,
    "contact_preference" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "ReportsDashboard_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PremiumAppSupport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "add_on_to_configure" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "current_setup_status" TEXT NOT NULL,
    "integration_needs" TEXT NOT NULL,
    "smartsheet_plan" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "isntruction" TEXT NOT NULL,
    "contact_preference" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "PremiumAppSupport_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookOneOnOne" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "consultation_focus" TEXT NOT NULL,
    "time_slot" TEXT NOT NULL,
    "time_zone" TEXT NOT NULL,
    "preferred_meeting_platform" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "business_email" TEXT NOT NULL,
    "phone_number" TEXT,
    "agenda" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "BookOneOnOne_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PmoControlCenter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "service_type" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "project_details" TEXT NOT NULL,
    "expected_projects" INTEGER NOT NULL,
    "smartsheet_admin_access" TEXT NOT NULL,
    "current_setup" BOOLEAN NOT NULL,
    "timeline" TEXT NOT NULL,
    "additional_notes" TEXT,
    "contact_preference" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "PmoControlCenter_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "user_id" TEXT NOT NULL,
    CONSTRAINT "Conversation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "body" TEXT,
    "time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "media_url" TEXT,
    "media_type" TEXT,
    "message_type" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    CONSTRAINT "Message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SolutionImplementation_form_submission_id_key" ON "SolutionImplementation"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "ApiIntegration_form_submission_id_key" ON "ApiIntegration"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "HireSmartsheetExpert_form_submission_id_key" ON "HireSmartsheetExpert"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "SystemAdminSupport_form_submission_id_key" ON "SystemAdminSupport"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "ReportsDashboard_form_submission_id_key" ON "ReportsDashboard"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "PremiumAppSupport_form_submission_id_key" ON "PremiumAppSupport"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "BookOneOnOne_form_submission_id_key" ON "BookOneOnOne"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "PmoControlCenter_form_submission_id_key" ON "PmoControlCenter"("form_submission_id");
