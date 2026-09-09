import { NextRequest, NextResponse } from 'next/server'
import { paymentController } from '../../../../netlify/functions/services/paymentController'

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId')
  const userId = req.nextUrl.searchParams.get('userId') || undefined

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  }

  try {
    const result = await paymentController.verifyPayment({ orderId, userId })
    return NextResponse.json(result.body, { status: result.statusCode })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    )
  }
}
