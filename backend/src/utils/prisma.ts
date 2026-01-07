import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

// 开启 WAL 模式 (SQLite)
async function enableWal() {
  try {
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
