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

export const attendanceAPI = {
  markAttendance: async (data: {
    type: 'check-in' | 'check-out';
    faceData: string;
    location?: { latitude: number; longitude: number };
  }) => {
    try {
      const response = await api.post('/attendance/mark', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark attendance');
    }
  },

  getAttendanceHistory: async (filters?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
  }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.userId) params.append('userId', filters.userId);

      const response = await api.get(`/attendance/history?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch attendance history');
    }
  },

  getTodayAttendance: async () => {
    try {
      const response = await api.get('/attendance/today');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch today\'s attendance');
    }
  },

  getAttendanceStats: async (period: 'week' | 'month' | 'year' = 'month') => {
    try {
      const response = await api.get(`/attendance/stats?period=${period}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch attendance stats');
    }
  },

  getAttendanceReport: async (filters: {
    startDate: string;
    endDate: string;
    department?: string;
    userId?: string;
  }) => {
    try {
      const response = await api.post('/attendance/report', filters);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate attendance report');
    }
  },

  verifyFace: async (faceData: string) => {
    try {
      const response = await api.post('/attendance/verify-face', { faceData });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Face verification failed');
    }
  },

  getAttendanceByDate: async (date: string) => {
    try {
      const response = await api.get(`/attendance/date/${date}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch attendance for date');
    }
  },

  updateAttendance: async (attendanceId: string, updates: {
    type?: 'check-in' | 'check-out';
    timestamp?: string;
    location?: { latitude: number; longitude: number };
  }) => {
    try {
      const response = await api.put(`/attendance/${attendanceId}`, updates);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update attendance');
    }
  },

  deleteAttendance: async (attendanceId: string) => {
    try {
      const response = await api.delete(`/attendance/${attendanceId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete attendance record');
    }
  },
}; 