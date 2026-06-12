/**
 * API Service for backend communication
 * Handles all HTTP requests to the FastAPI backend
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import { jwtDecode } from 'jwt-decode';

// API base URL — override via VITE_API_URL (.env.local for dev, Vercel/Render for prod)
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

// Log the API URL to help debugging hosting issues
console.log('API Base URL:', API_BASE_URL);


interface DecodedToken {
  sub: number; // user id
  role: string;
  exp: number;
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },
  withCredentials: false
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token expiration
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle Network Errors (no response received)
    if (!error.response) {
      console.error('NETWORK ERROR: Could not reach the API at', API_BASE_URL);
      console.error('Please check:');
      console.error('1. Is the backend server running?');
      console.error('2. Is the VITE_API_URL correct?');
      console.error('3. Are there CORS blocking the request?');
      return Promise.reject(new Error(`Network error: Unable to connect to the server at ${API_BASE_URL}. Please check if the backend is running.`));

    }

    // Only redirect on 401 if we're not already on login page
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      console.error('API 401 Unauthorized - Token may be expired or invalid');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      // Force redirect to login page since AuthContext won't know about this change immediately
      window.location.href = '/login';
    }
    // Log other errors for debugging
    if (error.response?.status && error.response.status !== 401) {
      console.error(`API Error ${error.response.status}:`, error.response.data);
    }
    return Promise.reject(error);
  }
);


// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
};

// Auth API
export const authAPI = {
  register: async (email: string, password: string, username: string, captcha: string, captcha_id?: string) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      username,
      captcha,
      captcha_id,
    });
    return response.data;
  },
  getCaptcha: async () => {
    const response = await api.get('/auth/captcha', {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    return response.data;
  },

  login: async (email: string, password: string, captcha: string, captcha_id?: string) => {
    const response = await api.post('/auth/login', {
      email,
      password,
      captcha,
      captcha_id,
    });
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue even if logout fails
      console.error('Logout error:', error);
    }
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  getLoginHistory: async () => {
    const response = await api.get('/auth/history');
    return response.data.history || [];
  },
};

// Vault API
export const vaultAPI = {
  store: async (data: {
    category: string;
    pii_type: string;
    type_label: string;
    value: string;
    label: string;
    notes?: string;
    expiry_date?: string;
  }) => {
    const response = await api.post('/api/vault/store', data);
    return response.data;
  },

  list: async () => {
    const response = await api.get('/api/vault/list');
    return response.data.records || [];
  },

  retrieve: async (recordId: number) => {
    const response = await api.get(`/api/vault/retrieve/${recordId}`);
    return response.data;
  },

  update: async (recordId: number, data: {
    label?: string;
    notes?: string;
    expiry_date?: string;
    value?: string;
  }) => {
    const response = await api.put(`/api/vault/update/${recordId}`, data);
    return response.data;
  },

  delete: async (recordId: number) => {
    const response = await api.delete(`/api/vault/delete/${recordId}`);
    return response.data;
  },

  // File operations
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/vault/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  listFiles: async () => {
    const response = await api.get('/api/vault/files/list');
    return response.data.files || [];
  },

  downloadFile: async (fileId: number | string, filename: string) => {
    const response = await api.get(`/api/vault/files/${fileId}/download`, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  deleteFile: async (fileId: number | string) => {
    const response = await api.delete(`/api/vault/files/${fileId}`);
    return response.data;
  },

  getAlerts: async () => {
    const response = await api.get('/api/vault/alerts');
    return response.data.alerts || [];
  },

  getStats: async () => {
    const response = await api.get('/api/vault/stats');
    return response.data;
  },

  downloadBackup: async () => {
    const response = await api.get('/api/vault/backup/download', {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'backup.zip');
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  submitDeletionRequest: async (reason: string) => {
    const response = await api.post('/api/vault/deletion-request', { reason });
    return response.data;
  },

  getDeletionRequest: async () => {
    const response = await api.get('/api/vault/deletion-request');
    return response.data;
  },

  confirmDeletionRequest: async () => {
    const response = await api.post('/api/vault/deletion-request/confirm');
    return response.data;
  },
};

// Admin API (optional)
export const adminAPI = {
  listUsers: async () => {
    const response = await api.get('/api/admin/users');
    return response.data.users || [];
  },

  updateUserRole: async (userId: number, role: string) => {
    const response = await api.put(`/api/admin/users/${userId}/role`, null, {
      params: { role },
    });
    return response.data;
  },

  deleteUser: async (userId: number) => {
    const response = await api.delete(`/api/admin/users/${userId}`);
    return response.data;
  },

  getAuditLogs: async (limit: number = 100) => {
    const response = await api.get('/api/admin/audit', {
      params: { limit },
    });
    return response.data.audit_logs || [];
  },

  getUserGraph: async (userId: number) => {
    const response = await api.get(`/api/admin/users/${userId}/graph`);
    return response.data.records || [];
  },

  getStatistics: async () => {
    const response = await api.get('/api/admin/statistics');
    return response.data;
  },

  getDeletionRequests: async () => {
    const response = await api.get('/api/admin/deletion-requests');
    return response.data.requests || [];
  },

  updateDeletionRequest: async (requestId: number, status: string) => {
    const response = await api.put(`/api/admin/deletion-requests/${requestId}`, { status });
    return response.data;
  },
};

export default api;