import Link from 'next/link'
import { cookies } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { ATTENDEE_COOKIE, verifyAccessCookie } from '@/lib/attendeeAccess'
import config from '@/payload.config'

import { AccessGate } from './AccessGate'
import { BootcampApp, type BootcampAppData } from './BootcampApp'
import './styles.css'

// The page stays dynamic (it reads the per-request access cookie), but the
// event data itself is loaded through the Data Cache so the database is queried
// at most once per revalidation window regardless of traffic. This keeps a
// crowd of attendees loading the app from exhausting Supabase's pooled
// connections (session mode is capped at 15 clients).
export const dynamic = 'force-dynamic'

// Seconds the cached event payload is served before the DB is queried again.
// Event content is set up ahead of time, so a short staleness window is fine;
// edits in the admin appear within this window.
const APP_DATA_TTL = 60

const asID = (value: number | { id: number } | null | undefined) =>
  typeof value === 'object' && value ? value.id : value

// Builds the full BootcampAppData (or null when there is no active event).
// Wrapped in unstable_cache below so concurrent requests share one DB round.
const buildAppData = async (): Promise<BootcampAppData | null> => {
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

  if (!event) return null

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
            photo:
              speaker.photo && typeof speaker.photo === 'object' ? speaker.photo.url || '' : '',
          }
        }),
    })),
    participants: participantsResult.docs.map((person) => ({
      id: person.id,
      name: person.name,
      role: person.role || '',
      organization: person.organization || '',
      about: person.about || '',
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

  return data
}

// Cached view over buildAppData: one shared DB round per APP_DATA_TTL window,
// serving every concurrent request from the Data Cache in between.
const loadAppData = unstable_cache(buildAppData, ['bootcamp-app-data'], {
  revalidate: APP_DATA_TTL,
  tags: ['app-data'],
})

export default async function HomePage() {
  const data = await loadAppData()

  if (!data) {
    return (
      <main className="empty-state">
        <span>NO ACTIVE EVENT</span>
        <h1>Choose an active event in Payload.</h1>
        <Link href="/admin/globals/app-settings">Open app settings</Link>
      </main>
    )
  }

  const access = verifyAccessCookie((await cookies()).get(ATTENDEE_COOKIE)?.value)
  if (!access || access.eventID !== data.event.id) {
    return <AccessGate city={data.event.city} eventName={data.event.name} />
  }

  return <BootcampApp data={data} />
}
