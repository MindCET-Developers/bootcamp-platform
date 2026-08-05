import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../payload.config'

process.env.PAYLOAD_MIGRATING = 'true'

const run = async () => {
  const payload = await getPayload({ config })

  console.log('Seeding events...')

  // 1. Create/Update Speakers
  const speakers: Record<string, any> = {}
  const speakersList = [
    { name: 'Dr. Ilan Ben Yaakov', role: 'VP Learning Experience', organization: 'MindCET' },
    { name: 'Erella Moshe', role: 'EdTech Campus Manager', organization: 'MindCET' },
    { name: 'Avi Warshavsky', role: 'Founder & CEO', organization: 'GESAwards & MindCET' },
    { name: 'Norihisa Wada', role: 'Chairman, Global EdTech Acceleration Committee', organization: 'Japan' },
    { name: 'Alex NG', role: 'EdTech Leader', organization: 'South East Asia' },
    { name: 'Hun Jong', role: 'EdTech Leader', organization: 'Korea' },
    { name: 'Ernest Gavor', role: 'GESAwards Partner', organization: 'Africa' },
    { name: 'Dr. Alice Pak', role: 'EdTech & AI Innovation Strategist', organization: 'Los Angeles County Office of Education' },
    { name: 'Daniel Stanhope', role: 'EdTech Leader', organization: '' },
    { name: 'Ken Lai', role: 'Founder', organization: 'Smarthon' },
    { name: 'James Oh', role: 'Founder', organization: 'Tebahsoft' },
    { name: 'Kiyoung Kim', role: 'Founder', organization: 'Learney' },
    { name: 'Celine Xu', role: 'Founder', organization: 'Asksia' },
    { name: 'Michael Iacovino', role: 'Founder', organization: 'ETAPA' },
    { name: 'Michael Forshaw', role: 'Co-founder & CEO', organization: 'EdTech Impact' },
  ]

  for (const speakerData of speakersList) {
    const existing = await payload.find({
      collection: 'speakers',
      where: { name: { equals: speakerData.name } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs[0]) {
      speakers[speakerData.name] = existing.docs[0].id
      console.log(`Speaker "${speakerData.name}" already exists (id: ${existing.docs[0].id})`)
    } else {
      const speaker = await payload.create({
        collection: 'speakers',
        data: {
          name: speakerData.name,
          role: speakerData.role,
          organization: speakerData.organization,
          bio: `${speakerData.role} at ${speakerData.organization}`,
        },
        overrideAccess: true,
      })
      speakers[speakerData.name] = speaker.id
      console.log(`Created speaker "${speakerData.name}" (id: ${speaker.id})`)
    }
  }

  // 2. Create/Update Events
  const gesEvent = await payload.find({
    collection: 'events',
    where: { slug: { equals: 'gesawards-bootcamp-2026' } },
    limit: 1,
    overrideAccess: true,
  })

  const mindcetEvent = await payload.find({
    collection: 'events',
    where: { slug: { equals: 'mindcet-conference-2026' } },
    limit: 1,
    overrideAccess: true,
  })

  let gesEventId: number
  let mindcetEventId: number

  if (gesEvent.docs[0]) {
    gesEventId = gesEvent.docs[0].id
    console.log(`GESAwards event already exists (id: ${gesEventId})`)
  } else {
    const created = await payload.create({
      collection: 'events',
      data: {
        name: 'GESAwards Bootcamp 2026',
        slug: 'gesawards-bootcamp-2026',
        startsAt: '2026-08-12T14:00:00Z' as any,
        endsAt: '2026-08-12T17:00:00Z' as any,
        city: 'Seoul',
        venue: 'MindCET Pavilion, Booth A111',
        timezone: 'Asia/Seoul',
        hero: {
          eyebrow: 'Seoul · August 2026',
          headline: 'GESAwards Bootcamp',
          partnerLine: 'Global EdTech Startup Awards',
        },
        eventState: 'active',
      },
      overrideAccess: true,
    })
    gesEventId = created.id
    console.log(`Created GESAwards event (id: ${gesEventId})`)
  }

  if (mindcetEvent.docs[0]) {
    mindcetEventId = mindcetEvent.docs[0].id
    console.log(`MindCET event already exists (id: ${mindcetEventId})`)
  } else {
    const created = await payload.create({
      collection: 'events',
      data: {
        name: 'MindCET Conference 2026',
        slug: 'mindcet-conference-2026',
        startsAt: '2026-08-13T10:00:00Z' as any,
        endsAt: '2026-08-13T12:00:00Z' as any,
        city: 'Seoul',
        venue: 'Edu+ Korea',
        timezone: 'Asia/Seoul',
        hero: {
          eyebrow: 'Seoul · August 2026',
          headline: 'MindCET Conference',
          partnerLine: 'Global Innovation Hub',
        },
        eventState: 'active',
      },
      overrideAccess: true,
    })
    mindcetEventId = created.id
    console.log(`Created MindCET event (id: ${mindcetEventId})`)
  }

  // 3. Create/Update Days
  const gesDay = await payload.find({
    collection: 'event-days',
    where: {
      and: [{ event: { equals: gesEventId } }, { date: { equals: new Date('2026-08-12') } }],
    },
    limit: 1,
    overrideAccess: true,
  })

  const mindcetDay = await payload.find({
    collection: 'event-days',
    where: {
      and: [{ event: { equals: mindcetEventId } }, { date: { equals: new Date('2026-08-13') } }],
    },
    limit: 1,
    overrideAccess: true,
  })

  let gesDayId: number
  let mindcetDayId: number

  if (gesDay.docs[0]) {
    gesDayId = gesDay.docs[0].id
    console.log(`GESAwards day already exists (id: ${gesDayId})`)
  } else {
    const created = await payload.create({
      collection: 'event-days',
      data: {
        event: gesEventId,
        label: 'Day 1',
        title: 'Bootcamp Day',
        date: '2026-08-12' as any,
        summary: 'Full day of talks, panels, and networking',
      },
      overrideAccess: true,
    })
    gesDayId = created.id
    console.log(`Created GESAwards day (id: ${gesDayId})`)
  }

  if (mindcetDay.docs[0]) {
    mindcetDayId = mindcetDay.docs[0].id
    console.log(`MindCET day already exists (id: ${mindcetDayId})`)
  } else {
    const created = await payload.create({
      collection: 'event-days',
      data: {
        event: mindcetEventId,
        label: 'Day 1',
        title: 'Conference Day',
        date: new Date('2026-08-13'),
        summary: 'Expert talks on AI in education',
      },
      overrideAccess: true,
    })
    mindcetDayId = created.id
    console.log(`Created MindCET day (id: ${mindcetDayId})`)
  }

  // 4. Create/Update Sessions - GESAwards Bootcamp
  const gesSessions = [
    {
      title: 'Welcome',
      slug: 'gesawards-welcome',
      startsAt: '2026-08-12T14:00:00Z' as any,
      endsAt: '2026-08-12T14:10:00Z' as any,
      type: 'Talk',
      description: 'Opening remarks and welcome to GESAwards Bootcamp',
      speakers: ['Dr. Ilan Ben Yaakov'],
    },
    {
      title: 'Getting to Know You (Clock)',
      slug: 'gesawards-clock',
      startsAt: '2026-08-12T14:10:00Z' as any,
      endsAt: '2026-08-12T14:30:00Z' as any,
      type: 'Networking',
      description: 'Speed networking session',
      speakers: ['Erella Moshe'],
    },
    {
      title: 'Global EdTech Trends and Opportunities',
      slug: 'gesawards-trends',
      startsAt: '2026-08-12T14:30:00Z' as any,
      endsAt: '2026-08-12T14:50:00Z' as any,
      type: 'Talk',
      description: 'Overview of global EdTech market trends',
      speakers: ['Avi Warshavsky'],
    },
    {
      title: 'EdTech Changing the Global Educational Market',
      slug: 'gesawards-global-market',
      startsAt: '2026-08-12T14:50:00Z' as any,
      endsAt: '2026-08-12T15:40:00Z' as any,
      type: 'Panel',
      description: 'Panel discussion on how EdTech is transforming global education',
      speakers: [
        'Norihisa Wada',
        'Alex NG',
        'Hun Jong',
        'Ernest Gavor',
        'Dr. Alice Pak',
        'Daniel Stanhope',
      ],
    },
    {
      title: 'EdTech Companies Take the Stage',
      slug: 'gesawards-companies-panel',
      startsAt: '2026-08-12T15:40:00Z' as any,
      endsAt: '2026-08-12T16:00:00Z' as any,
      type: 'Panel',
      description: 'Founders share their experiences building EdTech products',
      speakers: ['Ken Lai', 'James Oh', 'Kiyoung Kim', 'Celine Xu', 'Michael Iacovino'],
    },
    {
      title: 'The EdTech Vibecoding Revolution',
      slug: 'gesawards-vibecoding',
      startsAt: '2026-08-12T16:00:00Z' as any,
      endsAt: '2026-08-12T16:20:00Z' as any,
      type: 'Talk',
      description: 'How AI-driven development is transforming EdTech',
      speakers: ['Dr. Ilan Ben Yaakov'],
    },
    {
      title: 'AI Disrupting the Classroom',
      slug: 'gesawards-ai-classroom',
      startsAt: '2026-08-12T16:20:00Z' as any,
      endsAt: '2026-08-12T16:40:00Z' as any,
      type: 'Talk',
      description: 'Impact of AI on classroom dynamics and learning',
      speakers: ['Dr. Alice Pak'],
    },
    {
      title: 'Go to Market: Building EdTech on Proof, Not Hope',
      slug: 'gesawards-gtm-fireside',
      startsAt: '2026-08-12T16:40:00Z' as any,
      endsAt: '2026-08-12T17:00:00Z' as any,
      type: 'Panel',
      description: 'Fireside chat on go-to-market strategy for EdTech',
      speakers: ['Michael Forshaw', 'Alex NG'],
    },
  ]

  for (const sessionData of gesSessions) {
    const existing = await payload.find({
      collection: 'sessions',
      where: { slug: { equals: sessionData.slug } },
      limit: 1,
      overrideAccess: true,
    })

    const sessionSpeakers = sessionData.speakers
      .map((name) => speakers[name])
      .filter(Boolean)

    if (existing.docs[0]) {
      // Update existing session
      await payload.update({
        collection: 'sessions',
        id: existing.docs[0].id,
        data: {
          title: sessionData.title,
          startsAt: sessionData.startsAt,
          endsAt: sessionData.endsAt,
          type: sessionData.type,
          description: sessionData.description,
          speakers: sessionSpeakers,
        },
        overrideAccess: true,
      })
      console.log(`Updated GESAwards session: "${sessionData.title}"`)
    } else {
      await payload.create({
        collection: 'sessions',
        data: {
          event: gesEventId,
          day: gesDayId,
          title: sessionData.title,
          slug: sessionData.slug,
          startsAt: sessionData.startsAt,
          endsAt: sessionData.endsAt,
          type: sessionData.type,
          description: sessionData.description,
          speakers: sessionSpeakers,
          sessionState: 'scheduled',
        },
        overrideAccess: true,
      })
      console.log(`Created GESAwards session: "${sessionData.title}"`)
    }
  }

  // 5. Create/Update Sessions - MindCET Conference
  const mindcetSessions = [
    {
      title: 'Registration and Networking',
      slug: 'mindcet-registration',
      startsAt: '2026-08-13T10:00:00Z' as any,
      endsAt: '2026-08-13T10:20:00Z' as any,
      type: 'Networking',
      description: 'Registration and informal networking',
      speakers: ['Erella Moshe'],
    },
    {
      title: 'Unboxing Schools in an AI-Native World',
      slug: 'mindcet-unboxing',
      startsAt: '2026-08-13T10:20:00Z' as any,
      endsAt: '2026-08-13T10:45:00Z' as any,
      type: 'Talk',
      description: 'Reimagining education in the age of AI',
      speakers: ['Avi Warshavsky'],
    },
    {
      title: 'Towards Sustainable Ecosystem: Trends in Japan',
      slug: 'mindcet-japan-trends',
      startsAt: '2026-08-13T10:45:00Z' as any,
      endsAt: '2026-08-13T11:10:00Z' as any,
      type: 'Talk',
      description: 'EdTech trends in Japan and investment opportunities',
      speakers: ['Norihisa Wada'],
    },
    {
      title: 'Separating AI Hype from Measurable Classroom Impact',
      slug: 'mindcet-ai-impact',
      startsAt: '2026-08-13T11:10:00Z' as any,
      endsAt: '2026-08-13T11:35:00Z' as any,
      type: 'Talk',
      description: 'Evidence-based evaluation of AI in education',
      speakers: ['Michael Forshaw'],
    },
    {
      title: 'How AI is Finally Re-shaping Education',
      slug: 'mindcet-ai-reshaping',
      startsAt: '2026-08-13T11:35:00Z' as any,
      endsAt: '2026-08-13T12:00:00Z' as any,
      type: 'Panel',
      description: 'Fireside chat on AI transforming education from Pre-K to Higher Ed',
      speakers: ['Dr. Alice Pak', 'Dr. Ilan Ben Yaakov'],
    },
  ]

  for (const sessionData of mindcetSessions) {
    const existing = await payload.find({
      collection: 'sessions',
      where: { slug: { equals: sessionData.slug } },
      limit: 1,
      overrideAccess: true,
    })

    const sessionSpeakers = sessionData.speakers
      .map((name) => speakers[name])
      .filter(Boolean)

    if (existing.docs[0]) {
      // Update existing session
      await payload.update({
        collection: 'sessions',
        id: existing.docs[0].id,
        data: {
          title: sessionData.title,
          startsAt: sessionData.startsAt,
          endsAt: sessionData.endsAt,
          type: sessionData.type,
          description: sessionData.description,
          speakers: sessionSpeakers,
        },
        overrideAccess: true,
      })
      console.log(`Updated MindCET session: "${sessionData.title}"`)
    } else {
      await payload.create({
        collection: 'sessions',
        data: {
          event: mindcetEventId,
          day: mindcetDayId,
          title: sessionData.title,
          slug: sessionData.slug,
          startsAt: sessionData.startsAt,
          endsAt: sessionData.endsAt,
          type: sessionData.type,
          description: sessionData.description,
          speakers: sessionSpeakers,
          sessionState: 'scheduled',
        },
        overrideAccess: true,
      })
      console.log(`Created MindCET session: "${sessionData.title}"`)
    }
  }

  console.log('\n✅ Seeding complete!')
  process.exit(0)
}

run().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
