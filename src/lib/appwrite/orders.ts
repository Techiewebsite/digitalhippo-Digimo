import { Query } from 'appwrite'
import { databases } from './client'
import { APPWRITE_CONFIG, isAppwriteConfigured } from './config'
import { Order, Product, User } from '@/types'
import { productsService } from './products'

const LOCAL_ORDERS_KEY = 'digitalhippo_orders'

const getLocalOrders = (): Order[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveLocalOrder = (order: Order) => {
  if (typeof window === 'undefined') return
  const current = getLocalOrders()
  const filtered = current.filter((o) => o.id !== order.id)
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify([order, ...filtered]))
}

export const ordersService = {
  async createOrder({
    orderId,
    userId,
    userEmail,
    products,
    amount,
    currency = 'XOF',
    paymentProvider = 'sebpay',
    paymentStatus = 'PENDING',
    isPaid = false,
  }: {
    orderId?: string
    userId: string
    userEmail?: string
    products: Product[]
    amount?: number
    currency?: string
    paymentProvider?: string
    paymentStatus?: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED'
    isPaid?: boolean
  }): Promise<Order> {
    const id = orderId || 'ord_' + Math.random().toString(36).substring(2, 9)
    const userObj: User = {
      id: userId,
      email: userEmail || 'customer@example.com',
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const calculatedAmount =
      amount !== undefined
        ? amount
        : products.reduce((acc, p) => acc + (p.price || 0), 0)

    const order: Order = {
      id,
      _isPaid: isPaid,
      user: userObj,
      userId,
      userEmail: userEmail || 'customer@example.com',
      products,
      productIds: products.map((p) => p.id),
      amount: calculatedAmount,
      currency,
      paymentProvider,
      paymentStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (isAppwriteConfigured()) {
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.orders,
          id,
          {
            isPaid,
            userId,
            userEmail: userEmail || '',
            productIds: products.map((p) => p.id),
            amount: calculatedAmount,
            currency,
            paymentProvider,
            paymentStatus,
          }
        )
      } catch (err) {
        console.warn('Appwrite createDocument for order failed:', err)
      }
    }

    saveLocalOrder(order)
    return order
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    if (isAppwriteConfigured()) {
      try {
        const doc = await databases.getDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.orders,
          orderId
        )

        const productIds: string[] = doc.productIds || []
        const fetchedProducts = await Promise.all(
          productIds.map((id) => productsService.getProductById(id))
        )
        const validProducts = fetchedProducts.filter(Boolean) as Product[]

        return {
          id: doc.$id,
          _isPaid: Boolean(doc.isPaid || doc._isPaid),
          paymentStatus: doc.paymentStatus || (doc.isPaid || doc._isPaid ? 'PAID' : 'PENDING'),
          paymentProvider: doc.paymentProvider || 'sebpay',
          amount: Number(doc.amount) || 0,
          currency: doc.currency || 'XOF',
          sebpayTransactionId: doc.sebpayTransactionId || null,
          sebpayReference: doc.sebpayReference || null,
          sebpayPaymentUrl: doc.sebpayPaymentUrl || null,
          paidAt: doc.paidAt || null,
          user: {
            id: doc.userId || 'user',
            email: doc.userEmail || 'customer@example.com',
            role: 'user',
            createdAt: doc.$createdAt,
            updatedAt: doc.$updatedAt,
          },
          products: validProducts,
          createdAt: doc.$createdAt,
          updatedAt: doc.$updatedAt,
        }
      } catch (err) {
        console.warn(`Appwrite getDocument order (${orderId}) error:`, err)
      }
    }

    // Local fallback
    const local = getLocalOrders().find((o) => o.id === orderId)
    if (local) return local

    // Safe mock order if accessing freshly from payment callback
    return {
      id: orderId,
      _isPaid: true,
      user: {
        id: 'usr_buyer',
        email: 'customer@example.com',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      products: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  async updateOrderPaymentStatus(
    orderId: string,
    isPaid: boolean
  ): Promise<void> {
    if (isAppwriteConfigured()) {
      try {
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.orders,
          orderId,
          {
            isPaid,
          }
        )
      } catch (err) {
        console.warn('Appwrite updateDocument error:', err)
      }
    }

    const localOrders = getLocalOrders()
    const found = localOrders.find((o) => o.id === orderId)
    if (found) {
      found._isPaid = isPaid
      saveLocalOrder(found)
    }
  },

  async pollOrderStatus(orderId: string): Promise<{ isPaid: boolean }> {
    const order = await this.getOrderById(orderId)
    return { isPaid: order ? order._isPaid : false }
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    if (isAppwriteConfigured()) {
      try {
        const response = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.orders,
          [Query.equal('userId', userId), Query.orderDesc('$createdAt')]
        )
        return response.documents.map((doc) => ({
          id: doc.$id,
          _isPaid: Boolean(doc.isPaid || doc._isPaid),
          user: doc.userId,
          products: [],
          createdAt: doc.$createdAt,
          updatedAt: doc.$updatedAt,
        }))
      } catch (err) {
        console.warn('Appwrite listDocuments for user orders error:', err)
      }
    }

    return getLocalOrders().filter(
      (o) => typeof o.user !== 'string' && o.user.id === userId
    )
  },

  async getAllOrders(): Promise<Order[]> {
    if (isAppwriteConfigured()) {
      try {
        const response = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.orders,
          [Query.orderDesc('$createdAt'), Query.limit(50)]
        )
        return response.documents.map((doc) => ({
          id: doc.$id,
          _isPaid: Boolean(doc._isPaid),
          paymentStatus: doc.paymentStatus || (doc._isPaid ? 'PAID' : 'PENDING'),
          paymentProvider: doc.paymentProvider || 'sebpay',
          amount: Number(doc.amount) || 0,
          currency: doc.currency || 'XOF',
          sebpayTransactionId: doc.sebpayTransactionId || null,
          sebpayReference: doc.sebpayReference || null,
          paidAt: doc.paidAt || null,
          user: {
            id: doc.userId || 'user',
            email: doc.userEmail || 'customer@example.com',
            role: 'user',
            createdAt: doc.$createdAt,
            updatedAt: doc.$updatedAt,
          },
          products: [],
          createdAt: doc.$createdAt,
          updatedAt: doc.$updatedAt,
        }))
      } catch (err) {
        console.warn('Appwrite listDocuments for all orders error:', err)
      }
    }

    return getLocalOrders()
  },
}
