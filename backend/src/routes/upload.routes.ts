import { FastifyInstance } from 'fastify';
import { uploadController } from '../controllers/upload.controller';

export async function uploadRoutes(server: FastifyInstance) {
  server.post('/', uploadController.upload);
}
