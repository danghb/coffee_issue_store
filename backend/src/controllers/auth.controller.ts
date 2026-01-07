import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service';

interface RegisterBody {
  username: string;
  password: string;
  name?: string;
}

interface LoginBody {
  username: string;
  password: string;
}

export const authController = {
  register: async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    try {
      const { username, password, name } = request.body;
      if (!username || !password) {
        return reply.code(400).send({ error: 'Username and password are required' });
      }
      const user = await authService.register(username, password, name);
      return reply.code(201).send(user);
    } catch (error: any) {
      if (error.message === 'Username already exists') {
        return reply.code(409).send({ error: error.message });
      }
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  login: async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    try {
      const { username, password } = request.body;
      const result = await authService.login(username, password);
      return reply.send(result);
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return reply.code(401).send({ error: 'Invalid username or password' });
      }
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  getMe: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await authService.getMe(request.user!.id);
      return reply.send(user);
    } catch (error) {
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  }
};
