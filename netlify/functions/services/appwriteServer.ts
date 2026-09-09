/**
 * Server-Side Appwrite Service (Admin & Validation)
 *
 * CRITICAL SECURITY RULES:
 * 1. This service runs STRICTLY server-side inside Netlify Functions / Next.js Server API.
 * 2. Uses node-appwrite with server-level permissions (APPWRITE_API_KEY).
 * 3. Never trust client-supplied amounts or prices. Prices are authoritatively fetched and calculated here.
 */

import { Client, Databases, Query, Storage, Users } from 'node-appwrite'
import { INITIAL_PRODUCTS } from '../../../src/lib/appwrite/mock-catalog'

const ENDPOINT =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1'
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a9b4399000ba2817e08'
const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6aa0a8f00015379a297f'
const BUCKET_ID =
  process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || '6aa10cbe000dad323c41'
const API_KEY = process.env.APPWRITE_API_KEY || ''

const COLLECTIONS = {
  orders: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ORDERS || 'orders',
  products: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PRODUCTS || 'products',
  users: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USERS || 'users',
  purchases:
    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PURCHASES || 'purchases',
}

let serverClient: Client | null = null
let serverDatabases: Databases | null = null
let serverUsers: Users | null = null
let serverStorage: Storage | null = null

function getServerClient(): { client: Client; databases: Databases; users: Users; storage: Storage } | null {
  if (!PROJECT_ID || !API_KEY) {
    return null
  }

  if (!serverClient) {
    serverClient = new Client()
      .setEndpoint(ENDPOINT)
      .setProject(PROJECT_ID)
      .setKey(API_KEY)
    serverDatabases = new Databases(serverClient)
    serverUsers = new Users(serverClient)
    serverStorage = new Storage(serverClient)
  }

  return { client: serverClient, databases: serverDatabases!, users: serverUsers!, storage: serverStorage! }
}

export interface AuthoritativeOrder {
  id: string
  userId: string
  userEmail?: string
  productIds: string[]
  amount: number
  currency: string
  _isPaid: boolean
  paymentStatus: string
  paymentProvider?: string
  sebpayTransactionId?: string | null
  sebpayReference?: string | null
  sebpayPaymentUrl?: string | null
  paidAt?: string | null
  createdAt: string
  updatedAt: string
}

