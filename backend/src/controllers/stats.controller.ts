import { FastifyReply, FastifyRequest } from 'fastify';
import { statsService } from '../services/stats.service';
import { issueService } from '../services/issue.service';
import { IssueStatus } from '../utils/enums';

export const statsController = {
  // 获取看板数据
  getDashboard: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await statsService.getDashboardStats();
      return reply.send(stats);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  },

  // 导出 CSV
  exportIssues: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 获取所有数据 (不分页)
      // 注意：如果数据量非常大，这里应该使用流式处理 (Cursor)
      // 这里的 findAll 稍微修改一下，支持 limit=-1 代表全部
      const { items } = await issueService.findAll(1, 10000); // 暂时限制 10000 条

      // 生成 CSV 内容
      const headers = [
        'ID', 'Title', 'Status', 'Model', 'Serial Number', 
        'Reporter', 'Customer', 'Submit Date', 'Description', 'Solution'
      ];
      
      const csvRows = items.map(issue => {
        return [
          issue.id,
          `"${issue.title.replace(/"/g, '""')}"`, // 转义引号
          issue.status,
          `"${issue.model?.name || ''}"`,
          issue.serialNumber || '',
          issue.reporterName,
          `"${issue.customerName || ''}"`,
          issue.submitDate.toISOString().split('T')[0],
          `"${issue.description.replace(/"/g, '""').replace(/\n/g, ' ')}"`, // 移除换行
          `"${(issue.troubleshooting || '').replace(/"/g, '""')}"`
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n'); // 添加 BOM 解决乱码

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="issues_export_${new Date().toISOString().split('T')[0]}.csv"`);
      return reply.send(csvContent);

    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  }
};
