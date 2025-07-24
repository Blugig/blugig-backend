import { Prisma } from '@prisma/client'

export const formSelectFields: Prisma.FormSubmissionSelect = {
    solution_implementation: true,
    api_integration: true,
    hire_smartsheet_expert: true,
    system_admin_support: true,
    adhoc_request: true,
    premium_app_support: true,
    book_one_on_one: true,
    pmo_control_center: true,
    license_request: true,
}