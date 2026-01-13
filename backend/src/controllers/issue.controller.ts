import { FastifyReply, FastifyRequest } from 'fastify';
import { issueService } from '../services/issue.service';
import { commentService } from '../services/comment.service';
import { IssueStatus } from '../utils/enums';

interface CreateIssueBody {
  title: string;
  description: string;
  modelId: number;
  reporterName: string;
  submitDate?: string;
  contact?: string;
  serialNumber?: string;
  purchaseDate?: string;
  customerName?: string;
  firmware?: string;
  softwareVer?: string;
  occurredAt?: string;
  frequency?: string;
  phenomenon?: string;
  errorCode?: string;
  environment?: string;
  location?: string;
  waterType?: string;
  voltage?: string;
  usageFrequency?: string;
  restarted?: boolean;
  cleaned?: boolean;
  replacedPart?: string;
  troubleshooting?: string;
  attachmentIds?: number[];
}

interface GetIssuesQuery {
  page?: number;
  limit?: number;
  status?: IssueStatus;
  search?: string; // 改名为 search，支持全能搜索
  modelId?: number;
  startDate?: string; // 新增开始时间
  endDate?: string;   // 新增结束时间
  sortBy?: 'createdAt' | 'priority' | 'severity';
  sortOrder?: 'asc' | 'desc';
}

interface UpdateStatusBody {
  status: IssueStatus;
  author?: string;
}

interface CreateCommentBody {
  content: string;
  author: string;
  isInternal?: boolean; // New
  attachmentIds?: number[]; // New
}

