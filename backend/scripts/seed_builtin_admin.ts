import prisma from '../src/utils/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('🔑 Creating builtin admin account...');

    // Check if builtin admin already exists
    const existing = await prisma.user.findUnique({
        where: { username: 'yfdz' }
    });

    if (existing) {
        console.log('✅ Builtin admin account already exists');
        return;
    }

    // Create builtin admin account
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

    console.log('✅ Builtin admin account created successfully');
    console.log(`   Username: yfdz`);
    console.log(`   Password: yfdz@2026`);
    console.log(`   Role: ${user.role}`);
}

main()
    .catch((e) => {
        console.error('❌ Error creating builtin admin:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
