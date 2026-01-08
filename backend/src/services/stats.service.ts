import prisma from '../utils/prisma';
import { IssueStatus } from '../utils/enums';

export const statsService = {
  // 获取概览统计数据
  async getDashboardStats() {
    // 1. 基础指标
    const totalIssues = await prisma.issue.count();
    const pendingIssues = await prisma.issue.count({ where: { status: IssueStatus.PENDING } });
    const resolvedIssues = await prisma.issue.count({ where: { status: IssueStatus.RESOLVED } });

    // 今日新增
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIssues = await prisma.issue.count({
      where: { createdAt: { gte: today } }
    });

    // 2. 按机型统计 (Top 5)
    const issuesByModel = await prisma.issue.groupBy({
      by: ['modelId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    // 获取机型名称
    const modelStats = await Promise.all(issuesByModel.map(async (item) => {
      const model = await prisma.deviceModel.findUnique({ where: { id: item.modelId } });
      return {
        name: model?.name || 'Unknown',
        value: item._count.id
      };
    }));

    // 3. 按客户统计 (Top 10) - 排除空客户名
    const issuesByCustomer = await prisma.issue.groupBy({
      by: ['customerName'],
      _count: { id: true },
      where: {
        customerName: { not: '' } // 简单过滤，实际可能需要更复杂的逻辑
      },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    const customerStats = issuesByCustomer
      .filter(item => item.customerName !== null) // 再次过滤 null
      .map(item => ({
        name: item.customerName,
        value: item._count.id
      }));

    // 4. 最近 7 天趋势
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentIssues = await prisma.issue.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true }
    });

    // 补全日期
    const trendStats = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      const count = recentIssues.filter(issue =>
        issue.createdAt.toISOString().startsWith(dateStr)
      ).length;

      trendStats.push({ date: dateStr, count });
    }

    // 5. 按分类统计
    const issuesByCategory = await prisma.issue.groupBy({
      by: ['categoryId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    const categoryStats = await Promise.all(issuesByCategory.map(async (item) => {
      if (!item.categoryId) return null;
      const cat = await prisma.category.findUnique({ where: { id: item.categoryId } });
      return {
        name: cat?.name || 'Unknown',
        value: item._count.id
      };
    }));

    return {
      overview: {
        total: totalIssues,
        pending: pendingIssues,
        resolved: resolvedIssues,
        today: todayIssues
      },
      byModel: modelStats,
      byCustomer: customerStats,
      byCategory: categoryStats.filter(Boolean), // New
      trend: trendStats
    };
  }
};
