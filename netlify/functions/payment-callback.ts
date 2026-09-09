/**
 * Netlify Function: payment-callback (Forwarding to sebpay-webhook)
 */

import { handler as sebpayWebhookHandler } from './sebpay-webhook'

export const handler = sebpayWebhookHandler
