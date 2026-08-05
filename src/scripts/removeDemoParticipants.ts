import 'dotenv/config'

import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'

import config from '../payload.config'

// Never trigger Payload's development schema-push flow when running a script.
process.env.PAYLOAD_MIGRATING = 'true'

// Removes the placeholder directory profiles that `pnpm seed` used to copy out
// of the prototype's `people` array (invented founders, fake startups, fake
// contact domains). The names come from that same prototype file, so this can
// only ever delete demo rows — a real participant whose name is not in the
// prototype is never touched.
//
// The prototype's `speakers` are real people and are left alone.

// Pass --dry-run to list what would be deleted without deleting it.
const dryRun = process.argv.includes('--dry-run')

// Same extraction as src/seed.ts: the prototype is a single HTML file holding a
// `const DATA = {...}` literal.
const demoNames = (): string[] => {
  const file = path.resolve(process.cwd(), '../bootcamp-app.html')
  const html = fs.readFileSync(file, 'utf8')
  const match = html.match(/const DATA=(\{[\s\S]*?\n\});\nDATA\.days/)

  if (!match?.[1]) throw new Error(`Could not read prototype data from ${file}`)

  const data = new Function(`return (${match[1]})`)() as { people: Array<{ name: string }> }
  return data.people.map((person) => person.name)
}

const asID = (value: unknown): number | null =>
  typeof value === 'object' && value
    ? ((value as { id: number }).id ?? null)
    : ((value as number) ?? null)

const run = async () => {
  const names = demoNames()
  const payload = await getPayload({ config })

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
    console.error('No active event found.')
    process.exit(1)
  }

  const doomed = await payload.find({
    collection: 'participants',
    limit: 500,
    overrideAccess: true,
    depth: 0,
    where: {
      and: [{ event: { equals: eventID } }, { name: { in: names } }],
    },
  })

  if (!doomed.docs.length) {
    payload.logger.info('No demo participants left to remove.')
    process.exit(0)
  }

  for (const person of doomed.docs) {
    if (dryRun) {
      payload.logger.info(`Would delete "${person.name}" (${person.role} · ${person.organization})`)
      continue
    }

    await payload.delete({ collection: 'participants', id: person.id, overrideAccess: true })
    payload.logger.info(`Deleted "${person.name}"`)
  }

  const remaining = await payload.find({
    collection: 'participants',
    limit: 0,
    overrideAccess: true,
    where: { event: { equals: eventID } },
  })
  payload.logger.info(
    `${dryRun ? 'Would leave' : 'Directory now holds'} ${
      dryRun ? remaining.totalDocs - doomed.docs.length : remaining.totalDocs
    } participants`,
  )
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
