import prisma from '../utils/prisma';

export const settingsService = {
  // --- Device Model Management ---
  async getAllModels() {
    return prisma.deviceModel.findMany({
      orderBy: { name: 'asc' }
      // 默认返回所有机型（包括停用的），以便在设置页显示
    });
  },

  async createModel(name: string) {
    // 检查是否已存在（包括停用的）
    const existing = await prisma.deviceModel.findUnique({
      where: { name }
    });

    if (existing) {
      if (!existing.isEnabled) {
        // 如果已存在但被停用，则重新启用
        return prisma.deviceModel.update({
          where: { id: existing.id },
          data: { isEnabled: true }
        });
      }
      // 如果已存在且启用，抛出错误（由上层处理或直接返回已存在的对象）
      throw new Error('Model already exists');
    }

    return prisma.deviceModel.create({ data: { name, isEnabled: true } });
  },

  async updateModel(id: number, data: { name?: string; isEnabled?: boolean }) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;

    return prisma.deviceModel.update({
      where: { id },
      data: updateData
    });
  },

  // 这里的 delete 实际上不再调用物理删除，而是建议前端调用 updateModel 设置 isEnabled: false
  // 但为了兼容现有 API，我们可以在这里保留物理删除（仅供无关联数据时使用），或者直接抛错
  async deleteModel(id: number) {
    // 优先尝试物理删除，如果失败（有外键约束），则建议前端走 updateModel
    // 但按照用户需求，我们直接改为软删除逻辑
    return prisma.deviceModel.update({
      where: { id },
      data: { isEnabled: false }
    });
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
  },

  // --- System Config ---
  async getSystemConfig(key: string, defaultValue: string = '') {
    const config = await prisma.systemConfig.findUnique({ where: { key } });
    return config ? config.value : defaultValue;
  },

  async setSystemConfig(key: string, value: string) {
    return prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
  }
};
