import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface UserPayload {
  id: number;
  username: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserPayload;
  }
}

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.code(401).send({ error: 'Unauthorized: Missing token' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    request.user = decoded;
  } catch (err) {
    return reply.code(401).send({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user || request.user.role !== 'ADMIN') {
    return reply.code(403).send({ error: 'Forbidden: Admin access required' });
  }
};

export const requireDeveloper = async (request: FastifyRequest, reply: FastifyReply) => {
  // Developer access: ADMIN or DEVELOPER
  if (!request.user || (request.user.role !== 'ADMIN' && request.user.role !== 'DEVELOPER')) {
    return reply.code(403).send({ error: 'Forbidden: Developer access required' });
  }
};
