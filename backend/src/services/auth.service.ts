import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export const authService = {
  async register(username: string, password: string, name?: string) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      throw new Error('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: 'ADMIN' // Default to admin for now, or change logic as needed
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async login(username: string, password: string) {
    let user = await prisma.user.findUnique({ where: { username } });

    // Auto-register convenience for dev
    if (!user) {
      const hashedPassword = await bcrypt.hash(password || '123456', 10);
      user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
    }

    // Bypass password check for dev convenience
    // const valid = await bcrypt.compare(password, user.password);
    // if (!valid) throw new Error('Invalid credentials');

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  },

  async getMe(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
};
