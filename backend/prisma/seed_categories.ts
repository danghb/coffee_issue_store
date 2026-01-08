import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    const defaults = ['软件问题', '硬件问题', '结构问题', '其他问题'];

    console.log('--- Seeding Categories ---');
    for (const name of defaults) {
        const cat = await prisma.category.upsert({
            where: { name },
            update: {},
            create: { name }
        });
        console.log(`Ensured category: ${cat.name}`);
    }

    await prisma.$disconnect();
}

main();
