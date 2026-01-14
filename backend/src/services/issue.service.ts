import prisma from '../utils/prisma';
import { settingsService } from './settings.service';
import { IssueStatus } from '../utils/enums';
import { addWorkingDays } from '../utils/workday';

interface CreateIssueInput {
  title: string;
  description: string;
  modelId: number;
  reporterName: string;
  severity?: number; // Int 1-4
  priority?: string; // New
  categoryId?: number; // New
  customData?: any; // New
  tags?: string; // Schema expects String? (JSON string or comma separated)
  targetDate?: string; // New
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
  remarks?: string;
  createdById?: number; // 创建者用户ID
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

  // 取消并案处理
  async unmerge(childId: number, author: string = 'Admin') {
    return prisma.$transaction(async (tx) => {
      // Get the issue to find its parent
      const issue = await tx.issue.findUnique({
        where: { id: childId },
        select: { parentId: true }
      });

      if (!issue || !issue.parentId) {
        throw new Error('Issue is not merged or does not exist');
      }

      const parentId = issue.parentId;

      // Remove parent relationship
      await tx.issue.update({
        where: { id: childId },
        data: { parentId: null }
      });

      // Add comment to former parent
      await tx.comment.create({
        data: {
          issueId: parentId,
          content: `子工单 #${childId} 已取消关联`,
          author,
          type: 'SYSTEM',
          isInternal: true
        }
      });

      // Add comment to child
      await tx.comment.create({
        data: {
          issueId: childId,
          content: `已从主工单 #${parentId} 取消关联`,
          author,
          type: 'SYSTEM',
          isInternal: false
        }
      });
    });
  },

