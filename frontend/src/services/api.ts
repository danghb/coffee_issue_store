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

export interface Issue {
  id: number;
  title: string;
  description: string;
  status: string;
  modelId: number;
  firmware?: string;
  reporterName: string;
  contact?: string;
  createdAt: string;
}

export interface CreateIssueData {
  title: string;
  description: string;
  modelId: number;
  firmware?: string;
  reporterName: string;
  contact?: string;
}

export const issueService = {
  // 获取所有机型
  getModels: async () => {
    const response = await api.get<DeviceModel[]>('/issues/models');
    return response.data;
  },

  // 提交问题
  createIssue: async (data: CreateIssueData) => {
    const response = await api.post<Issue>('/issues', data);
    return response.data;
  },
};
