import prisma from '../utils/prisma';

export const taskService = {
    // Create a task
    createTask: async (issueId: number, data: { title: string; description?: string; assigneeId?: number; assigneeName?: string }, userId: number) => {
        return prisma.issueTask.create({
            data: {
                title: data.title,
                description: data.description,
                issueId,
                assigneeId: data.assigneeId,
                assigneeName: data.assigneeName,
                createdById: userId,
                status: 'TODO'
            },
            include: {
                assignee: {
                    select: { id: true, name: true, username: true }
                },
                createdBy: {
                    select: { id: true, name: true, username: true }
                }
            }
        });
    },

    // Update a task (status, result, etc.)
    updateTask: async (taskId: number, data: { status?: string; result?: string; title?: string; description?: string; assigneeId?: number; assigneeName?: string }) => {
        return prisma.issueTask.update({
            where: { id: taskId },
            data,
            include: {
                assignee: {
                    select: { id: true, name: true, username: true }
                },
                createdBy: {
                    select: { id: true, name: true, username: true }
                }
            }
        });
    },

    // Delete a task
    deleteTask: async (taskId: number) => {
        return prisma.issueTask.delete({
            where: { id: taskId }
        });
    },

    // Get all tasks for an issue
    getTasksByIssue: async (issueId: number) => {
        return prisma.issueTask.findMany({
            where: { issueId },
            orderBy: { createdAt: 'desc' },
            include: {
                assignee: {
                    select: { id: true, name: true, username: true }
                },
                createdBy: {
                    select: { id: true, name: true, username: true }
                }
            }
        });
    }
};
