import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const userAPI = {
  getProfile: async () => {
    try {
      const response = await api.get('/user/profile');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  },

  updateProfile: async (profileData: {
    name?: string;
    phone?: string;
    department?: string;
    position?: string;
    employeeId?: string;
  }) => {
    try {
      const response = await api.put('/user/profile', profileData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  registerFace: async (faceData: string[]) => {
    try {
      const response = await api.post('/user/register-face', { faceData });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to register face');
    }
  },

  updateSettings: async (settings: {
    notifications?: boolean;
    biometricAuth?: boolean;
    autoLocation?: boolean;
  }) => {
    try {
      const response = await api.put('/user/settings', settings);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update settings');
    }
  },

  uploadProfileImage: async (imageData: string) => {
    try {
      const response = await api.post('/user/profile-image', { imageData });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload profile image');
    }
  },

  changePassword: async (passwords: {
    currentPassword: string;
    newPassword: string;
  }) => {
    try {
      const response = await api.put('/user/change-password', passwords);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  },

  deleteAccount: async () => {
    try {
      const response = await api.delete('/user/account');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete account');
    }
  },

  getUsers: async (filters?: {
    department?: string;
    role?: string;
    search?: string;
  }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.department) params.append('department', filters.department);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.search) params.append('search', filters.search);

      const response = await api.get(`/user/list?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },

  getUserById: async (userId: string) => {
    try {
      const response = await api.get(`/user/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
  },

  updateUser: async (userId: string, userData: {
    name?: string;
    email?: string;
    role?: string;
    department?: string;
    employeeId?: string;
    isActive?: boolean;
  }) => {
    try {
      const response = await api.put(`/user/${userId}`, userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  },

  deleteUser: async (userId: string) => {
    try {
      const response = await api.delete(`/user/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  },

  getAdminStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch admin stats');
    }
  },

  getAttendanceReports: async () => {
    try {
      const response = await api.get('/admin/attendance-reports');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch attendance reports');
    }
  },
}; 