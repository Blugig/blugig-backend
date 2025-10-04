import { Request } from 'express';
import bcrypt from 'bcrypt';

import { prisma } from '../../lib/prisma';
import CustomResponse from '../../utils/customResponse';
import { sendCredentialEmail } from '../../utils/sendMail';
import { PERMISSIONS } from '../../utils/misc';
import { generateFileUrl } from '../../lib/fileUpload';
// import { createPaginatedResponse, getPagination } from '../../utils/queryHelpers';

export const getProfile = async (req: Request, res: CustomResponse) => {
    try {
        const { id, userType } = (req as any).user;
        var user = {};

        if (userType === 'admin') {
            user = await prisma.admin.findUnique({
                where: { id },
                select: {
                    id: true,
                    profile_photo: true,
                    name: true,
                    email: true,
                    is_super_admin: true,
                    permissions: true,
                    created_at: true,
                    last_login: true,
                }
            });
        } else if (userType === 'freelancer') {
            user = await prisma.freelancer.findUnique({
                where: { id },
                select: {
                    id: true,
                    profile_photo: true,
                    name: true,
                    email: true,
                    skills: true,
                    created_at: true,
                    last_login: true,
                }
            });
        }

        user = { ...user, userType };

        res.success("Profile fetched successfully", user, 200);
    } catch (error) {
        res.failure("Failed to fetch profile", error, 500);
    }
}

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
        const { name, email, permissions, is_super_admin } = req.body;

        const plainPassword = Math.random().toString(36).slice(-8);
        const password = await bcrypt.hash(plainPassword, 14);

        const existingAdmin = await prisma.admin.findUnique({
            where: { email }
        });

        if (existingAdmin) {
            return res.failure("Admin with this email already exists", null, 400);
        }

        const admin = await prisma.admin.create({
            data: {
                name,
                email,
                password,
                permissions,
                is_super_admin: is_super_admin ? true : false,
                is_active: true,
            },
        });

        sendCredentialEmail(email, name, plainPassword);

        return res.success("Admin added successfully", admin, 200);
    } catch (error) {
        console.log(error);
        res.failure("Failed to add admin", error, 500);
    }
}

export const updateAdminPerms = async (req: Request, res: CustomResponse) => {
    try {
        const { email, permissions } = req.body;
        const id = (req as any).user.id;

        const reqAdmin = await prisma.admin.findUnique({
            where: { id: id },
        });

        if (!reqAdmin.is_super_admin) {
            return res.failure("Only super admins can update permissions", null, 403);
        }

        const admin = await prisma.admin.update({
            where: { email },
            data: { permissions }
        });

        res.success("Admin permissions updated successfully", admin, 200);
    } catch (error) {
        res.failure("Failed to update admin permissions", error, 500);
    }
}

export const updateAdmin = async (req: Request, res: CustomResponse) => {
    try {
        const { userType } = (req as any).user;
        const { email, permissions, ...data } = req.body;
        var toUpdate = data;

        if (permissions) {
            // Check if permissions is a subset of PERMISSIONS
            const invalidPermissions = permissions.filter((perm: string) => !PERMISSIONS.includes(perm));
    
            if (invalidPermissions.length > 0) {
                return res.failure(`Invalid permissions: ${invalidPermissions.join(', ')}`, null, 400);
            }
        }

        if (req.file) {
            const url = generateFileUrl(req.file?.filename);
            toUpdate.profile_photo = url;
        }

        console.log(userType, toUpdate, toUpdate.permissions);

        if (userType === 'freelancer') {
            await prisma.freelancer.update({
                where: { email },
                data: toUpdate
            });
        } else {
            await prisma.admin.update({
                where: { email },
                data: toUpdate
            });
        }


        return res.success("Profile updated successfully", {}, 200);
    } catch (error) {
        console.log(error);
        return res.failure("Failed to update admin", error, 500);
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