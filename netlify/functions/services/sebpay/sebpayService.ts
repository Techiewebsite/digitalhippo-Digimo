/**
 * SebPay Production Payment Service
 *
 * CRITICAL SECURITY REQUIREMENTS:
 * 1. This service runs STRICTLY server-side inside Netlify Functions / Next.js API.
 * 2. SEBPAY_SECRET_KEY is NEVER logged, never returned to the frontend, and never exposed in browser bundles.
 * 3. All outgoing requests use the required SebPay headers:
 *      X-Public-Key: pk_live_...
 *      X-Secret-Key: sk_live_...
 *      Content-Type: application/json
 * 4. Production API Base URL: https://newapi.sebpay.bj/api/v1
 */

import {
  SebPayCollectionRequest,
  SebPayCollectionResponse,
  SebPayTransactionStatusResponse,
  SebPayWebhookPayload,
  InternalPaymentStatus,
} from './sebpayTypes'

export class SebPayService {
  private publicKey: string
  private secretKey: string
  private apiUrl: string
  private defaultCurrency: string

  constructor() {
    this.publicKey = process.env.SEBPAY_PUBLIC_KEY || ''
    this.secretKey = process.env.SEBPAY_SECRET_KEY || ''
    this.apiUrl =
      process.env.SEBPAY_API_URL || 'https://newapi.sebpay.bj/api/v1'
    this.defaultCurrency = process.env.MARKETPLACE_CURRENCY || 'XOF'
  }

  /**
   * Validates that production credentials are configured in the server environment.
   */
  public isConfigured(): boolean {
    return Boolean(this.publicKey && this.secretKey)
  }

