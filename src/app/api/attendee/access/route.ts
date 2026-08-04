import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import {
  accessCodeExpiry,
  ATTENDEE_COOKIE,
  createAccessCookie,
  requestKey,
  verifyAccessCode,
} from '@/lib/attendeeAccess'
import { clearAccessFailures, getAccessBlock, recordAccessFailure } from '@/lib/accessRateLimit'
import { getEventContext } from '@/lib/eventContext'
import config from '@/payload.config'

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const key = requestKey(request)
  const { retryAfter, hasRecord } = await getAccessBlock(payload, key)
  if (retryAfter) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  const body = (await request.json().catch(() => ({}))) as { code?: unknown }
  const code = typeof body.code === 'string' ? body.code : ''
  // Cached (event id + access-code hash) — avoids a DB read on every attempt.
  const ctx = await getEventContext()

  if (!code || !ctx?.accessCodeHash || !verifyAccessCode(code, ctx.accessCodeHash)) {
    const blockedFor = await recordAccessFailure(payload, key)
    return NextResponse.json(
      { error: blockedFor ? 'Too many attempts. Please try again later.' : 'That code is not valid.' },
      {
        status: blockedFor ? 429 : 401,
        headers: blockedFor ? { 'Retry-After': String(blockedFor) } : undefined,
      },
    )
  }

  const expires = accessCodeExpiry(ctx.endsAt)
  const jar = await cookies()
  jar.set(ATTENDEE_COOKIE, createAccessCookie(ctx.eventID, expires), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  })
  // Only touch the DB to clear when there was actually a failure record.
  if (hasRecord) await clearAccessFailures(payload, key)
  return NextResponse.json({ ok: true, expiresAt: expires.toISOString() })
}

export async function DELETE() {
  const jar = await cookies()
  jar.set(ATTENDEE_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) })
  return NextResponse.json({ ok: true })
}
