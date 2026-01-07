import { FastifyInstance } from 'fastify';
import { issueController } from '../controllers/issue.controller';

export async function issueRoutes(fastify: FastifyInstance) {
  fastify.post('/', issueController.create);
  fastify.get('/', issueController.findAll);
  fastify.get('/:id', issueController.findOne);
  fastify.get('/models', issueController.getModels);
  
  // 新增接口
  fastify.patch('/:id/status', issueController.updateStatus);
  fastify.post('/:id/comments', issueController.addComment);
}
