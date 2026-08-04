import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import config from '@/payload.config'

export type EventContext = {
  eventID: number
  accessCodeHash: string
  endsAt: string | null
  city: string
  name: string
}

const load = async (): Promise<EventContext | null> => {
  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({ slug: 'app-settings', overrideAccess: true, depth: 0 })
  const raw = settings.activeEvent
  const eventID =
    typeof raw === 'object' && raw ? Number((raw as { id: number }).id) : Number(raw)
  if (!Number.isInteger(eventID)) return null

  const event = await payload
    .findByID({ collection: 'events', id: eventID, overrideAccess: true })
    .catch(() => null)
  if (!event) return null

  return {
    eventID,
    accessCodeHash: settings.accessCodeHash || '',
    endsAt: event.endsAt ?? null,
    city: event.city,
    name: event.name,
  }
}

// Active event + access-code hash, shared by the home page gate, the /join
// magic link, and the access-code endpoint. Cached so a burst of attendees
// entering at the start of the event does not run this query per request
// (Supabase's session pooler caps concurrent clients at 15). Content is set up
// ahead of time, so a short staleness window is acceptable.
export const getEventContext = unstable_cache(load, ['event-context'], {
  revalidate: 30,
  tags: ['app-data'],
})
