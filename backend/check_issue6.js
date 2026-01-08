const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkIssue6() {
    const issue = await prisma.issue.findUnique({
        where: { id: 6 },
        include: { comments: true }
    });

    console.log('=== Issue 6 Description ===');
    console.log(issue?.description || 'No description');
    console.log('\n=== Comments ===');
    issue?.comments?.forEach((c, i) => {
        console.log(`\nComment ${i + 1} (${c.type}):`);
        console.log(c.content?.substring(0, 200) || 'No content');
    });

    await prisma.$disconnect();
}

checkIssue6();
