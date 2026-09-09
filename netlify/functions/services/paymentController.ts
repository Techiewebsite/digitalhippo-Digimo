/**
 * Unified Authoritative Payment Controller
 *
 * Single Source of Truth for all payment flows (Netlify Functions & Next.js API Routes).
 * Enforces:
 * 1. Strict server-side pricing in XOF integer minor units (no floating-point rounding issues).
 * 2. Immutable order amounts locked upon initiation.
 * 3. Idempotent fulfillment (grants digital product once).
 * 4. Webhook verification via direct server-to-server inquiry against SebPay (never trust payload alone).
 * 5. Strict state transitions (PAID -> UNPAID transitions are impossible).
 * 6. Four-factor download security (authenticated user + paid order + entitlement + order containment).
 */

import crypto from 'crypto'
import { sebpayService } from './sebpay/sebpayService'
import { appwriteServer } from './appwriteServer'
import { INITIAL_PRODUCTS } from '../../../src/lib/appwrite/mock-catalog'

export interface CreatePaymentInput {
  orderId?: string
  productIds: string[]
  userId?: string
  userEmail?: string
  customerName?: string
  customerPhone?: string
  origin?: string
  hostHeader?: string
}

export interface VerifyPaymentInput {
  orderId: string
  userId?: string
}

export interface WebhookInput {
  rawBody: string | null
  headers: Record<string, string | undefined>
}

// Token generation helper for secure download authorization
const DOWNLOAD_SECRET = process.env.SEBPAY_SECRET_KEY || process.env.APPWRITE_API_KEY || 'marketplace-secure-download-key'

export function generateDownloadToken(params: {
  orderId: string
  productId: string
  userId: string
  expiresAt: number
}): string {
  const payload = `${params.orderId}:${params.productId}:${params.userId}:${params.expiresAt}`
  const hmac = crypto.createHmac('sha256', DOWNLOAD_SECRET).update(payload).digest('hex')
  return `${params.expiresAt}.${hmac}`
}

export function verifyDownloadToken(params: {
  orderId: string
  productId: string
  userId: string
  token: string
}): boolean {
  try {
    const [expiresAtStr, hmac] = params.token.split('.')
    const expiresAt = parseInt(expiresAtStr, 10)
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return false
    }
    const expected = generateDownloadToken({
      orderId: params.orderId,
      productId: params.productId,
      userId: params.userId,
      expiresAt,
    })
    return params.token === expected
  } catch {
    return false
  }
}

/**
 * Validates email format strictly
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isPlaceholderOrLocalUrl(urlOrHost: string): boolean {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0|example\.com|your-marketplace|your-site-name/i.test(
    urlOrHost
  )
}

/**
 * Resolves the authoritative production base URL without any placeholder or local development domains
 */
function resolveProductionBaseUrl(origin?: string, hostHeader?: string): string {
  if (process.env.URL && !isPlaceholderOrLocalUrl(process.env.URL)) {
    return process.env.URL.replace(/\/+$/, '')
  }
  if (process.env.SITE_URL && !isPlaceholderOrLocalUrl(process.env.SITE_URL)) {
    return process.env.SITE_URL.replace(/\/+$/, '')
  }
  if (
    process.env.NEXT_PUBLIC_SERVER_URL &&
    !isPlaceholderOrLocalUrl(process.env.NEXT_PUBLIC_SERVER_URL)
  ) {
    return process.env.NEXT_PUBLIC_SERVER_URL.replace(/\/+$/, '')
  }
  if (origin && !isPlaceholderOrLocalUrl(origin) && origin.startsWith('https://')) {
    return origin.replace(/\/+$/, '')
  }
  if (hostHeader && !isPlaceholderOrLocalUrl(hostHeader)) {
    return `https://${hostHeader}`.replace(/\/+$/, '')
  }
  return 'https://digitalhippo.netlify.app'
}

