import { FastifyInstance } from 'fastify';
import { statsController } from '../controllers/stats.controller';

export async function statsRoutes(fastify: FastifyInstance) {
  fastify.get('/dashboard', statsController.getDashboard);
  fastify.get('/export', statsController.exportIssues);
}
