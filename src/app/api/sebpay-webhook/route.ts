import { NextRequest, NextResponse } from 'next/server'
import { paymentController } from '../../../../netlify/functions/services/paymentController'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const headers: Record<string, string | undefined> = {}
    req.headers.forEach((value, key) => {
      headers[key] = value
    })

    const result = await paymentController.handleWebhook({
      rawBody,
      headers,
    })

    return NextResponse.json(result.body, { status: result.statusCode })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 400 }
    )
  }
}
