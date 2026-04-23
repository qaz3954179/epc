import { create } from 'zustand';
import type { UserPublic, UserRole } from '../types';
import Taro from '@tarojs/taro';

interface AuthState {
  token: string | null;
  user: UserPublic | null;
  role: UserRole | null;
  childId: string | null;
  setAuth: (token: string, user: UserPublic) => void;
  switchRole: (role: UserRole) => void;
  switchChild: (childId: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  role: null,
  childId: null,

  setAuth: (token, user) => {
    Taro.setStorageSync('token', token);
    Taro.setStorageSync('user', JSON.stringify(user));
    const role = user.roles?.includes('parent') ? 'parent' : 'child';
    Taro.setStorageSync('role', role);
    set({ token, user, role });
  },

  switchRole: (role) => {
    Taro.setStorageSync('role', role);
    set({ role });
  },

  switchChild: (childId) => {
    Taro.setStorageSync('childId', childId);
    set({ childId });
  },

  logout: () => {
    Taro.removeStorageSync('token');
    Taro.removeStorageSync('user');
    Taro.removeStorageSync('role');
    Taro.removeStorageSync('childId');
    set({ token: null, user: null, role: null, childId: null });
    Taro.redirectTo({ url: '/subpackages/auth/login/login' });
  },

  loadFromStorage: () => {
    const token = Taro.getStorageSync('token') || null;
    const userStr = Taro.getStorageSync('user');
    const role = (Taro.getStorageSync('role') as UserRole) || null;
    const childId = Taro.getStorageSync('childId') || null;
    let user: UserPublic | null = null;
    if (userStr) {
      try { user = JSON.parse(userStr); } catch {}
    }
    set({ token, user, role, childId });
  },
}));
