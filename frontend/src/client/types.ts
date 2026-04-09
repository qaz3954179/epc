export type PrizeType = "physical" | "virtual"

export type RedemptionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "cancelled"
  | "refunded"

export type TransactionType =
  | "task_completion"
  | "prize_redemption"
  | "admin_adjustment"
  | "refund"
  | "referral_bonus"

export interface Prize {
  id: string
  name: string
  description?: string
  prize_type: PrizeType
  coins_required: number
  stock_quantity: number
  is_active: boolean
  image_url?: string
  created_at: string
  updated_at: string
}

export interface PrizeRedemption {
  id: string
  user_id: string
  prize_id: string
  prize_name: string
  prize_type: PrizeType
  coins_spent: number
  status: RedemptionStatus
  redeemed_at: string
  recipient_name?: string
  recipient_phone?: string
  recipient_address?: string
  tracking_number?: string
  shipping_company?: string
  shipped_at?: string
  completed_at?: string
  cancelled_at?: string
  user_note?: string
  admin_note?: string
}

export interface ShippingAddress {
  id: string
  user_id: string
  recipient_name: string
  recipient_phone: string
  province: string
  city: string
  district?: string
  detail_address: string
  postal_code?: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface CoinLog {
  id: string
  user_id: string
  amount: number
  balance_after: number
  transaction_type: TransactionType
  description: string
  created_at: string
  related_id?: string
}

export interface User {
  id: string
  email: string
  full_name?: string
  learning_coins: number
  is_superuser: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
}
