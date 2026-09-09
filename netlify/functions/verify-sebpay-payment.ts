/**
 * Netlify Function: verify-sebpay-payment
 *
 * SECURE PRODUCTION PAYMENT VERIFICATION
 * Delegates to unified paymentController:
 * 1. Independent inquiry against SebPay API.
 * 2. 5-point verification (transaction = order = customer = amount = currency = reference).
 * 3. Enforces valid state machine (PAID state cannot be regressed).
 * 4. Fulfills digital product access idempotently with failure recovery.
 */

import { paymentController } from './services/paymentController'

export const handler = async (event: {
  httpMethod: string
  queryStringParameters?: Record<string, string | undefined>
  headers: Record<string, string | undefined>
}) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    }
  }

  try {
    const orderId = event.queryStringParameters?.orderId
    const userId = event.queryStringParameters?.userId

    if (!orderId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required query parameter: orderId' }),
      }
    }

    const result = await paymentController.verifyPayment({ orderId, userId })

    return {
      statusCode: result.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result.body),
    }
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[verify-sebpay-payment] Error: ${err.message}`)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Payment verification failed' }),
    }
  }
}
