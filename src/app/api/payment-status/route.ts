import { NextRequest, NextResponse } from 'next/server'
import { appwriteServer } from '../../../../netlify/functions/services/appwriteServer'

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId')
  const requestedUserId = req.nextUrl.searchParams.get('userId')

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  }

  try {
    const order = await appwriteServer.getOrder(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (requestedUserId && order.userId && order.userId !== requestedUserId) {
      return NextResponse.json(
        { error: 'Access denied: Order belongs to another account.' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      orderId: order.id,
      isPaid: order._isPaid,
      status: order.paymentStatus || (order._isPaid ? 'PAID' : 'PENDING'),
      paymentProvider: order.paymentProvider || 'sebpay',
      amount: order.amount,
      currency: order.currency,
      paidAt: order.paidAt,
      updatedAt: order.updatedAt,
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json(
      { error: error.message || 'Failed to check payment status' },
      { status: 500 }
    )
  }
}
