import { Request } from 'express';

import { prisma } from '../../lib/prisma';
import CustomResponse from '../../utils/customResponse';
import { createPaginatedResponse, getPagination } from '../../utils/queryHelpers';

export const getAllAdmins = async (req: Request, res: CustomResponse) => {
    try {
        const admins = await prisma.admin.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                is_super_admin: true,
                permissions: true,
                created_at: true,
                last_login: true,
            }
        });

        res.success("Admins fetched successfully", admins, 200);
    } catch (error) {
        res.failure("Failed to fetch admins", error, 500);
    }
}

export const getAdminDetails = async (req: Request, res: CustomResponse) => {
    try {
        const admin = await prisma.admin.findUnique({
            where: { email: req.params.email },
            select: {
                id: true,
                name: true,
                email: true,
                is_super_admin: true,
                permissions: true,
                created_at: true,
                last_login: true,
            }
        });

        res.success("Admin fetched successfully", admin, 200);
    } catch (error) {
        res.failure("Failed to fetch admin", error, 500);
    }
}

export const addAdmin = async (req: Request, res: CustomResponse) => {
    try {
        const { name, email, password, permissions, is_super_admin } = req.body;
        
        const perms = permissions.split(',');

        const admin = await prisma.admin.create({
            data: {
                name,
                email,
                password,
                permissions: perms,
                is_super_admin: is_super_admin ? true : false,
            },
        });

        res.success("Admin added successfully", admin, 200);
    } catch (error) {
        res.failure("Failed to add admin", error, 500); 
    }
}

export const updateAdmin = async (req: Request, res: CustomResponse) => {
    try {

        const { email, permissions } = req.body; 

        const admin = await prisma.admin.update({
            where: { email },
            data: {
                permissions: permissions.join(','),
            },
        });

        res.success("Admin updated successfully", admin, 200);
    } catch (error) {
        res.failure("Failed to update admin", error, 500);
    }
}

export const deleteAdmin = async (req: Request, res: CustomResponse) => {
    try {

        const { email } = req.body;

        const admin = await prisma.admin.delete({
            where: { email },
        });

        res.success("Admin deleted successfully", admin, 200);
    } catch (error) {
        res.failure("Failed to delete admin", error, 500);
    }
}