import { FastifyInstance } from 'fastify';
import { issueController } from '../controllers/issue.controller';

export async function issueRoutes(fastify: FastifyInstance) {
  fastify.post('/', issueController.create);
  fastify.get('/', issueController.findAll);
  fastify.get('/:id', issueController.findOne);
  fastify.get('/models', issueController.getModels);
}
