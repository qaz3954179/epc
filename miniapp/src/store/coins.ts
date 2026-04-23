import { create } from 'zustand';
import type { CoinLogPublic } from '../types';

interface CoinsState {
  balance: number;
  todayLogs: CoinLogPublic[];
  updateBalance: (balance: number) => void;
  addLog: (log: CoinLogPublic) => void;
  setTodayLogs: (logs: CoinLogPublic[]) => void;
}

export const useCoinsStore = create<CoinsState>((set, get) => ({
  balance: 0,
  todayLogs: [],

  updateBalance: (balance) => set({ balance }),

  addLog: (log) => set({ todayLogs: [log, ...get().todayLogs] }),

  setTodayLogs: (logs) => set({ todayLogs: logs }),
}));
