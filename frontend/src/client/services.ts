import api from './api'
import type {
  Prize,
  PrizeRedemption,
  ShippingAddress,
  CoinLog,
  User,
  PaginatedResponse
} from './types'

// 奖品相关
export const prizeService = {
  list: (params?: { skip?: number; limit?: number; is_active?: boolean }) =>
    api.get<PaginatedResponse<Prize>>('/prizes', { params }),
  
  get: (id: string) =>
    api.get<Prize>(`/prizes/${id}`)
}

// 兑换相关
export const redemptionService = {
  create: (data: { prize_id: string; shipping_address_id?: string; user_note?: string }) =>
    api.post<PrizeRedemption>('/prize-redemptions', data),
  
  list: (params?: { skip?: number; limit?: number; status?: string }) =>
    api.get<PaginatedResponse<PrizeRedemption>>('/prize-redemptions', { params }),
  
  get: (id: string) =>
    api.get<PrizeRedemption>(`/prize-redemptions/${id}`),
  
  cancel: (id: string) =>
    api.put<PrizeRedemption>(`/prize-redemptions/${id}/cancel`)
}

// 收货地址相关
export const addressService = {
  list: () =>
    api.get<PaginatedResponse<ShippingAddress>>('/shipping-addresses'),
  
  create: (data: Omit<ShippingAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
    api.post<ShippingAddress>('/shipping-addresses', data),
  
  get: (id: string) =>
    api.get<ShippingAddress>(`/shipping-addresses/${id}`),
  
  update: (id: string, data: Partial<Omit<ShippingAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) =>
    api.put<ShippingAddress>(`/shipping-addresses/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/shipping-addresses/${id}`),
  
  setDefault: (id: string) =>
    api.put<ShippingAddress>(`/shipping-addresses/${id}/set-default`)
}

// 学习币明细相关
export const coinLogService = {
  list: (params?: { skip?: number; limit?: number; transaction_type?: string }) =>
    api.get<PaginatedResponse<CoinLog>>('/coin-logs', { params }),
  
  get: (id: string) =>
    api.get<CoinLog>(`/coin-logs/${id}`)
}

// 用户相关
export const userService = {
  me: () =>
    api.get<User>('/users/me')
}
