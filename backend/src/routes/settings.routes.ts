import { FastifyInstance } from 'fastify';
import { settingsController } from '../controllers/settings.controller';

export async function settingsRoutes(fastify: FastifyInstance) {
  // Models
  fastify.get('/models', settingsController.getModels);
  fastify.post('/models', settingsController.createModel);
  fastify.put('/models/:id', settingsController.updateModel);
  fastify.delete('/models/:id', settingsController.deleteModel);

  // Fields
  fastify.get('/fields', settingsController.getFields);
  fastify.post('/fields', settingsController.createField);
  fastify.put('/fields/:id', settingsController.updateField);
  fastify.delete('/fields/:id', settingsController.deleteField);
}
