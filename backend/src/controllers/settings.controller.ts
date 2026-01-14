import { FastifyReply, FastifyRequest } from 'fastify';
import { settingsService } from '../services/settings.service';

export const settingsController = {
  // --- Device Models ---
  getModels: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const models = await settingsService.getAllModels();
      return reply.send(models);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  createModel: async (request: FastifyRequest<{ Body: { name: string } }>, reply: FastifyReply) => {
    try {
      if (!request.body.name) return reply.code(400).send({ error: 'Name is required' });
      try {
        const model = await settingsService.createModel(request.body.name);
        return reply.code(201).send(model);
      } catch (e: any) {
        if (e.message === 'Model already exists') {
          return reply.code(409).send({ error: 'Model already exists' });
        }
        throw e;
      }
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  updateModel: async (request: FastifyRequest<{ Params: { id: string }, Body: { name?: string, isEnabled?: boolean } }>, reply: FastifyReply) => {
    try {
      const id = Number(request.params.id);
      request.log.info({ id, body: request.body }, 'Updating model');
      const model = await settingsService.updateModel(id, request.body);
      return reply.send(model);
    } catch (error: any) {
      request.log.error({ error: error.message, stack: error.stack, body: request.body }, 'Model update failed');
      return reply.code(500).send({ error: 'Internal Server Error', details: error.message });
    }
  },

  deleteModel: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const id = Number(request.params.id);
      await settingsService.deleteModel(id);
      return reply.code(204).send();
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  // --- Form Fields ---
  getFields: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const fields = await settingsService.getAllFields();
      return reply.send(fields.map(f => ({
        ...f,
        options: f.options ? JSON.parse(f.options) : undefined
      })));
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  createField: async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const field = await settingsService.createField(request.body);
      return reply.code(201).send({
        ...field,
        options: field.options ? JSON.parse(field.options) : undefined
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  updateField: async (request: FastifyRequest<{ Params: { id: string }, Body: any }>, reply: FastifyReply) => {
    try {
      const id = Number(request.params.id);
      const field = await settingsService.updateField(id, request.body);
      return reply.send({
        ...field,
        options: field.options ? JSON.parse(field.options) : undefined
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  deleteField: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const id = Number(request.params.id);
      await settingsService.deleteField(id);
      return reply.code(204).send();
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  // --- System Config (SLA) ---
  getSLAConfig: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Default 5 days, 1 day warning
      const targetSLA = await settingsService.getSystemConfig('SLA_DAYS', '5');
      const warningThreshold = await settingsService.getSystemConfig('SLA_WARNING_DAYS', '1');

      return reply.send({
        targetSLA: Number(targetSLA),
        warningThreshold: Number(warningThreshold)
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  updateSLAConfig: async (request: FastifyRequest<{ Body: { targetSLA: number, warningThreshold: number } }>, reply: FastifyReply) => {
    try {
      const { targetSLA, warningThreshold } = request.body;

      await settingsService.setSystemConfig('SLA_DAYS', String(targetSLA));
      await settingsService.setSystemConfig('SLA_WARNING_DAYS', String(warningThreshold));

      return reply.send({ success: true });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  }
};
