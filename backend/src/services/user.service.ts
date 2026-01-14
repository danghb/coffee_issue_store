import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';

export const userService = {
    // 获取所有用户（过滤内置账号）
    async getAllUsers() {
        return prisma.user.findMany({
            where: {
                isBuiltin: false
            },
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    },

    // 更新用户角色
    async updateUserRole(id: number, role: string) {
        // 检查是否为内置账号
        const user = await prisma.user.findUnique({
            where: { id },
            select: { isBuiltin: true }
        });

        if (user?.isBuiltin) {
            throw new Error('Cannot modify builtin account');
        }

        return prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });
    },

    // 重置用户密码
    async resetPassword(id: number, newPassword: string) {
        // 检查是否为内置账号
        const user = await prisma.user.findUnique({
            where: { id },
            select: { isBuiltin: true }
        });

        if (user?.isBuiltin) {
            throw new Error('Cannot reset password for builtin account');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        return prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
            select: {
                id: true,
                username: true,
                name: true,
                role: true
            }
        });
    },

    // 删除用户
    async deleteUser(id: number) {
        // 检查是否为内置账号
        const user = await prisma.user.findUnique({
            where: { id },
            select: { isBuiltin: true }
        });

        if (user?.isBuiltin) {
            throw new Error('Cannot delete builtin account');
        }

        return prisma.user.delete({
            where: { id }
        });
    },

    // 检查是否为第一个用户
    async isFirstUser(): Promise<boolean> {
        const count = await prisma.user.count({
            where: {
                isBuiltin: false
            }
        });
        return count === 0;
    }
};
