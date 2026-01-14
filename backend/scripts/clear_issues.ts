
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start cleaning issues...');

    try {
        // 1. Break parent-child relationships first (set parentId to null for all issues)
        // This allows deleting issues without foreign key constraints on self-relation
        console.log('Breaking parent-child relationships...');
        await prisma.issue.updateMany({
            data: {
                parentId: null
            }
        });

        // 2. Delete Attachments
        // Attachments can be linked to Issue or Comment. 
        // If we delete issues and comments, we should also delete their attachments to avoid orphans (or constraints).
        console.log('Deleting attachments...');
        await prisma.attachment.deleteMany({});

        // 3. Delete Comments
        console.log('Deleting comments...');
        await prisma.comment.deleteMany({});

        // 4. Delete Issues
        console.log('Deleting issues...');
        await prisma.issue.deleteMany({});

        // Note: We are NOT deleting Users, DeviceModels, Categories, SystemConfig, or FormFields.
        // Those are meta-data or account data usually kept.

        console.log('✅ All issues cleaned successfully.');
    } catch (error) {
        console.error('Error cleaning issues:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