export const issueController = {
  // 创建问题
  create: async (request: FastifyRequest<{ Body: CreateIssueBody }>, reply: FastifyReply) => {
    try {
      const body = request.body;

      // 简单校验
      if (!body.title || !body.description || !body.modelId || !body.reporterName) {
        return reply.code(400).send({ error: 'Missing required fields' });
      }

      const issue = await issueService.create(body);

      return reply.code(201).send(issue);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  // 获取问题列表
  findAll: async (request: FastifyRequest<{ Querystring: GetIssuesQuery }>, reply: FastifyReply) => {
    try {
      const { page, limit, status, search, modelId, startDate, endDate } = request.query;

      // Parse multi-select params (comma separated)
      let statusList: IssueStatus[] | undefined = undefined;
      if (status) {
        // Assume comma separated string for multiple statuses. 
        // If it sends array (e.g. ?status=PENDING&status=IN_PROGRESS), Fastify handles it depending on query parser, 
        // but typically standard URLSearchParams with comma is easier for manual handling if querystring array support varies.
        // Let's support comma-separated string: "PENDING,IN_PROGRESS"
        const statusStr = String(status);
        statusList = statusStr.split(',').filter(Boolean) as IssueStatus[];
      }

      let modelIdList: number[] | undefined = undefined;
      if (modelId) {
        const modelStr = String(modelId);
        modelIdList = modelStr.split(',').map(s => Number(s)).filter(n => !isNaN(n));
      }

      const result = await issueService.findAll(
        Number(page) || 1,
        Number(limit) || 20,
        statusList,
        search,
        modelIdList,
        startDate,
        endDate,
        request.query.sortBy,
        request.query.sortOrder
      );
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  // 获取详情 (Support ID or NanoID)
  findOne: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const user = request.user as any; // From JWT (optionalAuth middleware should be applied if token exists)

      // Try to parse as number (for admin/internal ID), otherwise treat as string (NanoID)
      const numericId = Number(id);
      const isNumeric = !isNaN(numericId);

      const issue = await issueService.findOne(isNumeric ? numericId : id);

      if (!issue) {
        return reply.code(404).send({ error: 'Issue not found' });
      }

      // Visibility Filter
      // If user is NOT (Admin or Developer), hide internal comments and attachments
      // SUPPORT user is treated as logged-in but restricted.
      const isInternalViewer = user && (user.role === 'ADMIN' || user.role === 'DEVELOPER');

      if (!isInternalViewer) {
        if (issue.comments) {
          issue.comments = issue.comments.filter(c => !c.isInternal);
        }
        if (issue.attachments) {
          issue.attachments = issue.attachments.filter(a => !a.isInternal);
        }
      }

      return reply.send(issue);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  // 获取所有机型
  getModels: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const models = await issueService.getDeviceModels();
      return reply.send(models);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  // 更新状态 (Developer/Admin Only)
  updateStatus: async (request: FastifyRequest<{ Params: { id: string }, Body: UpdateStatusBody }>, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      if (!user || (user.role !== 'ADMIN' && user.role !== 'DEVELOPER')) {
        return reply.code(403).send({ error: 'Forbidden: Developer access required' });
      }

      const id = Number(request.params.id);
      const { status, author } = request.body;

      if (!status) {
        return reply.code(400).send({ error: 'Status is required' });
      }

      const issue = await issueService.updateStatus(id, status, author || 'Admin');
      return reply.send(issue);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  // 添加评论
  addComment: async (request: FastifyRequest<{ Params: { id: string }, Body: CreateCommentBody }>, reply: FastifyReply) => {
    try {
      const id = Number(request.params.id);
      const { content, author, isInternal, attachmentIds } = request.body;
      const user = request.user as any; // From JWT middleware

      if (!content) {
        return reply.code(400).send({ error: 'Content is required' });
      }

      // 自动判断作者类型
      const authorName = user ? (user.username || 'Admin') : (author || 'Guest');
      // 记录真实角色，未登录则视为 'SUPPORT' (根据用户定义：未登录用户也属于SUPPORT类型) 或保持 'USER' (Guest)
      // 为了区分登录与否，未登录保持 'USER'，登录用户记录其 Role
      const authorType = user ? user.role : 'USER';

      // Determine visibility
      // If Admin/Developer: use provided isInternal (default true)
      // If Support/Guest: force isInternal = false

      let finalIsInternal = false;
      const canPostInternal = user && (user.role === 'ADMIN' || user.role === 'DEVELOPER');

      if (canPostInternal) {
        finalIsInternal = (typeof isInternal === 'boolean') ? isInternal : true;
      } else {
        // Guest or Support
        finalIsInternal = false;
      }

      const comment = await issueService.addComment(id, content, authorName, authorType, finalIsInternal, attachmentIds);
      return reply.code(201).send(comment);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  // 更新 Issue (Support/Developer/Admin)
  update: async (request: FastifyRequest<{ Params: { id: string }, Body: any }>, reply: FastifyReply) => {
    try {
      const id = Number(request.params.id);
      const body = request.body as any;
      const user = request.user as any;

      // Permission Check
      // Developer/Admin: Can update everything (including priority/severity)
      // Support (Logged in): Can update basic info, BUT NOT priority/severity/status directly via this endpoint
      // Guest: Can update basic info (as per "Unlogged is Support" rule)

      const isDeveloper = user && (user.role === 'ADMIN' || user.role === 'DEVELOPER');

      if (!isDeveloper) {
        // Restricted update for Support/Guest
        // Remove sensitive fields from body to prevent unauthorized changes
        delete body.priority;
        delete body.severity;
        delete body.status;
        delete body.parentId; // Cannot merge
      }

      const updated = await issueService.update(id, body);
      return reply.send(updated);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  // 并案处理 (Admin Only)
  merge: async (request: FastifyRequest<{ Params: { id: string }, Body: { childIds: number[] } }>, reply: FastifyReply) => {
    try {
      const parentId = Number(request.params.id);
      const { childIds } = request.body;
      const user = request.user as any;

      if (!childIds || childIds.length === 0) {
        return reply.code(400).send({ error: 'childIds is required' });
      }

      const author = user?.username || 'Admin';
      await issueService.merge(parentId, childIds, author);

      return reply.send({ message: 'Issues merged successfully' });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  // 取消并案处理 (Admin Only)
  unmerge: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const childId = Number(request.params.id);
      const user = request.user as any;
      const author = user?.username || 'Admin';

      await issueService.unmerge(childId, author);

      return reply.send({ message: 'Issue unmerged successfully' });
    } catch (error: any) {
      request.log.error(error);
      if (error.message === 'Issue is not merged or does not exist') {
        return reply.code(400).send({ error: error.message });
      }
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  // 更新评论
  updateComment: async (request: FastifyRequest<{ Params: { id: string; commentId: string }; Body: { content: string } }>, reply: FastifyReply) => {
    try {
      const commentId = parseInt(request.params.commentId);
      const { content } = request.body;

      if (!content) {
        return reply.code(400).send({ error: 'Content is required' });
      }

      // 更新评论
      const updatedComment = await commentService.update(commentId, content);

      return reply.send(updatedComment);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },
};