  /**
   * Sanitizes logs to prevent accidental exposure of secret keys.
   */
  private sanitize(text: string): string {
    if (!text) return ''
    if (this.secretKey) {
      text = text.replace(new RegExp(this.escapeRegex(this.secretKey), 'g'), '[REDACTED_SECRET]')
    }
    return text
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Initiates a collection request with SebPay's production API.
   * Endpoint: POST https://newapi.sebpay.bj/api/v1/collections
   */
  async createCollection(
    request: SebPayCollectionRequest
  ): Promise<{
    paymentUrl: string
    transactionId: string
    reference: string
    rawResponse?: Record<string, unknown>
  }> {
    if (!this.isConfigured()) {
      throw new Error(
        'SebPay production credentials (SEBPAY_PUBLIC_KEY and SEBPAY_SECRET_KEY) are not configured in Netlify environment.'
      )
    }

    if (!request.amount || request.amount <= 0) {
      throw new Error('Invalid payment amount. Amount must be greater than zero.')
    }

    if (!request.reference) {
      throw new Error('Payment reference is required.')
    }

    const endpoint = `${this.apiUrl.replace(/\/+$/, '')}/collections`
    const payload: Record<string, unknown> = {
      amount: Math.round(request.amount),
      reference: request.reference,
      currency: request.currency || this.defaultCurrency,
    }

    if (request.description) payload.description = request.description
    if (request.customer_email) payload.customer_email = request.customer_email
    if (request.customer_name) payload.customer_name = request.customer_name
    if (request.customer_phone) payload.customer_phone = request.customer_phone
    if (request.callback_url) payload.callback_url = request.callback_url
    if (request.return_url) payload.return_url = request.return_url
    if (request.cancel_url) payload.cancel_url = request.cancel_url

    console.log(
      `[SebPay] Initiating collection for order: ${request.reference}, amount: ${payload.amount} ${payload.currency}`
    )

    let response: Response
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'X-Public-Key': this.publicKey,
          'X-Secret-Key': this.secretKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })
    } catch (networkError: unknown) {
      const err = networkError as Error
      console.error(
        `[SebPay] Network error while calling SebPay API: ${this.sanitize(err.message)}`
      )
      throw new Error('Unable to connect to SebPay payment gateway. Please try again.')
    }

    const responseText = await response.text()
    let data: SebPayCollectionResponse = {}
    try {
      data = JSON.parse(responseText)
    } catch {
      console.error(
        `[SebPay] Non-JSON response from SebPay: ${this.sanitize(responseText.substring(0, 300))}`
      )
      throw new Error(`SebPay API responded with an unexpected format (${response.status}).`)
    }

    if (!response.ok) {
      const errorMsg =
        data.message ||
        (typeof data.error === 'string' ? data.error : '') ||
        `HTTP status ${response.status}`
      console.error(
        `[SebPay] Collection creation failed (${response.status}): ${this.sanitize(errorMsg)}`
      )
      throw new Error(`SebPay payment initiation failed: ${this.sanitize(errorMsg)}`)
    }

    // Extract payment URL and identifiers from SebPay response
    const paymentUrl =
      data.payment_url ||
      data.checkout_url ||
      data.url ||
      data.data?.payment_url ||
      data.data?.checkout_url ||
      data.data?.url ||
      ''

    const transactionId =
      data.transaction_id ||
      data.id ||
      data.data?.transaction_id ||
      data.data?.id ||
      request.reference

    const reference =
      data.reference ||
      data.data?.reference ||
      request.reference

    return {
      paymentUrl,
      transactionId: String(transactionId),
      reference: String(reference),
      rawResponse: data as Record<string, unknown>,
    }
  }

  /**
   * Verifies the status of a transaction with SebPay.
   */
  async verifyTransaction(
    identifier: string
  ): Promise<{
    isPaid: boolean
    status: InternalPaymentStatus
    amount?: number
    currency?: string
    transactionId?: string
    rawStatus?: string
  }> {
    if (!this.isConfigured()) {
      throw new Error('SebPay production credentials are not configured.')
    }

    const endpoint = `${this.apiUrl.replace(/\/+$/, '')}/collections/${encodeURIComponent(identifier)}`

    console.log(`[SebPay] Verifying transaction status for: ${identifier}`)

    let response: Response
    try {
      response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'X-Public-Key': this.publicKey,
          'X-Secret-Key': this.secretKey,
          Accept: 'application/json',
        },
      })
    } catch (networkErr: unknown) {
      const err = networkErr as Error
      console.error(
        `[SebPay] Network error during verification: ${this.sanitize(err.message)}`
      )
      throw new Error('Failed to communicate with SebPay for transaction verification.')
    }

    if (!response.ok) {
      const errBody = await response.text()
      console.error(
        `[SebPay] Verification endpoint returned ${response.status}: ${this.sanitize(errBody)}`
      )
      // Return unverified/pending state rather than crashing, so polling continues safely
      return {
        isPaid: false,
        status: 'PENDING',
      }
    }

    const data: SebPayTransactionStatusResponse = await response.json()
    const rawStatus =
      data.status ||
      data.data?.status ||
      (data.paid ? 'COMPLETED' : 'PENDING')

    const mappedStatus = this.mapSebPayStatus(rawStatus)
    const isPaid = mappedStatus === 'PAID'
    const amount = data.amount ?? data.data?.amount
    const currency = data.currency ?? data.data?.currency
    const transactionId =
      data.transaction_id || data.id || data.data?.transaction_id || data.data?.id

    return {
      isPaid,
      status: mappedStatus,
      amount,
      currency,
      transactionId: transactionId ? String(transactionId) : undefined,
      rawStatus,
    }
  }

  /**
   * Maps SebPay API status strings to standard internal PaymentStatus.
   */
  public mapSebPayStatus(status?: string): InternalPaymentStatus {
    if (!status) return 'PENDING'
    const s = status.toUpperCase().trim()

    switch (s) {
      case 'SUCCESS':
      case 'SUCCESSFUL':
      case 'PAID':
      case 'COMPLETED':
      case 'SUCCEEDED':
        return 'PAID'

      case 'PENDING':
      case 'INITIATED':
      case 'IN_PROGRESS':
      case 'PROCESSING':
        return 'PROCESSING'

      case 'FAILED':
      case 'DECLINED':
      case 'REJECTED':
      case 'ERROR':
        return 'FAILED'

      case 'CANCELLED':
      case 'CANCELED':
        return 'CANCELLED'

      case 'EXPIRED':
        return 'EXPIRED'

      default:
        return 'PENDING'
    }
  }

  /**
   * Extracts and validates order info from an incoming SebPay webhook.
   */
  public parseWebhookPayload(payload: SebPayWebhookPayload): {
    orderId: string
    transactionId?: string
    status: InternalPaymentStatus
    amount?: number
    currency?: string
  } {
    const rawStatus =
      payload.status ||
      payload.data?.status ||
      payload.action ||
      payload.event ||
      'PENDING'

    const orderId =
      payload.reference ||
      payload.orderId ||
      payload.order_id ||
      payload.data?.reference ||
      payload.data?.orderId ||
      payload.data?.order_id ||
      ''

    const transactionId =
      payload.transaction_id ||
      payload.id ||
      payload.data?.transaction_id ||
      payload.data?.id

    const amount = payload.amount ?? payload.data?.amount
    const currency = payload.currency ?? payload.data?.currency

    return {
      orderId: String(orderId),
      transactionId: transactionId ? String(transactionId) : undefined,
      status: this.mapSebPayStatus(rawStatus),
      amount: typeof amount === 'number' ? amount : undefined,
      currency: typeof currency === 'string' ? currency : undefined,
    }
  }
}

export const sebpayService = new SebPayService()
