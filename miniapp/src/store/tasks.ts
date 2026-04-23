import { create } from 'zustand';
import type { TodayTaskPublic } from '../types';

interface TasksState {
  todayTasks: TodayTaskPublic[];
  loading: boolean;
  setTodayTasks: (tasks: TodayTaskPublic[]) => void;
  completeTask: (itemId: string) => void;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  todayTasks: [],
  loading: false,

  setTodayTasks: (tasks) => set({ todayTasks: tasks }),

  completeTask: (itemId) => {
    const tasks = get().todayTasks.map((t) =>
      t.item_id === itemId
        ? { ...t, completed_today: true, completed_count: t.completed_count + 1 }
        : t
    );
    set({ todayTasks: tasks });
  },
}));
