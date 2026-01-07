import prisma from '../utils/prisma';

export const settingsService = {
  // --- Device Model Management ---
  async getAllModels() {
    return prisma.deviceModel.findMany({ orderBy: { name: 'asc' } });
  },

  async createModel(name: string) {
    return prisma.deviceModel.create({ data: { name } });
  },

  async updateModel(id: number, name: string) {
    return prisma.deviceModel.update({ where: { id }, data: { name } });
  },

  async deleteModel(id: number) {
    return prisma.deviceModel.delete({ where: { id } });
  },

  // --- Form Field Management ---
  async getAllFields() {
    return prisma.formField.findMany({ orderBy: { order: 'asc' } });
  },

  async createField(data: any) {
    return prisma.formField.create({
      data: {
        label: data.label,
        type: data.type,
        options: data.options ? JSON.stringify(data.options) : undefined,
        required: data.required || false,
        order: data.order || 0,
        isEnabled: data.isEnabled !== false
      }
    });
  },

  async updateField(id: number, data: any) {
    return prisma.formField.update({
      where: { id },
      data: {
        label: data.label,
        type: data.type,
        options: data.options ? JSON.stringify(data.options) : undefined,
        required: data.required,
        order: data.order,
        isEnabled: data.isEnabled
      }
    });
  },

  async deleteField(id: number) {
    return prisma.formField.delete({ where: { id } });
  }
};
