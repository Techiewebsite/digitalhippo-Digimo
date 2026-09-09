import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req

  // Appwrite or app session cookie check
  const hasSession =
    cookies.getAll().some((c) => c.name.startsWith('a_session_') || c.name === 'appwrite-session')

  if (
    hasSession &&
    ['/sign-in', '/sign-up'].includes(nextUrl.pathname)
  ) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}