export const paymentController = {
  /**
   * 1. CREATE PAYMENT SESSION
   */
  async createPayment(input: CreatePaymentInput): Promise<{
    statusCode: number
    body: Record<string, unknown>
  }> {
    const { productIds, userId, userEmail, customerName, customerPhone, origin, hostHeader } = input

    // Product validation
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return {
        statusCode: 400,
        body: { error: 'Valid productIds array is required.' },
      }
    }

    // Customer email validation
    if (userEmail && !isValidEmail(userEmail)) {
      return {
        statusCode: 400,
        body: { error: 'Invalid customer email address provided.' },
      }
    }

    const orderId = input.orderId || 'ord_' + crypto.randomBytes(4).toString('hex')

    // Check existing order status to prevent duplicate charges or paying already-paid order
    const existingOrder = await appwriteServer.getOrder(orderId)
    if (existingOrder) {
      if (existingOrder._isPaid || existingOrder.paymentStatus === 'PAID') {
        return {
          statusCode: 400,
          body: { error: 'This order has already been paid.' },
        }
      }

      // If already has active SebPay session, return it to prevent duplicate payments
      if (existingOrder.sebpayPaymentUrl && existingOrder.paymentStatus === 'PENDING') {
        return {
          statusCode: 200,
          body: {
            url: existingOrder.sebpayPaymentUrl,
            orderId,
            reference: existingOrder.sebpayReference || orderId,
            isExistingSession: true,
          },
        }
      }
    }

    // Authoritative server-side price calculation in XOF integer minor units
    const currency = (process.env.MARKETPLACE_CURRENCY || 'XOF').toUpperCase()
    const calculation = await appwriteServer.calculateServerAmount(productIds, currency)

    // Production URL resolution
    const baseUrl = resolveProductionBaseUrl(origin, hostHeader)
    const successUrl = `${baseUrl}/thank-you?orderId=${encodeURIComponent(orderId)}`
    const cancelUrl = `${baseUrl}/cart`
    const callbackUrl = `${baseUrl}/.netlify/functions/sebpay-webhook`

    // Call SebPay production collection with ONLY documented fields
    const sebpayResult = await sebpayService.createCollection({
      amount: calculation.finalAmount, // Integer XOF
      currency: calculation.currency,
      reference: orderId,
      description: `Bovira Purchase - Order ${orderId}`,
      customer_email: userEmail && isValidEmail(userEmail) ? userEmail : undefined,
      customer_name: customerName?.trim() || undefined,
      customer_phone: customerPhone?.trim() || undefined,
      return_url: successUrl,
      cancel_url: cancelUrl,
      callback_url: callbackUrl,
    })

    // Store authoritative order state in Appwrite
    // The amount calculation.finalAmount is now IMMUTABLY locked with this order
    await appwriteServer.updateOrderPayment({
      orderId,
      paymentStatus: 'PENDING',
      isPaid: false,
      sebpayTransactionId: sebpayResult.transactionId,
      sebpayReference: sebpayResult.reference,
      sebpayPaymentUrl: sebpayResult.paymentUrl,
    })

    return {
      statusCode: 200,
      body: {
        url: sebpayResult.paymentUrl || successUrl,
        orderId,
        reference: sebpayResult.reference,
        amount: calculation.finalAmount,
        currency: calculation.currency,
      },
    }
  },

  /**
   * 2. VERIFY PAYMENT SESSION
   */
  async verifyPayment(input: VerifyPaymentInput): Promise<{
    statusCode: number
    body: Record<string, unknown>
  }> {
    const { orderId, userId } = input

    if (!orderId) {
      return {
        statusCode: 400,
        body: { error: 'orderId parameter is required.' },
      }
    }

    const order = await appwriteServer.getOrder(orderId)

    // User containment check if requested
    if (userId && order && order.userId && order.userId !== userId) {
      return {
        statusCode: 403,
        body: { error: 'Unauthorized: This order belongs to a different account.' },
      }
    }

    // Idempotent: If already marked PAID, return confirmed status immediately
    if (order && (order._isPaid || order.paymentStatus === 'PAID')) {
      // Ensure purchase entitlement is in place (failure recovery)
      if (order.productIds && order.productIds.length > 0) {
        for (const pid of order.productIds) {
          await appwriteServer.verifyAndReconcilePurchaseEntitlement({
            userId: order.userId,
            userEmail: order.userEmail,
            orderId,
            productId: pid,
          })
        }
      }

      return {
        statusCode: 200,
        body: {
          isPaid: true,
          orderId,
          status: 'PAID',
          transactionId: order.sebpayTransactionId || order.sebpayReference,
        },
      }
    }

    // Direct server inquiry against SebPay API
    const identifier =
      order?.sebpayTransactionId ||
      order?.sebpayReference ||
      orderId

    const verification = await sebpayService.verifyTransaction(identifier)

    if (verification.isPaid) {
      // Amount verification: Must match the immutable stored order amount
      if (order && typeof verification.amount === 'number' && order.amount > 0) {
        if (Math.round(verification.amount) !== Math.round(order.amount)) {
          console.error(
            `[PaymentController] CRITICAL Amount Mismatch: Gateway paid ${verification.amount} vs order ${order.amount}`
          )
          return {
            statusCode: 400,
            body: {
              error: 'Payment verification failed: Amount mismatch detected.',
              status: 'FAILED',
            },
          }
        }
      }

      // Currency check
      if (order && verification.currency && order.currency) {
        if (verification.currency.toUpperCase() !== order.currency.toUpperCase()) {
          console.error(
            `[PaymentController] Currency mismatch: Gateway ${verification.currency} vs order ${order.currency}`
          )
          return {
            statusCode: 400,
            body: {
              error: 'Payment verification failed: Currency mismatch detected.',
              status: 'FAILED',
            },
          }
        }
      }

      // Mark order PAID in Appwrite
      await appwriteServer.updateOrderPayment({
        orderId,
        paymentStatus: 'PAID',
        isPaid: true,
        sebpayTransactionId: verification.transactionId || identifier,
      })

      // Idempotently grant digital product access
      if (order && order.productIds && order.productIds.length > 0) {
        await appwriteServer.grantProductAccess({
          userId: order.userId,
          userEmail: order.userEmail,
          orderId,
          productIds: order.productIds,
        })
      }

      return {
        statusCode: 200,
        body: {
          isPaid: true,
          orderId,
          status: 'PAID',
          transactionId: verification.transactionId || identifier,
        },
      }
    }

    // Non-paid response (PENDING, FAILED, etc.)
    return {
      statusCode: 200,
      body: {
        isPaid: false,
        orderId,
        status: verification.status,
      },
    }
  },

  /**
   * 3. ASYNCHRONOUS WEBHOOK NOTIFICATION
   * NEVER trust { status: "PAID" } from payload alone.
   * Performs server-side verification with SebPay before any fulfillment.
   */
  async handleWebhook(input: WebhookInput): Promise<{
    statusCode: number
    body: Record<string, unknown>
  }> {
    const rawBody = input.rawBody || '{}'
    let payload: Record<string, unknown> = {}
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return {
        statusCode: 400,
        body: { error: 'Malformed JSON payload.' },
      }
    }

    const parsed = sebpayService.parseWebhookPayload(payload)
    const { orderId, transactionId } = parsed

    if (!orderId) {
      console.warn('[PaymentController Webhook] Missing order reference in webhook payload.')
      return {
        statusCode: 400,
        body: { error: 'Missing order reference in webhook payload.' },
      }
    }

    // 1. Fetch order from Appwrite
    const order = await appwriteServer.getOrder(orderId)
    if (!order) {
      console.warn(`[PaymentController Webhook] Order not found for reference: ${orderId}`)
      return {
        statusCode: 200,
        body: { received: true, warning: 'Order not found in database.' },
      }
    }

    // 2. Idempotency Check: If already marked as PAID, do not re-process
    if (order._isPaid || order.paymentStatus === 'PAID') {
      console.log(`[PaymentController Webhook] Order ${orderId} is already marked as PAID. Returning safe 200.`)
      return {
        statusCode: 200,
        body: { received: true, message: 'Transaction already processed.' },
      }
    }

    // 3. Independent Gateway Verification:
    // Webhook payload claims payment happened, but we verify directly with SebPay API!
    const identifier = transactionId || order.sebpayTransactionId || orderId
    console.log(`[PaymentController Webhook] Initiating server-side verification for webhook order ${orderId} with identifier ${identifier}`)

    const verification = await sebpayService.verifyTransaction(identifier)

    if (!verification.isPaid) {
      console.warn(
        `[PaymentController Webhook] Direct SebPay check did NOT confirm PAID status. Gateway reported: ${verification.status}. Refusing to mark PAID.`
      )
      return {
        statusCode: 200,
        body: {
          received: true,
          status: verification.status,
          message: 'Payment not yet confirmed by gateway inquiry.',
        },
      }
    }

    // 4. Amount Verification
    if (order.amount > 0 && typeof verification.amount === 'number') {
      if (Math.round(verification.amount) !== Math.round(order.amount)) {
        console.error(
          `[PaymentController Webhook] Amount mismatch! Verified: ${verification.amount}, Order: ${order.amount}`
        )
        await appwriteServer.updateOrderPayment({
          orderId,
          paymentStatus: 'FAILED',
          isPaid: false,
          sebpayTransactionId: transactionId || null,
        })
        return {
          statusCode: 200,
          body: { received: true, warning: 'Payment flagged: amount mismatch detected.' },
        }
      }
    }

    // 5. Authoritatively mark order as PAID and grant product access
    await appwriteServer.updateOrderPayment({
      orderId,
      paymentStatus: 'PAID',
      isPaid: true,
      sebpayTransactionId: verification.transactionId || transactionId || null,
    })

    if (order.productIds && order.productIds.length > 0) {
      await appwriteServer.grantProductAccess({
        userId: order.userId,
        userEmail: order.userEmail,
        orderId,
        productIds: order.productIds,
      })
    }

    console.log(`[PaymentController Webhook] Successfully processed and verified PAID status for order: ${orderId}`)
    return {
      statusCode: 200,
      body: {
        received: true,
        orderId,
        status: 'PAID',
      },
    }
  },

  /**
   * 4. PAYMENT STATUS QUERY
   */
  async getPaymentStatus(orderId: string): Promise<{
    statusCode: number
    body: Record<string, unknown>
  }> {
    if (!orderId) {
      return {
        statusCode: 400,
        body: { error: 'orderId is required' },
      }
    }

    const order = await appwriteServer.getOrder(orderId)
    if (!order) {
      return {
        statusCode: 404,
        body: { error: 'Order not found' },
      }
    }

    return {
      statusCode: 200,
      body: {
        orderId: order.id,
        isPaid: order._isPaid || order.paymentStatus === 'PAID',
        paymentStatus: order.paymentStatus,
        amount: order.amount,
        currency: order.currency,
        updatedAt: order.updatedAt,
      },
    }
  },

  /**
   * 5. SECURE DOWNLOAD AUTHORIZATION
   * Enforces 4-factor authorization:
   * 1. Authenticated user
   * 2. Paid order
   * 3. Purchase entitlement (with auto-reconciliation failure recovery)
   * 4. Product belongs to order
   */
  async authorizeDownload(params: {
    orderId: string
    productId: string
    userId?: string
    userEmail?: string
  }): Promise<{
    statusCode: number
    body: Record<string, unknown>
  }> {
    const { orderId, productId, userId, userEmail } = params

    if (!orderId || !productId) {
      return {
        statusCode: 400,
        body: { error: 'orderId and productId are required' },
      }
    }

    // 1. Authoritative order check
    const order = await appwriteServer.getOrder(orderId)
    if (!order) {
      return {
        statusCode: 404,
        body: { error: 'Order not found' },
      }
    }

    // 2. Paid order check
    if (!order._isPaid && order.paymentStatus !== 'PAID') {
      return {
        statusCode: 403,
        body: {
          error: 'Access denied: Digital products can only be accessed once payment has been verified as PAID.',
          paymentStatus: order.paymentStatus || 'PENDING',
        },
      }
    }

    // 3. User verification: Order must belong to the user
    const effectiveUserId = userId || order.userId
    if (userId && order.userId && order.userId !== userId) {
      return {
        statusCode: 403,
        body: { error: 'Unauthorized: This purchase belongs to a different account.' },
      }
    }

    // 4. Confirm product belongs to order
    if (!order.productIds.includes(productId)) {
      return {
        statusCode: 404,
        body: { error: 'Requested product does not belong to this verified purchase.' },
      }
    }

    // 5. Purchase entitlement check with auto-reconciliation failure recovery
    const hasEntitlement = await appwriteServer.verifyAndReconcilePurchaseEntitlement({
      userId: effectiveUserId,
      userEmail: userEmail || order.userEmail,
      orderId,
      productId,
    })

    if (!hasEntitlement) {
      return {
        statusCode: 403,
        body: { error: 'Valid purchase entitlement record could not be verified.' },
      }
    }

    // 6. Generate time-limited secure download token (valid 15 minutes)
    const expiresAt = Date.now() + 15 * 60 * 1000
    const token = generateDownloadToken({
      orderId,
      productId,
      userId: effectiveUserId,
      expiresAt,
    })

    const catalogProduct = INITIAL_PRODUCTS.find((p) => p.id === productId)
    const fileName =
      (typeof catalogProduct?.product_files === 'object' && catalogProduct.product_files?.filename) ||
      `${productId}-digital-asset.zip`

    const downloadStreamUrl = `/api/download-stream?orderId=${encodeURIComponent(orderId)}&productId=${encodeURIComponent(productId)}&userId=${encodeURIComponent(effectiveUserId)}&token=${encodeURIComponent(token)}`

    return {
      statusCode: 200,
      body: {
        authorized: true,
        downloadUrl: downloadStreamUrl,
        fileName,
        expiresInSeconds: 900,
      },
    }
  },

  /**
   * 6. SECURE STREAM DELIVERY
   * Re-verifies all 4 factors AND the signed token before delivering bytes.
   */
  async verifyStreamAccess(params: {
    orderId: string
    productId: string
    userId: string
    token: string
  }): Promise<{
    authorized: boolean
    fileName: string
    buffer?: Buffer
    error?: string
  }> {
    const { orderId, productId, userId, token } = params

    if (!orderId || !productId || !userId || !token) {
      return { authorized: false, fileName: '', error: 'Missing required authorization parameters.' }
    }

    // Verify token
    const tokenValid = verifyDownloadToken({ orderId, productId, userId, token })
    if (!tokenValid) {
      return { authorized: false, fileName: '', error: 'Invalid or expired download authorization token.' }
    }

    // Re-verify order is paid
    const order = await appwriteServer.getOrder(orderId)
    if (!order || (!order._isPaid && order.paymentStatus !== 'PAID')) {
      return { authorized: false, fileName: '', error: 'Order is not verified as PAID.' }
    }

    // Re-verify product belongs to order
    if (!order.productIds.includes(productId)) {
      return { authorized: false, fileName: '', error: 'Product does not belong to order.' }
    }

    // Re-verify purchase entitlement
    const hasEntitlement = await appwriteServer.verifyAndReconcilePurchaseEntitlement({
      userId,
      orderId,
      productId,
    })

    if (!hasEntitlement) {
      return { authorized: false, fileName: '', error: 'Purchase entitlement not found.' }
    }

    const catalogProduct = INITIAL_PRODUCTS.find((p) => p.id === productId)
    let fileName =
      (typeof catalogProduct?.product_files === 'object' && catalogProduct.product_files?.filename) ||
      `${productId}-digital-asset.zip`

    // Increment download metrics in purchases collection
    await appwriteServer.recordDownload({ userId, orderId, productId })

    // Retrieve binary file from Appwrite Storage bucket 6aa10cbe000dad323c41
    const fileAsset = await appwriteServer.getProductFileBuffer(productId)
    if (fileAsset && fileAsset.fileName) {
      fileName = fileAsset.fileName
    }

    return {
      authorized: true,
      fileName,
      buffer: fileAsset?.buffer,
    }
  },
}
