import { FastifyReply, FastifyRequest } from 'fastify';
import { taskService } from '../services/task.service';

export const taskController = {
    // Create Task
    create: async (request: FastifyRequest<{ Params: { issueId: string }, Body: { title: string; description?: string; assigneeId?: number; assigneeName?: string } }>, reply: FastifyReply) => {
        try {
            const issueId = Number(request.params.issueId);
            const user = request.user as any;

            if (!request.body.title) {
                return reply.code(400).send({ error: 'Title is required' });
            }

            const task = await taskService.createTask(issueId, request.body, user.id);
            return reply.code(201).send(task);
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to create task' });
        }
    },

    // Get Tasks for Issue
    getAll: async (request: FastifyRequest<{ Params: { issueId: string } }>, reply: FastifyReply) => {
        try {
            const issueId = Number(request.params.issueId);
            const tasks = await taskService.getTasksByIssue(issueId);
            return reply.send(tasks);
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch tasks' });
        }
    },

    // Update Task
    update: async (request: FastifyRequest<{ Params: { taskId: string }, Body: { status?: string; result?: string; title?: string; description?: string; assigneeId?: number; assigneeName?: string } }>, reply: FastifyReply) => {
        try {
            const taskId = Number(request.params.taskId);
            const task = await taskService.updateTask(taskId, request.body);
            return reply.send(task);
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to update task' });
        }
    },

    // Delete Task
    delete: async (request: FastifyRequest<{ Params: { taskId: string } }>, reply: FastifyReply) => {
        try {
            const taskId = Number(request.params.taskId);
            await taskService.deleteTask(taskId);
            return reply.code(204).send();
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to delete task' });
        }
    }
};
