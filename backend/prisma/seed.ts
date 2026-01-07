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
    { name: 'M50' },
    { name: 'E60' },
    { name: 'K95PLUS' },
    { name: 'X' },
    { name: 'Y' },
    { name: 'O' },
    { name: 'Z' },
  ]

  const oldModels = [
    'Model A (Standard)',
    'Model B (Pro)',
    'Model C (Lite)',
    'Legacy Device X'
  ]

  console.log('Start seeding...')
  
  // 1. Disable/Delete old default models
  for (const oldName of oldModels) {
    const existing = await prisma.deviceModel.findUnique({ where: { name: oldName } })
    if (existing) {
      try {
        // Try to delete first (clean up if unused)
        await prisma.deviceModel.delete({ where: { id: existing.id } })
        console.log(`Deleted old model: ${oldName}`)
      } catch (e) {
        // If delete fails (foreign key constraint), soft delete it
        await prisma.deviceModel.update({
          where: { id: existing.id },
          data: { isEnabled: false }
        })
        console.log(`Soft deleted (disabled) old model: ${oldName}`)
      }
    }
  }

  // 2. Create/Enable new models
  for (const model of models) {
    const existing = await prisma.deviceModel.findUnique({
      where: { name: model.name }
    })
    
    if (!existing) {
      const result = await prisma.deviceModel.create({
        data: { ...model, isEnabled: true },
      })
      console.log(`Created model: ${model.name}`)
    } else {
      if (!existing.isEnabled) {
        await prisma.deviceModel.update({
          where: { id: existing.id },
          data: { isEnabled: true }
        })
        console.log(`Enabled existing model: ${model.name}`)
      }
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