  // 创建问题
  async create(data: CreateIssueInput) {
    // 1. Fetch SLA configuration (default 5 days)
    let targetDays = 5;
    try {
      const slaDays = await settingsService.getSystemConfig('SLA_DAYS', '5');
      targetDays = parseInt(slaDays, 10) || 5;
    } catch (e) {
      console.error('Failed to load SLA config, using default 5 days', e);
    }

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

        // Ensure defaults and map string to int
        severity: (() => {
          const s = String(data.severity || 'MEDIUM');
          const map: Record<string, number> = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
          return map[s] || Number(data.severity) || 2;
        })(),
        priority: "P2", // Explicitly set default priority

        tags: data.tags,
        remarks: data.remarks,

        restarted: data.restarted,
        cleaned: data.cleaned,
        replacedPart: data.replacedPart,
        troubleshooting: data.troubleshooting,

        categoryId: data.categoryId ? Number(data.categoryId) : undefined, // Link Category

        // Calculate Target Date: Dynamic based on SLA config
        targetDate: addWorkingDays(parseDate(data.submitDate) || new Date(), targetDays),

        status: IssueStatus.PENDING, // 默认状态

        // 记录创建者ID（如果已登录）
        createdById: data.createdById,

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
    status?: IssueStatus[],
    search?: string,
    modelId?: number[],
    startDate?: string,
    endDate?: string,
    sortBy?: 'createdAt' | 'priority' | 'severity',
    sortOrder?: 'asc' | 'desc',
    createdByIdFilter?: number | null // SUPPORT用户的用户ID过滤
  ) {
    const skip = (page - 1) * limit;
    const take = limit === -1 ? undefined : limit; // -1 代表全部

    // Default Sort
    const orderBy: any = {};
    if (sortBy === 'priority') {
      orderBy.priority = sortOrder || 'asc'; // P0 < P1, so asc = High(P0) -> Low(P3)
    } else if (sortBy === 'severity') {
      orderBy.severity = sortOrder || 'desc'; // 4(Critical) > 1(Low). DESC = High(4) to Low(1). Correct.
    } else {
      orderBy.createdAt = sortOrder || 'desc';
    }

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
          { reporterName: { contains: search } },
          { nanoId: { contains: search } }
        ]
      };
    }

    // 构建 where 条件
    const where: any = {};
    if (status && status.length > 0) {
      where.status = { in: status };
    }
    if (modelId && modelId.length > 0) {
      where.modelId = { in: modelId };
    }
    if (searchFilter) {
      Object.assign(where, searchFilter);
    }
    if (dateFilter) {
      where.submitDate = dateFilter;
    }

    // SUPPORT用户权限过滤：只能看到自己创建的问题
    if (createdByIdFilter !== undefined) {
      where.createdById = createdByIdFilter;
    }
    // ADMIN和DEVELOPER不设置此过滤条件，可以看到所有问题（包括游客创建的）

    const [total, items] = await prisma.$transaction([
      prisma.issue.count({ where }),
      prisma.issue.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          model: true, // Include Model info
          category: true, // New: Include Category info
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
        category: true, // New
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

  // 管理员更新 Issue (包括优先级、严重程度，以及所有其他字段)
  // 带变更审计日志
  async update(id: number, data: any, author: string = 'Admin') {
    // 1. 获取当前Issue
    const currentIssue = await prisma.issue.findUnique({ where: { id } });
    if (!currentIssue) throw new Error('Issue not found');

    // 2. 定义需要追踪变更的字段及其显示名称
    const trackableFields: Record<string, string> = {
      title: '标题',
      description: '详细描述',
      status: '状态',
      priority: '优先级',
      severity: '严重程度',
      assignee: '分配人',
      modelId: '产品型号',
      occurredAt: '发生时间',
      frequency: '出现频率',
      tags: '标签',
      targetDate: '目标日期',
      customerName: '客户名称',
      contact: '联系方式',
      phenomenon: '问题现象',
      errorCode: '错误代码',
      environment: '环境',
      location: '地点',
    };

    // 3. 检测变更
    const changes: { field: string; fieldName: string; oldValue: any; newValue: any }[] = [];

    for (const [field, fieldName] of Object.entries(trackableFields)) {
      if (data[field] !== undefined) {
        const oldValue = (currentIssue as any)[field];
        const newValue = data[field];

        // 比较值（处理日期和JSON字符串）
        const oldStr = oldValue instanceof Date ? oldValue.toISOString() : String(oldValue ?? '');
        const newStr = newValue instanceof Date ? newValue.toISOString() : String(newValue ?? '');

        if (oldStr !== newStr) {
          changes.push({ field, fieldName, oldValue: oldStr, newValue: newStr });
        }
      }
    }

    // 4. 事务：更新Issue + 记录所有变更
    return prisma.$transaction(async (tx) => {
      // 更新Issue
      const updatedIssue = await tx.issue.update({
        where: { id },
        data: {
          ...data,
          severity: data.severity !== undefined ? Number(data.severity) : undefined,
          modelId: data.modelId !== undefined ? Number(data.modelId) : undefined,
          categoryId: data.categoryId !== undefined ? Number(data.categoryId) : undefined,
          updatedAt: new Date()
        }
      });

      // 记录每个变更
      for (const change of changes) {
        await tx.comment.create({
          data: {
            issueId: id,
            type: 'FIELD_CHANGE',
            author,
            authorType: 'ADMIN',
            isInternal: true, // 变更日志只对管理员可见
            content: JSON.stringify({
              field: change.field,
              fieldName: change.fieldName,
              oldValue: change.oldValue,
              newValue: change.newValue
            })
          }
        });
      }

      return updatedIssue;
    });
  },

  // 删除问题 (Cascading delete)
  delete: async (id: number) => {
    return prisma.$transaction(async (tx) => {
      // 1. Unlink children
      await tx.issue.updateMany({
        where: { parentId: id },
        data: { parentId: null }
      });

      // 2. Delete attachments (Direct + Comment attachments)
      await tx.attachment.deleteMany({
        where: {
          OR: [
            { issueId: id },
            { comment: { issueId: id } }
          ]
        }
      });

      // 3. Delete comments (and change logs)
      await tx.comment.deleteMany({
        where: { issueId: id }
      });

      // 4. Delete issue
      return tx.issue.delete({
        where: { id }
      });
    });
  }
};
