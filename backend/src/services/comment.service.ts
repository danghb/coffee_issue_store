import prisma from '../utils/prisma';
import { IssueStatus } from '../utils/enums';

interface CreateCommentInput {
  issueId: number;
  content?: string;
  author: string;
  type?: string;
  isInternal?: boolean;
  oldStatus?: string;
  newStatus?: string;
}

export const commentService = {
  // 创建评论 (或系统消息)
  async create(data: CreateCommentInput) {
    return prisma.comment.create({
      data: {
        issueId: data.issueId,
        content: data.content,
        author: data.author,
        type: data.type || 'MESSAGE', // MESSAGE, STATUS_CHANGE
        isInternal: data.isInternal || false,
        oldStatus: data.oldStatus,
        newStatus: data.newStatus
      }
    });
  },

  // 获取某个 Issue 的所有评论
  async findByIssueId(issueId: number) {
    return prisma.comment.findMany({
      where: { issueId },
      orderBy: { createdAt: 'asc' }
    });
  },

  // 更新评论内容
  async update(id: number, content: string) {
    return prisma.comment.update({
      where: { id },
      data: { content }
    });
  }
};
