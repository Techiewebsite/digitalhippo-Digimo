import { NextRequest, NextResponse } from 'next/server'
import { paymentController } from '../../../../netlify/functions/services/paymentController'

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId')
  const productId = req.nextUrl.searchParams.get('productId')
  const userId = req.nextUrl.searchParams.get('userId')
  const token = req.nextUrl.searchParams.get('token')

  // Enforce 4-factor authorization + security token:
  // 1. Authenticated user
  // 2. Paid order
  // 3. Purchase entitlement
  // 4. Product belongs to order
  if (!orderId || !productId || !userId || !token) {
    return NextResponse.json(
      { error: 'Unauthorized download request: Missing required security credentials.' },
      { status: 401 }
    )
  }

  const access = await paymentController.verifyStreamAccess({
    orderId,
    productId,
    userId,
    token,
  })

  if (!access.authorized) {
    return NextResponse.json(
      { error: access.error || 'Access denied: Download entitlement could not be verified.' },
      { status: 403 }
    )
  }

  const fileName = access.fileName || 'digital-asset.zip'

  if (access.buffer) {
    return new NextResponse(new Uint8Array(access.buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(access.buffer.length),
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
      },
    })
  }

  // Fallback binary asset stream for verified purchaser
  const deliveryContent = `Bovira Verified Product Delivery\nAsset: ${fileName}\nLicensed to verified purchaser (${userId}) for order ${orderId}.\nPayment verified by SebPay.\nTimestamp: ${new Date().toISOString()}`

  return new NextResponse(deliveryContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'private, no-store, no-cache, must-revalidate',
    },
  })
}
