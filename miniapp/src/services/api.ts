import Taro from '@tarojs/taro';
import { useAuthStore } from '../store/auth';

const BASE_URL = process.env.TARO_APP_API_URL || '';

function request<T>(options: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: unknown;
  needAuth?: boolean;
}): Promise<T> {
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.needAuth !== false) {
    const token = useAuthStore.getState().token;
    if (token) header['Authorization'] = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    Taro.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data as any,
      header,
      success: (res) => {
        if (res.statusCode === 401) {
          useAuthStore.getState().logout();
          reject(new Error('未登录'));
          return;
        }
        if (res.statusCode >= 400) {
          reject(new Error(res.data?.detail || '请求失败'));
          return;
        }
        resolve(res.data as T);
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络错误'));
      },
    });
  });
}

export const api = {
  get: <T>(url: string) => request<T>({ url }),
  post: <T>(url: string, data?: unknown) => request<T>({ url, method: 'POST', data }),
  put: <T>(url: string, data?: unknown) => request<T>({ url, method: 'PUT', data }),
  patch: <T>(url: string, data?: unknown) => request<T>({ url, method: 'PATCH', data }),
  delete: <T>(url: string) => request<T>({ url, method: 'DELETE' }),
};
