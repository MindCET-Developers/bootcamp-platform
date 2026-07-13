import Link from 'next/link'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'

import { ATTENDEE_COOKIE, verifyAccessCookie } from '@/lib/attendeeAccess'
import config from '@/payload.config'

import { AccessGate } from './AccessGate'
import { BootcampApp, type BootcampAppData } from './BootcampApp'
import './styles.css'

export const dynamic = 'force-dynamic'

const asID = (value: number | { id: number } | null | undefined) =>
  typeof value === 'object' && value ? value.id : value

export default async function HomePage() {
  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({ slug: 'app-settings', depth: 1 })

  let event = typeof settings.activeEvent === 'object' ? settings.activeEvent : null
  const activeEventID = asID(settings.activeEvent)

  if (!event && activeEventID) {
    event = await payload.findByID({ collection: 'events', id: activeEventID, depth: 0 })
  }

  if (!event) {
    const fallback = await payload.find({
      collection: 'events',
      limit: 1,
      where: { eventState: { equals: 'active' } },
    })
    event = fallback.docs[0] || null
  }

  const access = verifyAccessCookie((await cookies()).get(ATTENDEE_COOKIE)?.value)
  if (!access || access.eventID !== event.id) {
    return <AccessGate city={event.city} eventName={event.name} />
  }

  if (!event) {
    return (
      <main className="empty-state">
        <span>NO ACTIVE EVENT</span>
        <h1>Choose an active event in Payload.</h1>
        <Link href="/admin/globals/app-settings">Open app settings</Link>
      </main>
    )
  }

  const [daysResult, sessionsResult, participantsResult, announcementsResult] = await Promise.all([
    payload.find({
      collection: 'event-days',
      limit: 100,
      sort: 'date',
      where: { event: { equals: event.id } },
    }),
    payload.find({
      collection: 'sessions',
      depth: 2,
      limit: 200,
      sort: 'startsAt',
      where: { event: { equals: event.id } },
    }),
    payload.find({
      collection: 'participants',
      limit: 200,
      sort: 'name',
      where: {
        and: [{ event: { equals: event.id } }, { status: { equals: 'approved' } }],
      },
    }),
    payload.find({
      collection: 'announcements',
      limit: 20,
      sort: '-createdAt',
      where: {
        and: [{ event: { equals: event.id } }, { published: { equals: true } }],
      },
    }),
  ])

  const data: BootcampAppData = {
    event: {
      id: event.id,
      name: event.name,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      city: event.city,
      venue: event.venue,
      timezone: event.timezone,
      eyebrow: event.hero?.eyebrow || 'Seoul · August 2026',
      headline: event.hero?.headline || event.name,
      partnerLine: event.hero?.partnerLine || '',
    },
    days: daysResult.docs.map((day) => ({
      id: day.id,
      label: day.label,
      title: day.title,
      date: day.date,
      summary: day.summary || '',
    })),
    sessions: sessionsResult.docs.map((session) => ({
      id: session.id,
      dayID: asID(session.day) || 0,
      title: session.title,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      type: session.type,
      location: session.location,
      description: session.description,
      state: session.sessionState,
      speakers: (session.speakers || [])
        .filter((speaker) => typeof speaker === 'object')
        .map((speaker) => {
          if (typeof speaker !== 'object') throw new Error('Expected populated speaker')
          return {
            id: speaker.id,
            name: speaker.name,
            role: speaker.role,
            organization: speaker.organization || '',
            bio: speaker.bio,
          }
        }),
    })),
    participants: participantsResult.docs.map((person) => ({
      id: person.id,
      name: person.name,
      role: person.role,
      organization: person.organization,
      about: person.about,
      tags: (person.tags || []).map((tag) => tag.label),
      contactURL: person.contactURL || '',
    })),
    announcements: announcementsResult.docs.map((item) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      priority: item.priority,
    })),
    features: {
      directory: settings.directoryEnabled !== false,
      feedback: settings.feedbackEnabled !== false,
    },
  }

  return <BootcampApp data={data} />
}
