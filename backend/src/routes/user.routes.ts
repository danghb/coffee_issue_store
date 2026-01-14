import { FastifyInstance } from 'fastify';
import { userController } from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

export async function userRoutes(server: FastifyInstance) {
    // All user management routes require Admin access
    server.get('/', { preHandler: [authenticate, requireAdmin] }, userController.getAllUsers as any);
    server.put('/:id/role', { preHandler: [authenticate, requireAdmin] }, userController.updateRole as any);
    server.put('/:id/password', { preHandler: [authenticate, requireAdmin] }, userController.resetPassword as any);
    server.delete('/:id', { preHandler: [authenticate, requireAdmin] }, userController.deleteUser as any);
}
