import { Prisma } from '@prisma/client'

export const basicUserFields: Prisma.UserSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    user_type: true,
    
    company_name: true,

    domain_expertise: true,
    certificate_link: true,

    created_at: true,
    updated_at: true,
}