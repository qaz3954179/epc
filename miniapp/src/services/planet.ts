import { api } from './api';
import type { WishPublicV2, PlanetDetail, KnowledgeCardPublic, MilestonePublic } from '../types';

export const planetApi = {
  // 愿望
  createWish: (data: { content: string; category?: string; emoji?: string }) =>
    api.post<WishPublicV2>('/api/v1/planets/wishes', data),
  getWishes: (params?: { child_id?: string }) =>
    api.get<{ data: WishPublicV2[]; count: number }>(`/api/v1/planets/wishes${params?.child_id ? `?child_id=${params.child_id}` : ''}`),
  getWish: (wishId: string) =>
    api.get<WishPublicV2>(`/api/v1/planets/wishes/${wishId}`),
  reviewWish: (wishId: string, data: { status: 'approved' | 'deferred' | 'rejected'; parent_response?: string }) =>
    api.put<WishPublicV2>(`/api/v1/planets/wishes/${wishId}/review`, data),

  // 星球
  getPlanets: (params?: { child_id?: string }) =>
    api.get<{ data: PlanetDetail[]; count: number }>(`/api/v1/planets${params?.child_id ? `?child_id=${params.child_id}` : ''}`),
  getPlanet: (planetId: string) =>
    api.get<PlanetDetail>(`/api/v1/planets/${planetId}`),
  updatePlanet: (planetId: string, data: { name?: string; color?: string; emoji?: string }) =>
    api.put<PlanetDetail>(`/api/v1/planets/${planetId}`, data),

  // 里程碑
  getMilestones: (planetId: string) =>
    api.get<{ data: MilestonePublic[] }>(`/api/v1/planets/${planetId}/milestones`),

  // 知识卡片
  getCards: (planetId: string) =>
    api.get<{ data: KnowledgeCardPublic[] }>(`/api/v1/planets/${planetId}/cards`),
  createCard: (planetId: string, data: { title: string; content: string; fun_fact?: string; difficulty?: string }) =>
    api.post<KnowledgeCardPublic>(`/api/v1/planets/${planetId}/cards`, data),
  markCardRead: (planetId: string, cardId: string) =>
    api.put<KnowledgeCardPublic>(`/api/v1/planets/${planetId}/cards/${cardId}/read`),
};
