import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config();

const server = Fastify({
  logger: true
});

import { issueRoutes } from './routes/issue.routes';
import { uploadRoutes } from './routes/upload.routes';
import { statsRoutes } from './routes/stats.routes';
import { settingsRoutes } from './routes/settings.routes';

const start = async () => {
  try {
    // 注册插件
    await server.register(cors, { 
      origin: '*' // 开发阶段允许所有跨域
    });
    
    // 配置 multipart 支持大文件上传
    await server.register(multipart, {
      limits: {
        fileSize: 1024 * 1024 * 1024, // 1GB
      }
    });

    // 配置静态文件服务，用于访问上传的文件
    await server.register(fastifyStatic, {
      root: path.join(__dirname, '../uploads'),
      prefix: '/api/uploads/files/', // 访问路径前缀: http://localhost:3000/api/uploads/files/filename.jpg
    });

    // 注册路由
    await server.register(issueRoutes, { prefix: '/api/issues' });
    await server.register(uploadRoutes, { prefix: '/api/uploads' });
    await server.register(statsRoutes, { prefix: '/api/stats' });
    await server.register(settingsRoutes, { prefix: '/api/settings' });

    // 基础健康检查路由
    server.get('/ping', async (request, reply) => {
      return { status: 'ok', message: 'Product Issue Collector Backend is running' };
    });

    const port = parseInt(process.env.PORT || '3000');
    const host = '0.0.0.0';
    
    await server.listen({ port, host });
    console.log(`Server listening on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
