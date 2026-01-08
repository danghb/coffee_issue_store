import { PrismaClient } from '@prisma/client';
import TurndownService from 'turndown';

const prisma = new PrismaClient();
const turndownService = new TurndownService();

async function migrateToMarkdown() {
    console.log('开始迁移数据到Markdown格式...');

    // 迁移Issues的description
    const issues = await prisma.issue.findMany({
        select: { id: true, description: true },
    });

    let issueCount = 0;
    for (const issue of issues) {
        if (!issue.description) continue;

        // 检测是否是HTML（简单检测：包含HTML标签）
        if (issue.description.trim().startsWith('<') || issue.description.includes('</')) {
            try {
                const markdown = turndownService.turndown(issue.description);
                await prisma.issue.update({
                    where: { id: issue.id },
                    data: { description: markdown },
                });
                issueCount++;
                console.log(`✓ Issue #${issue.id} converted`);
            } catch (error) {
                console.error(`✗ Failed to convert Issue #${issue.id}:`, error);
            }
        }
    }

    // 迁移Comments的content
    const comments = await prisma.comment.findMany({
        where: { type: 'COMMENT' },
        select: { id: true, content: true },
    });

    let commentCount = 0;
    for (const comment of comments) {
        if (!comment.content) continue;

        if (comment.content.trim().startsWith('<') || comment.content.includes('</')) {
            try {
                const markdown = turndownService.turndown(comment.content);
                await prisma.comment.update({
                    where: { id: comment.id },
                    data: { content: markdown },
                });
                commentCount++;
                console.log(`✓ Comment #${comment.id} converted`);
            } catch (error) {
                console.error(`✗ Failed to convert Comment #${comment.id}:`, error);
            }
        }
    }

    console.log(`\n迁移完成！`);
    console.log(`- Issues转换: ${issueCount}/${issues.length}`);
    console.log(`- Comments转换: ${commentCount}/${comments.length}`);

    await prisma.$disconnect();
}

migrateToMarkdown()
    .catch((e) => {
        console.error('Migration failed:', e);
        process.exit(1);
    });
