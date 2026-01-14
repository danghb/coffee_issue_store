import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// 显式加载 .env 文件
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
})

async function main() {
  console.log('🚀 Start seeding database...');

  // --- 1. Device Models ---
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

  console.log('\n📦 Seeding Device Models...');

  // Disable/Delete old default models
  for (const oldName of oldModels) {
    const existing = await prisma.deviceModel.findUnique({ where: { name: oldName } })
    if (existing) {
      try {
        await prisma.deviceModel.delete({ where: { id: existing.id } })
        console.log(`  - Deleted old model: ${oldName}`)
      } catch (e) {
        await prisma.deviceModel.update({
          where: { id: existing.id },
          data: { isEnabled: false }
        })
        console.log(`  - Soft deleted (disabled) old model: ${oldName}`)
      }
    }
  }

  // Create/Enable new models
  for (const model of models) {
    const existing = await prisma.deviceModel.findUnique({
      where: { name: model.name }
    })

    if (!existing) {
      await prisma.deviceModel.create({
        data: { ...model, isEnabled: true },
      })
      console.log(`  + Created model: ${model.name}`)
    } else {
      if (!existing.isEnabled) {
        await prisma.deviceModel.update({
          where: { id: existing.id },
          data: { isEnabled: true }
        })
        console.log(`  ^ Enabled existing model: ${model.name}`)
      }
    }
  }

  // --- 2. Categories ---
  console.log('\nGd Seeding Categories...');
  const defaultCategories = ['软件问题', '硬件问题', '结构问题', '其他问题'];
  for (const name of defaultCategories) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    console.log(`  + Ensured category: ${cat.name}`);
  }

  // --- 3. Built-in Admin User ---
  console.log('\n👤 Seeding Built-in Admin...');
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'yfdz' }
  });

  if (existingAdmin) {
    console.log('  = Builtin admin account already exists');
  } else {
    const hashedPassword = await bcrypt.hash('yfdz@2026', 10);
    const user = await prisma.user.create({
      data: {
        username: 'yfdz',
        password: hashedPassword,
        name: '内置管理员',
        role: 'ADMIN',
        isBuiltin: true
      }
    });
    console.log('  + Builtin admin account created successfully');
    console.log(`    Username: yfdz`);
    console.log(`    Password: yfdz@2026`);
  }

  console.log('\n✨ Seeding finished.');
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
