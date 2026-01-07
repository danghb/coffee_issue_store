import prisma from '../utils/prisma';
import { IssueStatus } from '../utils/enums';

interface CreateIssueInput {
  title: string;
  description: string;
  modelId: number;
  reporterName: string;
  severity?: string; // New
  customData?: any; // New
  submitDate?: string;
  contact?: string;
  serialNumber?: string;
  purchaseDate?: string;
  customerName?: string;
  firmware?: string;
  softwareVer?: string;
  occurredAt?: string;
  frequency?: string;
  phenomenon?: string;
  errorCode?: string;
  environment?: string;
  location?: string;
  waterType?: string;
  voltage?: string;
  usageFrequency?: string;
  restarted?: boolean;
  cleaned?: boolean;
  replacedPart?: string;
  troubleshooting?: string;
  attachmentIds?: number[];
}

import { customAlphabet } from 'nanoid';

// Uppercase + Numbers, 12 chars
const generateNanoId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 12);

// 辅助函数：将字符串转换为 Date 对象
const parseDate = (dateStr?: string) => {
  return dateStr ? new Date(dateStr) : undefined;
};

export const issueService = {
  // 并案处理
  async merge(parentId: number, childIds: number[], author: string = 'Admin') {
    return prisma.$transaction(async (tx) => {
      // Update children
      await tx.issue.updateMany({
        where: { id: { in: childIds } },
        data: { parentId }
      });

      // Add comment to parent
      await tx.comment.create({
        data: {
          issueId: parentId,
          content: `已关联子工单: ${childIds.join(', ')}`,
          author,
          type: 'SYSTEM',
          isInternal: true
        }
      });

      // Add comment to children
      for (const childId of childIds) {
        await tx.comment.create({
          data: {
            issueId: childId,
            content: `此工单已并入主工单 #${parentId}`,
            author,
            type: 'SYSTEM',
            isInternal: false // Visible to user so they know
          }
        });
      }
    });
  },

  // 创建问题
  async create(data: CreateIssueInput) {
    return prisma.issue.create({
      data: {
        nanoId: generateNanoId(), 
        title: data.title,
        description: data.description,
        modelId: data.modelId,
        reporterName: data.reporterName,
        contact: data.contact,
        submitDate: parseDate(data.submitDate) || new Date(),
        serialNumber: data.serialNumber,
        purchaseDate: parseDate(data.purchaseDate),
        customerName: data.customerName,
        firmware: data.firmware,
        softwareVer: data.softwareVer,
        occurredAt: parseDate(data.occurredAt),
        frequency: data.frequency,
        phenomenon: data.phenomenon,
        errorCode: data.errorCode,
        environment: data.environment,
        location: data.location,
        waterType: data.waterType,
        voltage: data.voltage,
        usageFrequency: data.usageFrequency,
        restarted: data.restarted,
        cleaned: data.cleaned,
        replacedPart: data.replacedPart,
        troubleshooting: data.troubleshooting,
        
        // New Fields
        severity: data.severity || 'MEDIUM',
        // priority: PENDING by default (set by admin later)
        
        status: IssueStatus.PENDING, // 默认状态
        attachments: data.attachmentIds && data.attachmentIds.length > 0 ? {
          connect: data.attachmentIds.map(id => ({ id }))
        } : undefined,
        
        customData: data.customData ? JSON.stringify(data.customData) : undefined
      },
      include: {
        model: true, // 返回关联的机型信息
        attachments: true // 返回关联的附件信息
      }
    });
  },

  // 获取问题列表 (支持分页和筛选)
  async findAll(
    page = 1, 
    limit = 20, 
    status?: IssueStatus, 
    search?: string, 
    modelId?: number,
    startDate?: string,
    endDate?: string
  ) {
    const skip = (page - 1) * limit;
    const take = limit === -1 ? undefined : limit; // -1 代表全部
    
    // 构建时间范围查询
    let dateFilter: any = undefined;
    if (startDate || endDate) {
      dateFilter = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        // 结束日期通常需要包含当天的最后一刻，所以如果是 '2023-01-01'，应查到 '2023-01-01 23:59:59'
        // 这里简单处理，假设前端传的是日期字符串，我们+1天并设为lt，或者前端传完整时间
        // 为了方便，假设前端传的是 YYYY-MM-DD
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
    }

    // 构建搜索查询 (多字段模糊匹配)
    let searchFilter: any = undefined;
    if (search) {
      searchFilter = {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          { customerName: { contains: search } },
          { reporterName: { contains: search } },
          { serialNumber: { contains: search } },
          { model: { name: { contains: search } } } // 关联表查询
        ]
      };
    }

    const where = {
      AND: [
        status ? { status } : {},
        modelId ? { modelId } : {},
        dateFilter ? { submitDate: dateFilter } : {}, // 假设按照提交时间筛选
        searchFilter ? searchFilter : {}
      ]
    };

    const [total, items] = await prisma.$transaction([
      prisma.issue.count({ where }),
      prisma.issue.findMany({
        where,
        skip: limit === -1 ? undefined : skip,
        take,
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
        totalPages: limit === -1 ? 1 : Math.ceil(total / limit)
      }
    };
  },

  // 获取单个问题详情 (支持 ID 或 NanoID)
  async findOne(idOrNanoId: number | string) {
    const where = typeof idOrNanoId === 'number' 
      ? { id: idOrNanoId } 
      : { nanoId: idOrNanoId };

    return prisma.issue.findUnique({
      where: where as any, // Prisma types tricky with union
      include: {
        model: true,
        attachments: true,
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            attachments: true // Include attachments for comments
          }
        },
        parent: true,
        children: true
      }
    });
  },
  
  // 获取所有机型
  async getDeviceModels() {
    return prisma.deviceModel.findMany({
        orderBy: { name: 'asc' }
    });
  },

  // 更新问题状态
  async updateStatus(id: number, status: IssueStatus, author: string = 'System') {
    // 1. 获取当前状态
    const issue = await prisma.issue.findUnique({ where: { id } });
    if (!issue) throw new Error('Issue not found');
    
    const oldStatus = issue.status;
    
    // 如果状态没有变化，直接返回
    if (oldStatus === status) return issue;

    // 2. 事务更新：修改状态 + 添加系统记录
    return prisma.$transaction(async (tx) => {
      const updatedIssue = await tx.issue.update({
        where: { id },
        data: { status }
      });
      
      await tx.comment.create({
        data: {
          issueId: id,
          type: 'STATUS_CHANGE',
          oldStatus,
          newStatus: status,
          author: author,
          content: `状态变更为 ${status}`
        }
      });

      return updatedIssue;
    });
  },

  // 添加评论
  async addComment(id: number, content: string, author: string, authorType: 'USER' | 'ADMIN' = 'USER', isInternal: boolean = false, attachmentIds?: number[]) {
    return prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          issueId: id,
          content,
          author,
          authorType,
          isInternal,
          type: 'MESSAGE'
        }
      });

      if (attachmentIds && attachmentIds.length > 0) {
        // Link attachments to this comment (and ensure they are linked to the issue too, though they should be already if uploaded in context? 
        // Actually, uploaded files might not be linked to issue yet if they were just uploaded. 
        // The UploadService just creates them.
        // So we need to link them to both Issue and Comment.
        await tx.attachment.updateMany({
          where: { id: { in: attachmentIds } },
          data: { 
            commentId: comment.id,
            issueId: id, // Ensure it belongs to this issue
            isInternal: isInternal // Inherit visibility from comment
          }
        });
      }

      return comment;
    });
  },

  // 管理员更新 Issue (包括优先级、严重程度)
  async update(id: number, data: any) {
    return prisma.issue.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }
};
