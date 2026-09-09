import { NextRequest, NextResponse } from 'next/server'
import { paymentController } from '../../../../netlify/functions/services/paymentController'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const origin = req.headers.get('origin') || req.nextUrl.origin
    const hostHeader = req.headers.get('host') || undefined

    const result = await paymentController.createPayment({
      orderId: body.orderId,
      productIds: body.productIds,
      userId: body.userId,
      userEmail: body.userEmail,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      origin,
      hostHeader,
    })

    return NextResponse.json(result.body, { status: result.statusCode })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json(
      { error: error.message || 'Payment initiation failed' },
      { status: 500 }
    )
  }
}
