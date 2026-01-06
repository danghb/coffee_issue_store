import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

// 开启 WAL 模式 (SQLite)
// 注意：如果在非 SQLite 环境下运行，这行代码可能会报错，需要加判断
// 但目前我们的架构明确是 SQLite，所以直接执行
async function enableWal() {
  try {
    // 只有在连接建立后才能执行 PRAGMA 命令
    // Prisma Client 会在第一次查询时自动连接
    // 我们这里不强制连接，而是等待应用启动后的第一次交互
    // 或者我们可以在应用启动时显式连接
    await prisma.$connect();
    await prisma.$executeRawUnsafe('PRAGMA journal_mode=WAL;');
    await prisma.$executeRawUnsafe('PRAGMA synchronous=NORMAL;');
    console.log('SQLite WAL mode enabled');
  } catch (error) {
    console.error('Failed to enable WAL mode:', error);
  }
}

// 立即尝试开启 WAL
enableWal();

export default prisma;
