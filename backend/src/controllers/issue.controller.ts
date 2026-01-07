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
  customerName?: string;
  modelId?: number;
}

interface UpdateStatusBody {
  status: IssueStatus;
  author?: string;
}

interface CreateCommentBody {
  content: string;
  author: string;
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
      const { page, limit, status, customerName, modelId } = request.query;
      const result = await issueService.findAll(
        Number(page) || 1,
        Number(limit) || 20,
        status,
        customerName,
        modelId ? Number(modelId) : undefined
      );
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  // 获取详情
  findOne: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const id = Number(request.params.id);
      const issue = await issueService.findOne(id);
      
      if (!issue) {
        return reply.code(404).send({ error: 'Issue not found' });
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

  // 更新状态
  updateStatus: async (request: FastifyRequest<{ Params: { id: string }, Body: UpdateStatusBody }>, reply: FastifyReply) => {
    try {
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
      const { content, author } = request.body;

      if (!content) {
        return reply.code(400).send({ error: 'Content is required' });
      }

      const comment = await commentService.create({
        issueId: id,
        content,
        author: author || 'Admin',
        type: 'MESSAGE'
      });

      return reply.code(201).send(comment);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  }
};
