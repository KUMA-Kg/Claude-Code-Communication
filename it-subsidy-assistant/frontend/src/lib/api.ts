import axios, { AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  AuthResponse, 
  LoginRequest, 
  SubsidySearchParams, 
  SubsidySearchResponse,
  Subsidy,
  Favorite,
  Template,
  DocumentGenerationRequest,
  Document
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.it-subsidy-assistant.com/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
          });
          const { token } = response.data.data;
          localStorage.setItem('token', token);
          error.config.headers.Authorization = `Bearer ${token}`;
          return api.request(error.config);
        } catch (refreshError) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await api.post('/auth/login', credentials);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Login failed');
    }
    return response.data.data;
  },

  refresh: async (): Promise<{ token: string; expiresIn: number }> => {
    const response: AxiosResponse<ApiResponse<{ token: string; expiresIn: number }>> = await api.post('/auth/refresh');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Token refresh failed');
    }
    return response.data.data;
  },
};

// Subsidy API
export const subsidyApi = {
  search: async (params: SubsidySearchParams): Promise<SubsidySearchResponse> => {
    const response: AxiosResponse<ApiResponse<SubsidySearchResponse>> = await api.get('/subsidies/search', { params });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Search failed');
    }
    return response.data.data;
  },

  getById: async (id: string): Promise<Subsidy> => {
    const response: AxiosResponse<ApiResponse<Subsidy>> = await api.get(`/subsidies/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch subsidy');
    }
    return response.data.data;
  },

  addToFavorites: async (id: string): Promise<void> => {
    const response: AxiosResponse<ApiResponse<void>> = await api.post(`/subsidies/${id}/favorite`);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to add to favorites');
    }
  },

  removeFromFavorites: async (id: string): Promise<void> => {
    const response: AxiosResponse<ApiResponse<void>> = await api.delete(`/subsidies/${id}/favorite`);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to remove from favorites');
    }
  },

  getFavorites: async (): Promise<Favorite[]> => {
    const response: AxiosResponse<ApiResponse<{ favorites: Favorite[] }>> = await api.get('/subsidies/favorites');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch favorites');
    }
    return response.data.data.favorites;
  },
};

// Document API
export const documentApi = {
  getTemplates: async (): Promise<Template[]> => {
    const response: AxiosResponse<ApiResponse<{ templates: Template[] }>> = await api.get('/documents/templates');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch templates');
    }
    return response.data.data.templates;
  },

  generate: async (request: DocumentGenerationRequest): Promise<Document> => {
    const response: AxiosResponse<ApiResponse<Document>> = await api.post('/documents/generate', request);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to generate document');
    }
    return response.data.data;
  },

  getById: async (id: string): Promise<Document> => {
    const response: AxiosResponse<ApiResponse<Document>> = await api.get(`/documents/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch document');
    }
    return response.data.data;
  },

  download: async (id: string): Promise<Blob> => {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;