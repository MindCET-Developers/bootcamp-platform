import { NextResponse } from 'next/server'

import { accessCodeExpiry, ATTENDEE_COOKIE, createAccessCookie, verifyMagicLinkToken } from '@/lib/attendeeAccess'
import { getEventContext } from '@/lib/eventContext'

export const dynamic = 'force-dynamic'

// GET /join?t=<magic-link-token>
// Grants event access without the shared code (for QR distribution at the event),
// sets the signed attendee cookie, then redirects to the app. The active event
// is read from the shared cache, so QR scans add no per-request DB load.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('t') || ''
  const home = new URL('/', url.origin)

  if (!token || !verifyMagicLinkToken(token)) {
    return NextResponse.redirect(home)
  }

  const ctx = await getEventContext()
  if (!ctx) {
    return NextResponse.redirect(home)
  }

  const expires = accessCodeExpiry(ctx.endsAt)
  const response = NextResponse.redirect(home)
  response.cookies.set(ATTENDEE_COOKIE, createAccessCookie(ctx.eventID, expires), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  })
  return response
}
