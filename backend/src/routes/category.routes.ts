import { FastifyInstance } from 'fastify';
import { categoryController } from '../controllers/category.controller';

export async function categoryRoutes(fastify: FastifyInstance) {
    fastify.get('/', categoryController.findAll);
    fastify.post('/', categoryController.create);
    fastify.put('/:id', categoryController.update);
    fastify.delete('/:id', categoryController.delete);
}
