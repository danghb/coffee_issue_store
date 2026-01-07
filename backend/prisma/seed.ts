import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv';
import path from 'path';

// 显式加载 .env 文件
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
})

async function main() {
  const models = [
    { name: 'Model A (Standard)' },
    { name: 'Model B (Pro)' },
    { name: 'Model C (Lite)' },
    { name: 'Legacy Device X' },
  ]

  console.log('Start seeding...')
  
  for (const model of models) {
    const exists = await prisma.deviceModel.findUnique({
      where: { name: model.name }
    })
    
    if (!exists) {
      const result = await prisma.deviceModel.create({
        data: model,
      })
      console.log(`Created model with id: ${result.id}`)
    }
  }
  
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
