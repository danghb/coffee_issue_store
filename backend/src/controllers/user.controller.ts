import { FastifyReply, FastifyRequest } from 'fastify';
import { userService } from '../services/user.service';

interface UpdateRoleBody {
    role: string;
}

interface ResetPasswordBody {
    newPassword: string;
}

export const userController = {
    // 获取用户列表（仅 ADMIN）
    getAllUsers: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const user = request.user as any;
            if (!user || user.role !== 'ADMIN') {
                return reply.code(403).send({ error: 'Forbidden: Admin access required' });
            }

            const users = await userService.getAllUsers();
            return reply.send(users);
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    },

    // 更新用户角色（仅 ADMIN）
    updateRole: async (request: FastifyRequest<{ Params: { id: string }, Body: UpdateRoleBody }>, reply: FastifyReply) => {
        try {
            const user = request.user as any;
            if (!user || user.role !== 'ADMIN') {
                return reply.code(403).send({ error: 'Forbidden: Admin access required' });
            }

            const userId = Number(request.params.id);
            const { role } = request.body;

            if (!role || !['ADMIN', 'DEVELOPER', 'SUPPORT'].includes(role)) {
                return reply.code(400).send({ error: 'Invalid role' });
            }

            const updatedUser = await userService.updateUserRole(userId, role);
            return reply.send(updatedUser);
        } catch (error: any) {
            request.log.error(error);
            if (error.message === 'Cannot modify builtin account') {
                return reply.code(403).send({ error: error.message });
            }
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    },

    // 重置用户密码（仅 ADMIN）
    resetPassword: async (request: FastifyRequest<{ Params: { id: string }, Body: ResetPasswordBody }>, reply: FastifyReply) => {
        try {
            const user = request.user as any;
            if (!user || user.role !== 'ADMIN') {
                return reply.code(403).send({ error: 'Forbidden: Admin access required' });
            }

            const userId = Number(request.params.id);
            const { newPassword } = request.body;

            if (!newPassword || newPassword.length < 6) {
                return reply.code(400).send({ error: 'Password must be at least 6 characters' });
            }

            const updatedUser = await userService.resetPassword(userId, newPassword);
            return reply.send({ success: true, user: updatedUser });
        } catch (error: any) {
            request.log.error(error);
            if (error.message === 'Cannot reset password for builtin account') {
                return reply.code(403).send({ error: error.message });
            }
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    },

    // 删除用户（仅 ADMIN）
    deleteUser: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const user = request.user as any;
            if (!user || user.role !== 'ADMIN') {
                return reply.code(403).send({ error: 'Forbidden: Admin access required' });
            }

            const userId = Number(request.params.id);
            await userService.deleteUser(userId);

            return reply.send({ success: true });
        } catch (error: any) {
            request.log.error(error);
            if (error.message === 'Cannot delete builtin account') {
                return reply.code(403).send({ error: error.message });
            }
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }
};
