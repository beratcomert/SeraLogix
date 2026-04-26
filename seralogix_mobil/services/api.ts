import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ÖNEMLİ: Emülatör kullanıyorsanız 10.0.2.2, gerçek cihaz için kendi bilgisayarınızın IP'sini girin.
const API_BASE_URL = 'http://192.168.1.3:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Otomatik token ekleme
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login-json', { username, password });
    if (response.data.access_token) {
      await AsyncStorage.setItem('userToken', response.data.access_token);
    }
    return response.data;
  },
  logout: async () => {
    await AsyncStorage.removeItem('userToken');
  }
};

export const mobileService = {
  getDashboard: async () => {
    const response = await api.get('/mobile/dashboard');
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/mobile/profile');
    return response.data;
  }
};
export const aiService = {
  getAnalysis: async (greenhouseId: number) => {
    const response = await api.get(`/ai/analysis/${greenhouseId}`);
    return response.data;
  },
  getRecommendations: async (greenhouseId: number) => {
    const response = await api.get(`/ai/recommendations/${greenhouseId}`);
    return response.data;
  },
  getHealthHistory: async (greenhouseId: number, limit: number = 50) => {
    const response = await api.get(`/ai/health/history/${greenhouseId}?limit=${limit}`);
    return response.data;
  },
  submitFeedback: async (greenhouseId: number, feedbackType: string, payload: object, sensorDataId?: number) => {
    const response = await api.post(`/ai/feedback/${greenhouseId}`, {
      feedback_type: feedbackType,
      payload,
      sensor_data_id: sensorDataId ?? null,
    });
    return response.data;
  },
  getModelStatus: async (greenhouseId: number) => {
    const response = await api.get(`/ai/status/${greenhouseId}`);
    return response.data;
  },
};

