import { FastifyInstance } from 'fastify';
import { issueController } from '../controllers/issue.controller';
import { taskController } from '../controllers/task.controller';
import { authenticate, requireAdmin, requireDeveloper } from '../middleware/auth.middleware';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const optionalAuth = async (request: any, reply: any) => {
  try {
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, JWT_SECRET);
      request.user = decoded;
    }
  } catch (err) {
    // Ignore error for optional auth
  }
};

export async function issueRoutes(server: FastifyInstance) {
  // Public Routes (or Guest)
  server.post('/', issueController.create as any);
  server.get('/models', issueController.getModels as any); // Public for form

  // Protected Routes
  // 详情: 登录用户均可看，但在 Controller 内部做数据过滤
  // 列表: 登录用户均可看
  server.get('/', { preHandler: [authenticate] }, issueController.findAll as any);

  // Get Detail (Support NanoID for guest, ID for admin)
  // Public access allowed, controller handles logic
  server.get('/:id', { preHandler: [optionalAuth] }, issueController.findOne as any);

  // Delete Issue (Admin only)
  server.delete('/:id', { preHandler: [authenticate, requireAdmin] }, issueController.delete as any);

  // Status Update: Developer/Admin
  server.patch('/:id/status', { preHandler: [authenticate, requireDeveloper] }, issueController.updateStatus as any);

  // General Update (Support/Developer/Admin - for basic info)
  // We allow public access for update? No, that's dangerous.
  // But user said "unlogged user" is also support.
  // If we require auth, unlogged users can't edit.
  // Solution: Allow update if user is authenticated OR if it's open access?
  // Let's stick to: Authenticated users (Support/Dev/Admin) can edit.
  // Guest users... maybe we can't let them edit blindly without some token?
  // For now, let's assume "Support" implies logged-in support account.
  // If User insists on unlogged users editing, we'd need a magic link or just open it up (risky).
  // Given previous instructions "Unlogged user is also SUPPORT type", let's try to allow it but maybe limit fields in controller?
  // For now, let's use optionalAuth and handle permission in controller.
  server.put('/:id', { preHandler: [optionalAuth] }, issueController.update as any);

  // Merge Issues (Developer/Admin)
  server.post('/:id/merge', { preHandler: [authenticate, requireDeveloper] }, issueController.merge as any);

  // Unmerge Issues (Developer/Admin)
  server.post('/:id/unmerge', { preHandler: [authenticate, requireDeveloper] }, issueController.unmerge as any);

  // Add comment
  server.post('/:id/comments', { preHandler: [optionalAuth] }, issueController.addComment as any);

  // Update comment
  server.put('/:id/comments/:commentId', { preHandler: [authenticate] }, issueController.updateComment as any);

  // --- Task Routes ---
  // Create Task
  server.post('/:issueId/tasks', { preHandler: [authenticate] }, taskController.create as any);

  // Get Tasks
  server.get('/:issueId/tasks', { preHandler: [authenticate] }, taskController.getAll as any);

  // Update Task (Using issueId in path just for nesting consistency, controller uses taskId)
  server.put('/:issueId/tasks/:taskId', { preHandler: [authenticate] }, taskController.update as any);

  // Delete Task
  server.delete('/:issueId/tasks/:taskId', { preHandler: [authenticate] }, taskController.delete as any);
}
