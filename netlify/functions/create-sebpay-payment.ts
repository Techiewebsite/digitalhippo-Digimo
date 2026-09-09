/**
 * Netlify Function: create-sebpay-payment
 *
 * SECURE PRODUCTION PAYMENT INITIATION
 * Delegates to unified paymentController:
 * 1. Customer cannot dictate or manipulate amount; calculated strictly on server in XOF.
 * 2. Authenticates order and customer.
 * 3. Checks for duplicate payments or already-paid status.
 * 4. Calls SebPay Production Collections API with required X-Public-Key & X-Secret-Key headers.
 * 5. Returns checkout payment URL to frontend.
 */

import { paymentController } from './services/paymentController'

export const handler = async (event: {
  httpMethod: string
  body: string | null
  headers: Record<string, string | undefined>
}) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    }
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {}
    const result = await paymentController.createPayment({
      orderId: body.orderId,
      productIds: body.productIds,
      userId: body.userId,
      userEmail: body.userEmail,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      origin: body.origin,
      hostHeader: event.headers.host || event.headers['x-forwarded-host'],
    })

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
    console.error(`[create-sebpay-payment] Error: ${err.message}`)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || "We couldn't start your payment. Please try again." }),
    }
  }
}
