import { NextRequest, NextResponse } from 'next/server'
import { paymentController } from '../../../../netlify/functions/services/paymentController'

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId')
  const productId = req.nextUrl.searchParams.get('productId')
  const userId = req.nextUrl.searchParams.get('userId') || undefined
  const userEmail = req.nextUrl.searchParams.get('userEmail') || undefined

  if (!orderId || !productId) {
    return NextResponse.json(
      { error: 'orderId and productId are required' },
      { status: 400 }
    )
  }

  try {
    const result = await paymentController.authorizeDownload({
      orderId,
      productId,
      userId,
      userEmail,
    })

    if (result.statusCode !== 200) {
      return NextResponse.json(result.body, { status: result.statusCode })
    }

    const acceptHeader = req.headers.get('accept') || ''
    // If browser clicked direct link, redirect straight to the authorized stream URL
    if (acceptHeader.includes('text/html') || !acceptHeader.includes('application/json')) {
      const downloadUrl = result.body.downloadUrl as string
      return NextResponse.redirect(new URL(downloadUrl, req.url))
    }

    return NextResponse.json(result.body, { status: 200 })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json(
      { error: error.message || 'Download authorization failed' },
      { status: 500 }
    )
  }
}
