import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 加载环境变量
dotenv.config();

// --- 日志配置 ---
// 确保日志目录存在
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 创建日志文件流
const logStream = fs.createWriteStream(path.join(logDir, 'app.log'), { flags: 'a' });

const server = Fastify({
  logger: {
    level: 'info',
    // 同时也输出到控制台(stdout)方便Docker logs查看
    // 实际生产中往往建议只输出stdout，由Docker Driver处理，但按用户要求存文件：
    stream: logStream
  }
});

// Hack: 手动输出到控制台以便 docker logs 也能看到 (因为上面 stream 覆盖了默认 stdout)
// 更好的做法是使用 pino.multistream 但不想引入额外依赖。
// 这里简单做一个 console hook 或者 just let it be file only and user tails file.
// 用户明确说 "看日志才能继续排错" -> 文件最可靠。
// 为了方便调试，我们还是保留 stdout 的输出：
// 可以在 Dockerfile CMD 中用 tee，或者这里双写。
// 鉴于 Fastify logger stream 只能一个，我们这里优先满足 "文件持久化"。
// 开发环境(Dev)可能如果不定义 file stream 最好还是 console.
// 让我们做一个简单的判断：
// 生产/Docker环境(有logs挂载) -> 写文件
// 开发环境(没有/logs挂载或 npm run dev) -> 尽量还是 Console 方便?
// 但用户说 "一旦报错 只有看日志"，意指生产环境。
// 我们可以用 Pino 默认的 behavior (Console) + 一个 Hook 写入文件?
// 或者简单的: 
server.addHook('onResponse', (request, reply, done) => {
  // 每次请求结束，额外写一行到 console (如果 logger 被重定向到文件了)
  // console.log(`[${new Date().toISOString()}] ${request.method} ${request.url} - ${reply.statusCode}`);
  done();
});
// 实际上，如果我们将 stream 设为 logStream，标准输出就没了。
// 这是一个 trade-off。
// 修正策略：为了让 `docker logs` 和文件都有日志，我们修改为：
// 不在 Fastify 构造函数里 override stream。
// 而是 hook `onRequest` / `onResponse` / `onError` 手动追加写入文件? 
// 或者，最稳妥的：使用 pino.destination(fd) 是不行的，因为要双写。
// 
// 最终方案：满足用户 "文件日志" 的核心需求。
// Fastify logger -> file. 
// User checks file via `tail -f data/logs/app.log`.
// Docker logs will be empty-ish. This is acceptable for "File Based Logging" request.


import { issueRoutes } from './routes/issue.routes';
import { uploadRoutes } from './routes/upload.routes';
import { statsRoutes } from './routes/stats.routes';
import { settingsRoutes } from './routes/settings.routes';
import { authRoutes } from './routes/auth.routes';
import { categoryRoutes } from './routes/category.routes';
import { userRoutes } from './routes/user.routes';
import { ipWhitelistMiddleware } from './middleware/ip.middleware';

const start = async () => {
  try {
    // 注册插件
    await server.register(cors, {
      origin: process.env.CORS_ORIGIN || '*' // 生产环境应设为前端域名
    });

    // IP Restriction Middleware
    server.addHook('onRequest', ipWhitelistMiddleware);

    // ... multipart and static plugins ...
    await server.register(multipart, {
      limits: {
        fileSize: 1024 * 1024 * 1024, // 1GB
      }
    });

    // 静态文件服务已移除，改用专用的下载端点来控制文件名
    // await server.register(fastifyStatic, {
    //   root: path.join(__dirname, '../uploads'),
    //   prefix: '/api/uploads/files/',
    // });

    // 注册路由
    await server.register(authRoutes, { prefix: '/api/auth' });
    await server.register(issueRoutes, { prefix: '/api/issues' });
    await server.register(uploadRoutes, { prefix: '/api/uploads' });
    await server.register(statsRoutes, { prefix: '/api/stats' });
    await server.register(settingsRoutes, { prefix: '/api/settings' });
    await server.register(categoryRoutes, { prefix: '/api/categories' });
    await server.register(userRoutes, { prefix: '/api/users' });

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
