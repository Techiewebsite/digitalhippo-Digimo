/**
 * SebPay Production Types and Definitions
 *
 * Base Production API: https://newapi.sebpay.bj/api/v1
 * Documented Authentication Headers:
 *   X-Public-Key: pk_live_...
 *   X-Secret-Key: sk_live_...
 *   Content-Type: application/json
 *   Accept: application/json
 */

export interface SebPayConfig {
  publicKey: string
  secretKey: string
  apiUrl: string
  currency: string
}

export interface SebPayCollectionRequest {
  amount: number
  reference: string
  currency?: string
  description?: string
  customer_email?: string
  customer_name?: string
  customer_phone?: string
  callback_url?: string
  return_url?: string
  cancel_url?: string
}

export interface SebPayCollectionResponse {
  success?: boolean
  status?: string
  message?: string
  transaction_id?: string
  id?: string
  reference?: string
  payment_url?: string
  checkout_url?: string
  url?: string
  amount?: number
  currency?: string
  data?: {
    id?: string
    transaction_id?: string
    reference?: string
    payment_url?: string
    checkout_url?: string
    url?: string
    status?: string
    amount?: number
    currency?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface SebPayTransactionStatusResponse {
  status?: string
  paid?: boolean
  transaction_id?: string
  id?: string
  reference?: string
  amount?: number
  currency?: string
  data?: {
    id?: string
    transaction_id?: string
    reference?: string
    status?: string
    amount?: number
    currency?: string
    paid?: boolean
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface SebPayWebhookPayload {
  event?: string
  action?: string
  status?: string
  transaction_id?: string
  id?: string
  reference?: string
  order_id?: string
  orderId?: string
  amount?: number
  currency?: string
  data?: {
    transaction_id?: string
    id?: string
    reference?: string
    order_id?: string
    orderId?: string
    status?: string
    amount?: number
    currency?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

export type InternalPaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'

