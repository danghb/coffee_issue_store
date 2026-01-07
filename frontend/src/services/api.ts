import axios from 'axios';

// 配置 API 基础 URL
// 在开发环境中，Vite 代理会将 /api 转发到后端
const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface DeviceModel {
  id: number;
  name: string;
}

export interface Attachment {
  id: number;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  kind: string;
  createdAt: string;
}

export interface Comment {
  id: number;
  type: string;
  content: string;
  isInternal: boolean;
  oldStatus?: string;
  newStatus?: string;
  author: string;
  createdAt: string;
}

export interface FormField {
  id: number;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio';
  options?: string[]; // 前端使用时已解析为数组
  required: boolean;
  order: number;
  isEnabled: boolean;
}

export interface Issue {
  id: number;
  // --- 基本信息 ---
  submitDate: string;
  reporterName: string;
  contact?: string;
  modelId: number;
  model?: DeviceModel;
  serialNumber?: string;
  purchaseDate?: string;
  customerName?: string;
  firmware?: string;
  softwareVer?: string;

  // --- 问题描述 ---
  title: string;
  description: string;
  occurredAt?: string;
  frequency?: string;
  phenomenon?: string;
  errorCode?: string;

  // --- 环境信息 ---
  environment?: string;
  location?: string;
  waterType?: string;
  voltage?: string;
  usageFrequency?: string;

  // --- 初步排查 ---
  restarted?: boolean;
  cleaned?: boolean;
  replacedPart?: string;
  troubleshooting?: string;

  // --- 系统状态 ---
  status: string;
  createdAt: string;
  updatedAt: string;
  
  attachments?: Attachment[];
  comments?: Comment[];
  
  // --- 动态字段数据 ---
  customData?: string; // JSON string
}

export interface CreateIssueData {
  // --- 基本信息 ---
  submitDate?: string;
  reporterName: string;
  modelId: number;
  // ... 其他字段 ...
  [key: string]: any; // 允许动态字段
}

export const settingsService = {
  // 机型管理
  getModels: async () => {
    const response = await api.get<DeviceModel[]>('/settings/models');
    return response.data;
  },
  createModel: async (name: string) => {
    const response = await api.post<DeviceModel>('/settings/models', { name });
    return response.data;
  },
  updateModel: async (id: number, name: string) => {
    const response = await api.put<DeviceModel>(`/settings/models/${id}`, { name });
    return response.data;
  },
  deleteModel: async (id: number) => {
    await api.delete(`/settings/models/${id}`);
  },

  // 字段管理
  getFields: async () => {
    const response = await api.get<FormField[]>('/settings/fields');
    return response.data;
  },
  createField: async (data: Omit<FormField, 'id'>) => {
    const response = await api.post<FormField>('/settings/fields', data);
    return response.data;
  },
  updateField: async (id: number, data: Partial<FormField>) => {
    const response = await api.put<FormField>(`/settings/fields/${id}`, data);
    return response.data;
  },
  deleteField: async (id: number) => {
    await api.delete(`/settings/fields/${id}`);
  }
};

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  overview: {
    total: number;
    pending: number;
    resolved: number;
    today: number;
  };
  byModel: { name: string; value: number }[];
  byCustomer: { name: string; value: number }[];
  trend: { date: string; count: number }[];
}

export const issueService = {
  // 获取统计数据
  getStats: async () => {
    const response = await api.get<DashboardStats>('/stats/dashboard');
    return response.data;
  },

  // 获取所有机型
  getModels: async () => {
    const response = await api.get<DeviceModel[]>('/issues/models');
    return response.data;
  },

  // 获取问题列表
  getIssues: async (page = 1, limit = 20, status?: string, customerName?: string, modelId?: string) => {
    const params = { page, limit, status, customerName, modelId };
    const response = await api.get<PaginatedResponse<Issue>>('/issues', { params });
    return response.data;
  },

  // 获取问题详情
  getIssue: async (id: number) => {
    const response = await api.get<Issue>(`/issues/${id}`);
    return response.data;
  },

  // 提交问题
  createIssue: async (data: CreateIssueData) => {
    const response = await api.post<Issue>('/issues', data);
    return response.data;
  },

  // 上传附件
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<Attachment>('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 更新状态
  updateStatus: async (id: number, status: string, author?: string) => {
    const response = await api.patch<Issue>(`/issues/${id}/status`, { status, author });
    return response.data;
  },

  // 添加评论
  addComment: async (id: number, content: string, author?: string) => {
    const response = await api.post<Comment>(`/issues/${id}/comments`, { content, author });
    return response.data;
  }
};
