import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import {
  accessCodeExpiry,
  ATTENDEE_COOKIE,
  createAccessCookie,
  verifyMagicLinkToken,
} from '@/lib/attendeeAccess'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

const activeEventID = (value: unknown) =>
  typeof value === 'object' && value && 'id' in value ? Number(value.id) : Number(value)

// GET /join?t=<magic-link-token>
// Grants event access without the shared code (for QR distribution at the event),
// sets the signed attendee cookie, then redirects to the app.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('t') || ''
  const home = new URL('/', url.origin)

  if (!token || !verifyMagicLinkToken(token)) {
    return NextResponse.redirect(home)
  }

  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({ slug: 'app-settings', overrideAccess: true, depth: 0 })
  const eventID = activeEventID(settings.activeEvent)

  if (!Number.isInteger(eventID)) {
    return NextResponse.redirect(home)
  }

  const event = await payload.findByID({ collection: 'events', id: eventID, overrideAccess: true })
  const expires = accessCodeExpiry(event.endsAt)

  const response = NextResponse.redirect(home)
  response.cookies.set(ATTENDEE_COOKIE, createAccessCookie(eventID, expires), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  })
  return response
}
