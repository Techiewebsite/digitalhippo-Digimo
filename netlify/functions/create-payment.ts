/**
 * Netlify Function: create-payment (Forwarding to create-sebpay-payment)
 */

import { handler as createSebPayHandler } from './create-sebpay-payment'

export const handler = createSebPayHandler
