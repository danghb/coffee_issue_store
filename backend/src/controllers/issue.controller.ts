import { FastifyReply, FastifyRequest } from 'fastify';
import { issueService } from '../services/issue.service';
import { IssueStatus } from '../utils/enums';

interface CreateIssueBody {
  title: string;
  description: string;
  modelId: number;
  firmware?: string;
  reporterName: string;
  contact?: string;
}

interface GetIssuesQuery {
  page?: number;
  limit?: number;
  status?: IssueStatus;
}

export const issueController = {
  // 创建问题
  create: async (request: FastifyRequest<{ Body: CreateIssueBody }>, reply: FastifyReply) => {
    try {
      const { title, description, modelId, firmware, reporterName, contact } = request.body;

      // 简单校验
      if (!title || !description || !modelId || !reporterName) {
        return reply.code(400).send({ error: 'Missing required fields' });
      }

      const issue = await issueService.create({
        title,
        description,
        modelId: Number(modelId),
        firmware,
        reporterName,
        contact
      });

      return reply.code(201).send(issue);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  // 获取问题列表
  findAll: async (request: FastifyRequest<{ Querystring: GetIssuesQuery }>, reply: FastifyReply) => {
    try {
      const { page, limit, status } = request.query;
      const result = await issueService.findAll(
        Number(page) || 1,
        Number(limit) || 20,
        status
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
  }
};
