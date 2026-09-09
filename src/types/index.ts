export interface User {
  id: string
  email: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

export interface Media {
  id: string
  url?: string | null
  filename?: string | null
  mimeType?: string | null
  filesize?: number | null
}

export interface ProductFile {
  id: string
  url?: string | null
  filename?: string | null
  mimeType?: string | null
  filesize?: number | null
}

export interface ProductImage {
  image: string | Media
  id?: string | null
}

export interface Product {
  id: string
  user?: (string | null) | User
  name: string
  description?: string | null
  price: number
  category: 'ui_kits' | 'icons'
  product_files: string | ProductFile
  approvedForSale?: ('pending' | 'approved' | 'denied') | null
  priceId?: string | null
  stripeId?: string | null
  images: ProductImage[]
  updatedAt: string
  createdAt: string
}

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'

export interface Order {
  id: string
  _isPaid: boolean
  user: string | User
  userId?: string
  userEmail?: string
  products: (string | Product)[]
  productIds?: string[]
  amount?: number
  currency?: string
  paymentProvider?: 'sebpay' | string
  paymentStatus?: PaymentStatus
  orderStatus?: 'pending' | 'completed' | 'cancelled'
  sebpayTransactionId?: string | null
  sebpayReference?: string | null
  sebpayPaymentUrl?: string | null
  paidAt?: string | null
  updatedAt: string
  createdAt: string
}

export interface PurchaseRecord {
  id: string
  userId: string
  userEmail?: string
  orderId: string
  productId: string
  grantedAt: string
}
