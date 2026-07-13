import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { requireEventAccess } from '@/lib/attendeeAccess'
import config from '@/payload.config'

export async function POST(request: Request) {
  const access = requireEventAccess(request)
  if (!access) return NextResponse.json({ error: 'Event access required.' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const sessionID = Number(body.session)
  const rating = Number(body.rating)
  const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 2000) : ''
  if (!Number.isInteger(sessionID) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'A valid session and rating are required.' }, { status: 400 })
  }
  const payload = await getPayload({ config })
  const session = await payload
    .findByID({ collection: 'sessions', id: sessionID, overrideAccess: true, depth: 0 })
    .catch(() => null)
  const eventID = typeof session?.event === 'object' ? session.event.id : session?.event
  if (!session || eventID !== access.eventID) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
  }
  const feedback = await payload.create({
    collection: 'feedback', overrideAccess: true,
    data: { session: sessionID, rating, comment: comment || undefined },
  })
  return NextResponse.json({ id: feedback.id, ok: true }, { status: 201 })
}
