import 'dotenv/config'

import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'

import config from './payload.config'

type PrototypeSpeaker = {
  id: string
  name: string
  role: string
  bio: string
}

type PrototypeSession = [
  time: string,
  title: string,
  type: string,
  location: string,
  speakers: string[],
  description: string,
]

type PrototypeData = {
  speakers: PrototypeSpeaker[]
  days: Array<{
    date: string
    label: string
    title: string
    sessions: PrototypeSession[]
  }>
  people: Array<{
    id: string
    name: string
    role: string
    startup: string
    about: string
    tags: string[]
    contact: string
  }>
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const atSeoulTime = (date: string, time: string) => `${date}T${time}:00+09:00`

const readPrototype = (): PrototypeData => {
  const file = path.resolve(process.cwd(), '../bootcamp-app.html')
  const html = fs.readFileSync(file, 'utf8')
  const match = html.match(/const DATA=(\{[\s\S]*?\n\});\nDATA\.days/)

  if (!match?.[1]) throw new Error(`Could not read prototype data from ${file}`)

  return new Function(`return (${match[1]})`)() as PrototypeData
}

const findOne = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: string,
  field: string,
  value: string,
): Promise<any> => {
  const result = await payload.find({
    collection: collection as any,
    limit: 1,
    overrideAccess: true,
    where: { [field]: { equals: value } },
  } as any)

  return result.docs[0]
}

const run = async () => {
  const payload = await getPayload({ config })
  const data = readPrototype()

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@mindcet.local'
  if (!(await findOne(payload, 'users', 'email', email))) {
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        email,
        password: process.env.SEED_ADMIN_PASSWORD || 'change-me-now',
        name: 'MindCET Admin',
        role: 'admin',
      },
    })
  }

  let event = await findOne(payload, 'events', 'slug', 'mindcet-korea-2026')
  if (!event) {
    event = await payload.create({
      collection: 'events',
      overrideAccess: true,
      data: {
        name: 'MindCET Korea Bootcamp',
        slug: 'mindcet-korea-2026',
        startsAt: '2026-08-18T09:00:00+09:00',
        endsAt: '2026-08-20T18:00:00+09:00',
        city: 'Seoul',
        venue: 'Seoul Startup Hub',
        timezone: 'Asia/Seoul',
        hero: {
          eyebrow: 'Seoul · August 2026',
          headline: 'Build bold. Think global.',
          partnerLine: 'MindCET × K-Startup',
        },
        eventState: 'active',
        _status: 'published',
      },
    })
  }

  const speakerIDs = new Map<string, number | string>()
  for (const source of data.speakers) {
    let speaker = await findOne(payload, 'speakers', 'name', source.name)
    if (!speaker) {
      const [role, organization = ''] = source.role.split(' · ')
      speaker = await payload.create({
        collection: 'speakers',
        overrideAccess: true,
        data: { name: source.name, role, organization, bio: source.bio },
      })
    }
    speakerIDs.set(source.id, speaker.id)
  }

  for (const sourceDay of data.days) {
    let day = await findOne(payload, 'event-days', 'label', sourceDay.label)
    if (!day) {
      day = await payload.create({
        collection: 'event-days',
        overrideAccess: true,
        data: {
          event: event.id,
          label: sourceDay.label,
          title: sourceDay.title,
          date: `${sourceDay.date}T12:00:00+09:00`,
        },
      })
    }

    for (let index = 0; index < sourceDay.sessions.length; index += 1) {
      const [time, title, type, location, speakers, description] = sourceDay.sessions[index]
      const slug = `${sourceDay.date}-${slugify(title)}`
      if (await findOne(payload, 'sessions', 'slug', slug)) continue

      const next = sourceDay.sessions[index + 1]?.[0]
      const fallbackHour = String(Math.min(Number(time.slice(0, 2)) + 1, 23)).padStart(2, '0')
      await payload.create({
        collection: 'sessions',
        overrideAccess: true,
        data: {
          event: event.id,
          day: day.id,
          title,
          slug,
          startsAt: atSeoulTime(sourceDay.date, time),
          endsAt: atSeoulTime(sourceDay.date, next || `${fallbackHour}:${time.slice(3, 5)}`),
          type: type as 'Talk' | 'Workshop' | 'Panel' | 'Networking' | 'Visit',
          location,
          description,
          speakers: speakers
            .map((id) => speakerIDs.get(id))
            .filter((id): id is number => typeof id === 'number'),
          sessionState: 'scheduled',
          _status: 'published',
        },
      })
    }
  }

  for (const person of data.people) {
    if (await findOne(payload, 'participants', 'name', person.name)) continue
    await payload.create({
      collection: 'participants',
      overrideAccess: true,
      data: {
        event: event.id,
        name: person.name,
        role: person.role,
        organization: person.startup,
        about: person.about,
        tags: person.tags.map((label) => ({ label })),
        contactURL: person.contact,
        status: 'approved',
        source: 'staff',
      },
    })
  }

  const currentSettings = await payload.findGlobal({
    slug: 'app-settings', overrideAccess: true, depth: 0,
  })
  await payload.updateGlobal({
    slug: 'app-settings',
    overrideAccess: true,
    data: {
      activeEvent: event.id,
      design: { name: 'Seoul Signal', accent: '#65D5DF', secondaryAccent: '#EF4CA6' },
      directoryEnabled: true,
      feedbackEnabled: true,
      ...(!currentSettings.accessCodeHash
        ? { newAccessCode: process.env.SEED_EVENT_CODE || 'MINDCET26' }
        : {}),
    },
  })

  payload.logger.info('Bootcamp content seeded successfully')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
