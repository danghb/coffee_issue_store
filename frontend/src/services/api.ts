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
  isEnabled: boolean; // 新增字段
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
  issueId: number;
  type: string;
  content?: string;
  oldStatus?: string;
  newStatus?: string;
  author: string;
  isInternal: boolean;
  createdAt: string;
  attachments?: Attachment[]; // New
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
  nanoId: string; // New
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
  severity?: string; // New
  priority?: string; // New (Internal)
  occurredAt?: string;
  frequency?: string;
  phenomenon?: string;
  errorCode?: string;
  tags?: string; // JSON string ["tag1", "tag2"]
  targetDate?: string;

  // ... existing fields ...
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

  // --- 并案处理 ---
  parentId?: number;
  parent?: Issue;
  children?: Issue[];
}

export interface CreateIssueData {
  // --- 基本信息 ---
  submitDate?: string;
  reporterName: string;
  modelId: number;
  severity?: string; // New
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
  updateModel: async (id: number, data: { name?: string; isEnabled?: boolean }) => {
    const response = await api.put<DeviceModel>(`/settings/models/${id}`, data);
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
  },
  // 管理员更新 Issue
  update: async (id: number, data: any) => {
    const response = await api.put<Issue>(`/issues/${id}`, data);
    return response.data;
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

export interface User {
  id: number;
  username: string;
  name?: string;
  role: 'ADMIN' | 'DEVELOPER' | 'SUPPORT';
}

export interface LoginResponse {
  user: User;
  token: string;
}

export const authService = {
  login: async (username: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (username: string, password: string, name?: string) => {
    const response = await api.post<User>('/auth/register', { username, password, name });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: () => localStorage.getItem('token')
};

// Add interceptor to attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const issueService = {
  // ... existing methods ...

  // 管理员更新 Issue
  update: async (id: number, data: any) => {
    const response = await api.put<Issue>(`/issues/${id}`, data);
    return response.data;
  },

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
  getIssues: async (
    page = 1,
    limit = 20,
    status?: string,
    search?: string,
    modelId?: string,
    startDate?: string,
    endDate?: string
  ) => {
    const params = { page, limit, status, search, modelId, startDate, endDate };
    const response = await api.get<PaginatedResponse<Issue>>('/issues', { params });
    return response.data;
  },

  // 获取问题详情
  getIssue: async (id: number | string) => {
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
  addComment: async (id: number, content: string, author?: string, isInternal?: boolean, attachmentIds?: number[]) => {
    const response = await api.post<Comment>(`/issues/${id}/comments`, { content, author, isInternal, attachmentIds });
    return response.data;
  },

  // 并案处理
  merge: async (id: number, childIds: number[]) => {
    const response = await api.post(`/issues/${id}/merge`, { childIds });
    return response.data;
  }
};