export const appwriteServer = {
  /**
   * Authoritatively fetches a product price from Appwrite or catalog.
   */
  async getAuthoritativeProductPrice(productId: string): Promise<{ name: string; price: number }> {
    const s = getServerClient()
    if (s) {
      try {
        const doc = await s.databases.getDocument(DATABASE_ID, COLLECTIONS.products, productId)
        if (doc && typeof doc.price === 'number') {
          return { name: doc.name || 'Digital Product', price: doc.price }
        }
      } catch {
        // Fallback to catalog if product is not yet in cloud database
      }
    }

    const fromCatalog = INITIAL_PRODUCTS.find((p) => p.id === productId)
    if (fromCatalog) {
      return { name: fromCatalog.name, price: fromCatalog.price }
    }

    throw new Error(`Product not found with ID: ${productId}`)
  },

  /**
   * Computes the authoritative order amount and details server-side.
   */
  async calculateServerAmount(
    productIds: string[],
    targetCurrency: string = 'XOF'
  ): Promise<{
    rawUsdTotal: number
    finalAmount: number
    currency: string
    items: Array<{ id: string; name: string; price: number }>
  }> {
    if (!productIds || productIds.length === 0) {
      throw new Error('Cannot calculate amount for empty product list.')
    }

    let usdTotal = 0
    const items: Array<{ id: string; name: string; price: number }> = []

    for (const pid of productIds) {
      const prod = await this.getAuthoritativeProductPrice(pid)
      usdTotal += prod.price
      items.push({ id: pid, name: prod.name, price: prod.price })
    }

    // SebPay operates primarily in West African CFA Francs (XOF).
    // If currency is XOF, apply conversion rate (default ~600 XOF/USD)
    let finalAmount = usdTotal
    const currency = (targetCurrency || process.env.MARKETPLACE_CURRENCY || 'XOF').toUpperCase()

    if (currency === 'XOF') {
      const rate = Number(process.env.USD_TO_XOF_RATE) || 600
      finalAmount = Math.round(usdTotal * rate)
    }

    return {
      rawUsdTotal: usdTotal,
      finalAmount,
      currency,
      items,
    }
  },

  /**
   * Retrieves an order authoritatively from Appwrite.
   */
  async getOrder(orderId: string): Promise<AuthoritativeOrder | null> {
    const s = getServerClient()
    if (!s) {
      return null
    }

    try {
      const doc = await s.databases.getDocument(DATABASE_ID, COLLECTIONS.orders, orderId)
      return {
        id: doc.$id,
        userId: doc.userId,
        userEmail: doc.userEmail,
        productIds: doc.productIds || [],
        amount: Number(doc.amount) || 0,
        currency: doc.currency || 'XOF',
        _isPaid: Boolean(doc.isPaid || doc._isPaid),
        paymentStatus: doc.paymentStatus || (doc.isPaid || doc._isPaid ? 'PAID' : 'PENDING'),
        paymentProvider: doc.paymentProvider || 'sebpay',
        sebpayTransactionId: doc.sebpayTransactionId || null,
        sebpayReference: doc.sebpayReference || null,
        sebpayPaymentUrl: doc.sebpayPaymentUrl || null,
        paidAt: doc.paidAt || null,
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt,
      }
    } catch (err: unknown) {
      const error = err as Error
      console.warn(`[AppwriteServer] getOrder (${orderId}) failed: ${error.message}`)
      return null
    }
  },

  /**
   * Updates an order's payment details in Appwrite with strict state machine transitions.
   * Prevents PAID -> UNPAID regressions.
   */
  async updateOrderPayment(params: {
    orderId: string
    paymentStatus: string
    isPaid: boolean
    sebpayTransactionId?: string | null
    sebpayReference?: string | null
    sebpayPaymentUrl?: string | null
  }): Promise<void> {
    const s = getServerClient()
    if (!s) {
      console.warn('[AppwriteServer] APPWRITE_API_KEY not configured. Skipping server database update.')
      return
    }

    try {
      // 1. Fetch current order state to enforce state transition rules
      const currentDoc = await s.databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.orders,
        params.orderId
      )

      const isCurrentlyPaid = Boolean(currentDoc.isPaid || currentDoc._isPaid) || currentDoc.paymentStatus === 'PAID'

      // Terminal state protection: Once PAID, an order CANNOT be reverted to PENDING/FAILED/CANCELLED
      if (isCurrentlyPaid && (!params.isPaid || params.paymentStatus !== 'PAID')) {
        console.warn(
          `[AppwriteServer] BLOCKED state change: Order ${params.orderId} is already PAID. Rejecting change to ${params.paymentStatus} (isPaid: ${params.isPaid}).`
        )
        return
      }

      const updateData: Record<string, unknown> = {
        isPaid: isCurrentlyPaid ? true : params.isPaid,
        paymentStatus: isCurrentlyPaid ? 'PAID' : params.paymentStatus,
      }

      if (params.sebpayTransactionId !== undefined && params.sebpayTransactionId !== null) {
        updateData.sebpayTransactionId = params.sebpayTransactionId
      }
      if (params.sebpayReference !== undefined && params.sebpayReference !== null) {
        updateData.sebpayReference = params.sebpayReference
      }
      if (params.sebpayPaymentUrl !== undefined && params.sebpayPaymentUrl !== null) {
        updateData.sebpayPaymentUrl = params.sebpayPaymentUrl
      }
      if (params.isPaid || isCurrentlyPaid) {
        updateData.paidAt = currentDoc.paidAt || new Date().toISOString()
      }

      await s.databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.orders,
        params.orderId,
        updateData
      )
      console.log(`[AppwriteServer] Order ${params.orderId} successfully updated with status: ${updateData.paymentStatus}`)
    } catch (err: unknown) {
      const error = err as Error
      console.error(`[AppwriteServer] Failed to update order payment in Appwrite: ${error.message}`)
      throw new Error(`Database error updating order status: ${error.message}`)
    }
  },

  /**
   * Checks if an authorized purchase record exists for this user, order, and product.
   * If order is verified PAID but purchase record is missing due to a transient failure,
   * it automatically reconciles and grants the entitlement (failure recovery).
   */
  async verifyAndReconcilePurchaseEntitlement(params: {
    userId?: string
    userEmail?: string
    orderId: string
    productId: string
  }): Promise<boolean> {
    const s = getServerClient()
    if (!s) {
      // In development / offline without DB keys, grant if order is paid
      const order = await this.getOrder(params.orderId)
      return Boolean(order && (order._isPaid || order.paymentStatus === 'PAID') && order.productIds.includes(params.productId))
    }

    try {
      // 1. Authoritative order check
      const order = await this.getOrder(params.orderId)
      if (!order || (!order._isPaid && order.paymentStatus !== 'PAID')) {
        return false
      }

      if (!order.productIds.includes(params.productId)) {
        return false
      }

      if (params.userId && order.userId && order.userId !== params.userId) {
        return false
      }

      // 2. Query purchases collection
      const existing = await s.databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.purchases,
        [
          Query.equal('orderId', params.orderId),
          Query.equal('productId', params.productId),
        ]
      )

      if (existing.total > 0) {
        return true
      }

      // 3. Failure Recovery: Order is authoritatively PAID, but purchase doc was missing
      console.log(
        `[AppwriteServer] Failure recovery triggered: Reconciling missing purchase record for paid order ${params.orderId} and product ${params.productId}`
      )
      await this.grantProductAccess({
        userId: params.userId || order.userId,
        userEmail: params.userEmail || order.userEmail,
        orderId: params.orderId,
        productIds: [params.productId],
      })

      return true
    } catch (err: unknown) {
      const error = err as Error
      console.error(`[AppwriteServer] verifyAndReconcilePurchaseEntitlement failed: ${error.message}`)
      return false
    }
  },

  /**
   * Grants digital product purchases to customer.
   * Enforces strict idempotency to prevent duplicate purchase records.
   */
  async grantProductAccess(params: {
    userId: string
    userEmail?: string
    orderId: string
    productIds: string[]
  }): Promise<void> {
    const s = getServerClient()
    if (!s) {
      console.warn('[AppwriteServer] APPWRITE_API_KEY not configured. Skipping purchase document creation.')
      return
    }

    for (const productId of params.productIds) {
      try {
        // Check for existing purchase to maintain idempotency
        const existing = await s.databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.purchases,
          [
            Query.equal('orderId', params.orderId),
            Query.equal('productId', productId),
          ]
        )

        if (existing.total > 0) {
          console.log(`[AppwriteServer] Purchase record already exists for order ${params.orderId} and product ${productId}`)
          continue
        }

        // Create new purchase record
        const purchaseId = `pur_${params.orderId}_${productId}`.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 36)
        await s.databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.purchases,
          purchaseId,
          {
            userId: params.userId,
            userEmail: params.userEmail || '',
            orderId: params.orderId,
            productId,
            grantedAt: new Date().toISOString(),
          }
        )
        console.log(`[AppwriteServer] Granted product access: ${productId} to user ${params.userId}`)
      } catch (err: unknown) {
        const error = err as Error
        console.warn(`[AppwriteServer] Failed to record purchase for product ${productId}: ${error.message}`)
      }
    }
  },

  /**
   * Records digital asset download by incrementing count and updating timestamp.
   */
  async recordDownload(params: {
    userId: string
    orderId: string
    productId: string
  }): Promise<void> {
    const s = getServerClient()
    if (!s) return

    try {
      const records = await s.databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.purchases,
        [
          Query.equal('orderId', params.orderId),
          Query.equal('productId', params.productId),
        ]
      )

      if (records.total > 0) {
        const doc = records.documents[0]
        const currentCount = Number(doc.downloadCount) || 0
        await s.databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.purchases,
          doc.$id,
          {
            downloadCount: currentCount + 1,
            lastDownloadedAt: new Date().toISOString(),
          }
        )
        console.log(`[AppwriteServer] Incremented downloadCount for purchase ${doc.$id} to ${currentCount + 1}`)
      }
    } catch (err: unknown) {
      const error = err as Error
      console.warn(`[AppwriteServer] recordDownload error: ${error.message}`)
    }
  },

  /**
   * Streams the authoritative digital asset binary directly from Appwrite Storage bucket.
   */
  async getProductFileBuffer(productId: string): Promise<{ buffer: Buffer; fileName: string } | null> {
    const s = getServerClient()
    if (!s) return null

    try {
      let fileId = `asset_${productId}`.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 36)
      let fileName = `${productId}-digital-asset.zip`

      try {
        const prod = await s.databases.getDocument(DATABASE_ID, COLLECTIONS.products, productId)
        if (prod.fileId) {
          fileId = prod.fileId
        }
        if (prod.name) {
          fileName = `${prod.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.zip`
        }
      } catch {
        // Fallback to asset_{productId}
      }

      const arrayBuffer = await s.storage.getFileDownload({
        bucketId: BUCKET_ID,
        fileId,
      })

      return {
        buffer: Buffer.from(arrayBuffer),
        fileName,
      }
    } catch (err: unknown) {
      const error = err as Error
      console.warn(`[AppwriteServer] getProductFileBuffer error: ${error.message}`)
      return null
    }
  },
}
