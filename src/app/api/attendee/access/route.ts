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
import { getAccessBlock, recordAccessFailure } from '@/lib/accessRateLimit'
import { getEventContext } from '@/lib/eventContext'
import config from '@/payload.config'

export async function POST(request: Request) {
  const key = requestKey(request)
  const body = (await request.json().catch(() => ({}))) as { code?: unknown }
  const code = typeof body.code === 'string' ? body.code : ''

  // Event id + access-code hash come from the shared cache (no DB round).
  const ctx = await getEventContext()

  // Happy path: a correct shared code. This is what the vast majority of
  // attendees submit, and it touches the database ZERO times — so a start-of-
  // event burst is absorbed by the cache instead of exhausting Supabase's
  // 15-client session pooler. Rate limiting only guards against wrong-code
  // guessing, so a valid code needs no rate-limit read/write.
  if (code && ctx?.accessCodeHash && verifyAccessCode(code, ctx.accessCodeHash)) {
    const expires = accessCodeExpiry(ctx.endsAt)
    const jar = await cookies()
    jar.set(ATTENDEE_COOKIE, createAccessCookie(ctx.eventID, expires), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires,
    })
    return NextResponse.json({ ok: true, expiresAt: expires.toISOString() })
  }

  // Failure path only (wrong/empty code): now do the DB-backed rate limiting.
  const payload = await getPayload({ config })
  const { retryAfter } = await getAccessBlock(payload, key)
  if (retryAfter) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  const blockedFor = await recordAccessFailure(payload, key)
  return NextResponse.json(
    { error: blockedFor ? 'Too many attempts. Please try again later.' : 'That code is not valid.' },
    {
      status: blockedFor ? 429 : 401,
      headers: blockedFor ? { 'Retry-After': String(blockedFor) } : undefined,
    },
  )
}

export async function DELETE() {
  const jar = await cookies()
  jar.set(ATTENDEE_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) })
  return NextResponse.json({ ok: true })
}
