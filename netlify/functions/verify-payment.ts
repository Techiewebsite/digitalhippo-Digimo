/**
 * Netlify Function: verify-payment (Forwarding to verify-sebpay-payment)
 */

import { handler as verifySebPayHandler } from './verify-sebpay-payment'

export const handler = verifySebPayHandler
