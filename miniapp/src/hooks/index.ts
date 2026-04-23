import { useAuthStore } from '../store';
import type { UserRole } from '../types';

/** 获取当前角色 */
export function useRole(): UserRole | null {
  return useAuthStore((s) => s.role);
}

/** 是否家长 */
export function useIsParent(): boolean {
  return useAuthStore((s) => s.role) === 'parent';
}

/** 当前选中的孩子 ID */
export function useCurrentChildId(): string | null {
  return useAuthStore((s) => s.childId);
}
