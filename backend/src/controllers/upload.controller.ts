import { FastifyReply, FastifyRequest } from 'fastify';
import { uploadService } from '../services/upload.service';

export const uploadController = {
  // 上传文件
  upload: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      const attachment = await uploadService.processUpload(data);
      
      return reply.code(201).send(attachment);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Upload failed' });
    }
  },

  // 获取上传的文件信息 (可选，实际上 GET /uploads/filename 由 static 插件处理)
  // 这里可以做一些权限控制或者元数据查询
};
