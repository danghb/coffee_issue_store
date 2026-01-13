import { FastifyReply, FastifyRequest } from 'fastify';
import { uploadService } from '../services/upload.service';
import prisma from '../utils/prisma';
import * as path from 'path';
import * as fs from 'fs';

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

  // 下载文件（设置正确的文件名）
  download: async (request: FastifyRequest<{ Params: { filename: string } }>, reply: FastifyReply) => {
    try {
      const { filename } = request.params;

      // 从数据库查询文件信息
      const attachment = await prisma.attachment.findFirst({
        where: { path: filename }
      });

      if (!attachment) {
        return reply.code(404).send({ error: 'File not found' });
      }

      const filePath = path.join(process.cwd(), 'uploads', filename);

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return reply.code(404).send({ error: 'File not found on disk' });
      }

      const stat = fs.statSync(filePath);

      // 设置响应头
      reply.header('Content-Length', stat.size);
      reply.header('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`);
      reply.header('Content-Type', attachment.mimeType);

      // 使用流发送文件
      const stream = fs.createReadStream(filePath);
      return reply.send(stream);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Download failed' });
    }
  }
};
