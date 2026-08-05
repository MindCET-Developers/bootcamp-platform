import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import {
  createProfileToken,
  hashProfileToken,
  requireEventAccess,
  verifyProfileToken,
} from '@/lib/attendeeAccess'
import config from '@/payload.config'
import type { Participant } from '@/payload-types'

type ProfileInput = {
  participantId?: unknown
  editToken?: unknown
  name?: unknown
  role?: unknown
  organization?: unknown
  about?: unknown
  tags?: unknown
  contactURL?: unknown
}

const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const parseProfile = (body: ProfileInput) => ({
  name: text(body.name, 100),
  role: text(body.role, 120),
  organization: text(body.organization, 120),
  about: text(body.about, 1000),
  tags: Array.isArray(body.tags)
    ? body.tags.slice(0, 10).map((item) => text(item, 40)).filter(Boolean).map((label) => ({ label }))
    : [],
  contactURL: text(body.contactURL, 300),
})

const publicProfile = (profile: Participant) => ({
  participantId: profile.id,
  name: profile.name,
  role: profile.role || '',
  organization: profile.organization || '',
  about: profile.about || '',
  tags: (profile.tags || []).map((tag: { label: string }) => tag.label),
  contactURL: profile.contactURL || '',
  status: profile.status,
})

const credentials = (body: ProfileInput) => ({
  id: Number(body.participantId),
  token: typeof body.editToken === 'string' ? body.editToken : '',
})

const ownedProfile = async (body: ProfileInput, eventID: number) => {
  const { id, token } = credentials(body)
  if (!Number.isInteger(id) || !token) return null
  const payload = await getPayload({ config })
  const profile = await payload
    .findByID({ collection: 'participants', id, overrideAccess: true, depth: 0 })
    .catch(() => null)
  const profileEvent = typeof profile?.event === 'object' ? profile.event.id : profile?.event
  if (!profile || profileEvent !== eventID || !profile.editTokenHash) return null
  return verifyProfileToken(token, profile.editTokenHash) ? { payload, profile } : null
}

export async function GET(request: Request) {
  const access = requireEventAccess(request)
  if (!access) return NextResponse.json({ error: 'Event access required.' }, { status: 401 })
  const url = new URL(request.url)
  const owned = await ownedProfile(
    { participantId: url.searchParams.get('participantId'), editToken: url.searchParams.get('editToken') },
    access.eventID,
  )
  if (!owned) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
  return NextResponse.json(publicProfile(owned.profile))
}

export async function POST(request: Request) {
  const access = requireEventAccess(request)
  if (!access) return NextResponse.json({ error: 'Event access required.' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as ProfileInput
  const profile = parseProfile(body)
  // Only the name is required — the rest of the profile can be filled in later.
  if (!profile.name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }
  const token = createProfileToken()
  const payload = await getPayload({ config })
  const created = await payload.create({
    collection: 'participants',
    overrideAccess: true,
    data: {
      ...profile,
      event: access.eventID,
      status: 'pending',
      source: 'attendee',
      editTokenHash: hashProfileToken(token),
    },
  })
  return NextResponse.json({ ...publicProfile(created), editToken: token }, { status: 201 })
}

export async function PUT(request: Request) {
  const access = requireEventAccess(request)
  if (!access) return NextResponse.json({ error: 'Event access required.' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as ProfileInput
  const owned = await ownedProfile(body, access.eventID)
  if (!owned) return NextResponse.json({ error: 'Invalid profile token.' }, { status: 403 })
  const profile = parseProfile(body)
  // Only the name is required — the rest of the profile can be filled in later.
  if (!profile.name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }
  const updated = await owned.payload.update({
    collection: 'participants', id: owned.profile.id, overrideAccess: true,
    data: { ...profile, status: 'pending' },
  })
  return NextResponse.json(publicProfile(updated))
}

export async function DELETE(request: Request) {
  const access = requireEventAccess(request)
  if (!access) return NextResponse.json({ error: 'Event access required.' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as ProfileInput
  const owned = await ownedProfile(body, access.eventID)
  if (!owned) return NextResponse.json({ error: 'Invalid profile token.' }, { status: 403 })
  await owned.payload.delete({ collection: 'participants', id: owned.profile.id, overrideAccess: true })
  return NextResponse.json({ ok: true })
}
