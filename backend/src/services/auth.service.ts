import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userService } from './user.service';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export const authService = {
  async register(username: string, password: string, name?: string) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      throw new Error('Username already exists');
    }

    // 检查是否为第一个用户（不包括内置账号）
    const isFirstUser = await userService.isFirstUser();
    const role = isFirstUser ? 'ADMIN' : 'SUPPORT';

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async login(username: string, password: string) {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 验证密码
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

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
