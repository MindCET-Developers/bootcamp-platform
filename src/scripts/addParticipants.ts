import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../payload.config'

// Never trigger Payload's development schema-push flow when running a script.
process.env.PAYLOAD_MIGRATING = 'true'

// Staff-managed participants to add to the active event's directory. Everyone
// here is also a speaker, so their details are copied from their Speakers
// record instead of being repeated: name, role, organization, bio -> about,
// contactURL and tags. `speaker` is matched case-insensitively against speaker
// names and must resolve to exactly one speaker.
//
// `role` and `organization` override what the speaker record says: a speaker
// record holds the role at the event ("Host", "Facilitator") and the umbrella
// org, while the directory shows the job title and the specific team.
//
// `seededAs` is the name a previous run wrote to the participants table. It
// lets this script recognise its own earlier row when the speaker's full name
// differs, so re-running renames that row instead of creating a duplicate.
const PEOPLE: Array<{
  speaker: string
  role?: string
  organization?: string
  seededAs?: string
}> = [
  {
    speaker: 'Ilan Ben Yaakov',
    role: 'VP Learning Experience',
    organization: 'MindCET Labs',
    seededAs: 'Ilan Michalby',
  },
  { speaker: 'Avi Warshavsky', seededAs: 'Avi' },
  { speaker: 'Erella Moshe', role: 'EdTech Campus Manager', seededAs: 'Arella' },
]

// Pass --dry-run to print what each entry resolves to without writing.
const dryRun = process.argv.includes('--dry-run')

const asID = (value: unknown): number | null =>
  typeof value === 'object' && value
    ? ((value as { id: number }).id ?? null)
    : ((value as number) ?? null)

const run = async () => {
  const payload = await getPayload({ config })

  // Resolve the same event the attendee app reads: app-settings.activeEvent,
  // falling back to the single active event.
  const settings = await payload.findGlobal({ slug: 'app-settings', depth: 0 })
  let eventID = asID(settings.activeEvent)

  if (!eventID) {
    const fallback = await payload.find({
      collection: 'events',
      limit: 1,
      overrideAccess: true,
      where: { eventState: { equals: 'active' } },
    })
    eventID = fallback.docs[0]?.id ?? null
  }

  if (!eventID) {
    console.error('No active event found — set one in the admin before adding participants.')
    process.exit(1)
  }

  const speakers = await payload.find({
    collection: 'speakers',
    limit: 500,
    overrideAccess: true,
    depth: 0,
  })

  // Resolve every speaker before writing anything, so an ambiguous match never
  // leaves the directory half updated.
  const resolved = PEOPLE.map((person) => {
    const needle = person.speaker.toLowerCase()
    const matches = speakers.docs.filter((speaker) => speaker.name.toLowerCase().includes(needle))
    return { person, matches }
  })

  const ambiguous = resolved.filter(({ matches }) => matches.length !== 1)
  if (ambiguous.length) {
    for (const { person, matches } of ambiguous) {
      const found = matches.length ? matches.map((s) => `"${s.name}"`).join(', ') : 'nothing'
      console.error(`"${person.speaker}" matched ${found} — use a more specific string.`)
    }
    console.error(`Speakers on file: ${speakers.docs.map((s) => s.name).join(', ')}`)
    process.exit(1)
  }

  for (const { person, matches } of resolved) {
    const speaker = matches[0]!
    const data = {
      event: eventID,
      name: speaker.name,
      // Empty strings rather than nulls: role, organization and about are still
      // NOT NULL until the optional_participant_details migration runs, and both
      // render as "absent" in the directory card either way.
      role: person.role || speaker.role || '',
      organization: person.organization || speaker.organization || '',
      about: speaker.bio || '',
      tags: (speaker.tags || []).map((tag) => ({ label: tag.label })),
      contactURL: speaker.contactURL || '',
      status: 'approved' as const,
      source: 'staff' as const,
    }

    if (dryRun) {
      payload.logger.info(
        `${data.name} — ${data.role || '(no role)'} · ${data.organization || '(no org)'} — ${
          data.about ? `${data.about.slice(0, 70)}…` : '(no bio)'
        }`,
      )
      continue
    }

    const names = [speaker.name, ...(person.seededAs ? [person.seededAs] : [])]
    const existing = await payload.find({
      collection: 'participants',
      limit: 1,
      overrideAccess: true,
      where: {
        and: [{ event: { equals: eventID } }, { name: { in: names } }],
      },
    })

    // Log the stored document rather than the input, so the output is proof of
    // what the directory will actually show.
    const stored = existing.docs[0]
      ? await payload.update({
          collection: 'participants',
          id: existing.docs[0].id,
          overrideAccess: true,
          data,
        })
      : await payload.create({ collection: 'participants', overrideAccess: true, data })

    payload.logger.info(
      `${existing.docs[0] ? 'Updated' : 'Added'} "${stored.name}" — ${stored.role || '(no role)'} · ${
        stored.organization || '(no org)'
      } · ${stored.about ? 'bio set' : 'no bio'} · status ${stored.status}`,
    )
  }

  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
