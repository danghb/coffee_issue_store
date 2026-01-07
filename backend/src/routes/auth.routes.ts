import { FastifyInstance } from 'fastify';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

export async function authRoutes(server: FastifyInstance) {
  server.post('/register', authController.register);
  server.post('/login', authController.login);
  
  // Protected route example
  server.get('/me', { preHandler: [authenticate] }, authController.getMe);
}
