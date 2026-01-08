import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log('Fixing data...');

    // Use executeRaw to bypass Prisma's type checking which fails on invalid data
    try {
        // SQLite doesn't strictly enforce types, so we can have strings in integer columns.
        // We update them to integers.

        // Update 'LOW' -> 1
        const res1 = await prisma.$executeRawUnsafe(`UPDATE Issue SET severity = 1 WHERE severity = 'LOW'`);
        console.log(`Updated LOW -> 1: ${res1} rows`);

        // Update 'MEDIUM' -> 2
        const res2 = await prisma.$executeRawUnsafe(`UPDATE Issue SET severity = 2 WHERE severity = 'MEDIUM'`);
        console.log(`Updated MEDIUM -> 2: ${res2} rows`);

        // Update 'HIGH' -> 3
        const res3 = await prisma.$executeRawUnsafe(`UPDATE Issue SET severity = 3 WHERE severity = 'HIGH'`);
        console.log(`Updated HIGH -> 3: ${res3} rows`);

        // Update 'CRITICAL' -> 4
        const res4 = await prisma.$executeRawUnsafe(`UPDATE Issue SET severity = 4 WHERE severity = 'CRITICAL'`);
        console.log(`Updated CRITICAL -> 4: ${res4} rows`);

    } catch (e) {
        console.error('Error fixing data:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
