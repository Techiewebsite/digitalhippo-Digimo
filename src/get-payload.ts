import dotenv from 'dotenv'
import path from 'path'
import type { InitOptions } from 'payload/config'
import payload, { Payload } from 'payload'
import nodemailer from 'nodemailer'

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
})

const getEmailConfig = () => {
  if (!process.env.RESEND_API_KEY) return undefined

  const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    secure: true,
    port: 465,
    auth: {
      user: 'resend',
      pass: process.env.RESEND_API_KEY,
    },
  })

  return {
    transport: transporter,
    fromAddress: 'hello@joshtriedcoding.com',
    fromName: 'DigitalHippo',
  }
}

let cached = (global as any).payload

if (!cached) {
  cached = (global as any).payload = {
    client: null,
    promise: null,
  }
}

interface Args {
  initOptions?: Partial<InitOptions>
}

export const getPayloadClient = async ({
  initOptions,
}: Args = {}): Promise<Payload> => {
  const secret =
    process.env.PAYLOAD_SECRET || 'digitalhippo-secret-key-fallback'

  if (cached.client) {
    return cached.client
  }

  if (!cached.promise) {
    const email = getEmailConfig()

    cached.promise = payload.init({
      ...(email ? { email } : {}),
      secret,
      local: initOptions?.express ? false : true,
      ...(initOptions || {}),
    })
  }

  try {
    cached.client = await cached.promise
  } catch (e: unknown) {
    cached.promise = null
    throw e
  }

  return cached.client
}
