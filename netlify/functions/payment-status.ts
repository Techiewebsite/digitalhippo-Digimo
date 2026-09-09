/**
 * Netlify Function: payment-status
 *
 * Delegates to unified paymentController.
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
      },
      body: '',
    }
  }

  const orderId = event.queryStringParameters?.orderId

  if (!orderId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'orderId is required' }),
    }
  }

  try {
    const result = await paymentController.getPaymentStatus(orderId)
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
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Failed to check payment status' }),
    }
  }
}
