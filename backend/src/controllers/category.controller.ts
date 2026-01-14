import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const categoryController = {
    // Get all categories
    findAll: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const categories = await prisma.category.findMany({
                orderBy: { id: 'asc' } // Keep consistent order
            });
            return reply.send(categories);
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    },

    // Create new category
    create: async (request: FastifyRequest<{ Body: { name: string } }>, reply: FastifyReply) => {
        try {
            const { name } = request.body;
            if (!name) {
                return reply.code(400).send({ error: 'Name is required' });
            }

            // Check if exists
            const existing = await prisma.category.findUnique({ where: { name } });
            if (existing) {
                return reply.send(existing);
            }

            const category = await prisma.category.create({
                data: { name }
            });
            return reply.code(201).send(category);
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    },

    // Update category
    update: async (request: FastifyRequest<{ Params: { id: string }, Body: { name: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const { name } = request.body;
            const categoryId = Number(id);

            if (!name || !name.trim()) {
                return reply.code(400).send({ error: 'Name is required' });
            }

            const category = await prisma.category.update({
                where: { id: categoryId },
                data: { name: name.trim() }
            });
            return reply.send(category);
        } catch (error: any) {
            request.log.error(error);
            if (error.code === 'P2025') {
                return reply.code(404).send({ error: 'Category not found' });
            }
            return reply.code(500).send({ error: 'Update failed', details: error.message });
        }
    },

    // Delete category
    delete: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const categoryId = Number(id);

            // Check if used by issues?
            // Optional: prevent delete if used, or set issues to null.
            // For now, let's keep it simple: Prisma will throw if foreign key constraint fails unless we handle it.
            // But our relation is optional (Issue.categoryId is nullable), so we might need to nullify them first?
            // Actually, if we just delete, Prisma default behavior depends on relation.
            // Let's assume SetNull or Restrict. Default is usually restrictive. 
            // Let's check relation later. For now, try delete.

            await prisma.category.delete({
                where: { id: categoryId }
            });

            return reply.send({ success: true });
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Could not delete category (maybe in use?)' });
        }
    }
};
