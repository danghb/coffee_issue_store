import prisma from '../utils/prisma';
import { IssueStatus } from '../utils/enums';

interface CreateIssueInput {
  title: string;
  description: string;
  modelId: number;
  firmware?: string;
  reporterName: string;
  contact?: string;
}

export const issueService = {
  // 创建问题
  async create(data: CreateIssueInput) {
    return prisma.issue.create({
      data: {
        title: data.title,
        description: data.description,
        modelId: data.modelId,
        firmware: data.firmware,
        reporterName: data.reporterName,
        contact: data.contact,
        status: IssueStatus.PENDING, // 默认状态
      },
      include: {
        model: true // 返回关联的机型信息
      }
    });
  },

  // 获取问题列表 (支持分页和筛选)
  async findAll(page = 1, limit = 20, status?: IssueStatus) {
    const skip = (page - 1) * limit;
    
    const [total, items] = await prisma.$transaction([
      prisma.issue.count({
        where: status ? { status } : undefined
      }),
      prisma.issue.findMany({
        where: status ? { status } : undefined,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          model: true,
          _count: {
            select: { attachments: true, comments: true }
          }
        }
      })
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  // 获取单个问题详情
  async findOne(id: number) {
    return prisma.issue.findUnique({
      where: { id },
      include: {
        model: true,
        attachments: true,
        comments: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  },
  
  // 获取所有机型
  async getDeviceModels() {
    return prisma.deviceModel.findMany({
        orderBy: { name: 'asc' }
    });
  }
};
