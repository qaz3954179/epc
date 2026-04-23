import { create } from 'zustand';
import { planetApi } from '../services/planet';
import type { PlanetDetail, WishPublicV2, KnowledgeCardPublic } from '../types';

interface PlanetState {
  planets: PlanetDetail[];
  currentPlanet: PlanetDetail | null;
  wishes: WishPublicV2[];
  loading: boolean;

  fetchPlanets: (childId?: string) => Promise<void>;
  fetchPlanet: (planetId: string) => Promise<void>;
  fetchWishes: (childId?: string) => Promise<void>;
  createWish: (data: { content: string; category?: string; emoji?: string }) => Promise<WishPublicV2>;
  reviewWish: (wishId: string, data: { status: 'approved' | 'deferred' | 'rejected'; parent_response?: string }) => Promise<void>;
  markCardRead: (planetId: string, cardId: string) => Promise<void>;
  clearCurrent: () => void;
}

export const usePlanetStore = create<PlanetState>((set, get) => ({
  planets: [],
  currentPlanet: null,
  wishes: [],
  loading: false,

  fetchPlanets: async (childId) => {
    try {
      set({ loading: true });
      const res = await planetApi.getPlanets(childId ? { child_id: childId } : undefined);
      set({ planets: res.data });
    } catch (err) {
      console.error('fetchPlanets error', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchPlanet: async (planetId) => {
    try {
      set({ loading: true });
      const planet = await planetApi.getPlanet(planetId);
      set({ currentPlanet: planet });
    } catch (err) {
      console.error('fetchPlanet error', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchWishes: async (childId) => {
    try {
      set({ loading: true });
      const res = await planetApi.getWishes(childId ? { child_id: childId } : undefined);
      set({ wishes: res.data });
    } catch (err) {
      console.error('fetchWishes error', err);
    } finally {
      set({ loading: false });
    }
  },

  createWish: async (data) => {
    const wish = await planetApi.createWish(data);
    set((s) => ({ wishes: [wish, ...s.wishes] }));
    return wish;
  },

  reviewWish: async (wishId, data) => {
    const updated = await planetApi.reviewWish(wishId, data);
    set((s) => ({
      wishes: s.wishes.map((w) => (w.id === wishId ? updated : w)),
    }));
  },

  markCardRead: async (planetId, cardId) => {
    const card = await planetApi.markCardRead(planetId, cardId);
    const { currentPlanet } = get();
    if (currentPlanet && currentPlanet.id === planetId) {
      set({
        currentPlanet: {
          ...currentPlanet,
          cards: currentPlanet.cards.map((c) => (c.id === cardId ? card : c)),
        },
      });
    }
  },

  clearCurrent: () => set({ currentPlanet: null }),
}));
