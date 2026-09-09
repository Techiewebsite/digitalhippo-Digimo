/**
 * Netlify Function: sebpay-webhook
 *
 * ASYNCHRONOUS SEBPAY WEBHOOK / CALLBACK NOTIFICATION
 * Delegates to unified paymentController:
 * 1. NEVER trusts unverified payload status.
 * 2. Triggers direct server-side verification against SebPay API.
 * 3. Enforces amount, currency, and reference match before any fulfillment.
 * 4. Idempotent: safe against duplicate deliveries.
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Signature, X-Public-Key',
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
    const result = await paymentController.handleWebhook({
      rawBody: event.body,
      headers: event.headers,
    })

    return {
      statusCode: result.statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.body),
    }
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[sebpay-webhook] Error processing webhook: ${err.message}`)
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Webhook processing encountered an error.' }),
    }
  }
}
