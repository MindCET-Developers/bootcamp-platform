import 'dotenv/config'

import { readdirSync, readFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

// Bulk-uploads speaker portraits and links each one to its speaker.
//
// Put image files in ./speakers named after the speaker (e.g. "Avi Warshavsky.jpg",
// "Dr. Alice Pak.jpeg"); titles like "Dr." and case/punctuation differences are
// ignored when matching against the speaker names in the CMS.
//
// Usage: pnpm upload:speaker-photos [baseURL] [dir]
//   Defaults to the deployed app and ./speakers. Credentials come from
//   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in the environment.

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

// Lowercase, strip honorifics and punctuation, collapse whitespace.
const norm = (value: string) =>
  value
    .toLowerCase()
    .replace(/\.(jpg|jpeg|png|webp)$/i, '')
    .replace(/\b(dr|prof|mr|ms|mrs)\.?\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')

const run = async () => {
  const base = (
    process.argv[2] ||
    process.env.APP_BASE_URL ||
    'https://bootcamp-platform-iota.vercel.app'
  ).replace(/\/+$/, '')
  const dir = resolve(process.cwd(), process.argv[3] || 'speakers')
  const email = process.env.SEED_ADMIN_EMAIL || ''
  const password = process.env.SEED_ADMIN_PASSWORD || ''

  if (!email || !password) {
    console.error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in the environment.')
    process.exit(1)
  }

  const login = await fetch(`${base}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const cookie = (login.headers.get('set-cookie') || '')
    .split(',')
    .map((part) => part.trim())
    .find((part) => part.startsWith('payload-token='))
    ?.split(';')[0]

  if (!cookie) {
    console.error(`Login failed (${login.status}).`)
    process.exit(1)
  }

  const speakersResponse = await fetch(`${base}/api/speakers?limit=100&depth=0`, {
    headers: { cookie },
  })
  const speakers = (await speakersResponse.json()).docs as Array<{ id: number; name: string }>
  const files = readdirSync(dir).filter((file) => MIME[extname(file).toLowerCase()])
  console.log(`${speakers.length} speakers in CMS, ${files.length} image files in ${dir}`)

  const linked = new Set<number>()

  for (const file of files) {
    const key = norm(file)
    const speaker = speakers.find((candidate) => norm(candidate.name) === key)

    if (!speaker) {
      console.log(`SKIP  "${file}" — no speaker named "${key}"`)
      continue
    }

    const bytes = readFileSync(join(dir, file))
    const form = new FormData()
    form.append('file', new Blob([bytes], { type: MIME[extname(file).toLowerCase()] }), file)
    form.append('_payload', JSON.stringify({ alt: `${speaker.name} — portrait` }))

    const upload = await fetch(`${base}/api/media`, { method: 'POST', headers: { cookie }, body: form })
    const uploaded = await upload.json().catch(() => ({}))

    if (upload.status !== 201) {
      console.log(`FAIL  upload "${file}" — ${upload.status} ${JSON.stringify(uploaded).slice(0, 160)}`)
      continue
    }

    const link = await fetch(`${base}/api/speakers/${speaker.id}`, {
      method: 'PATCH',
      headers: { cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo: uploaded.doc.id }),
    })

    if (link.status !== 200) {
      console.log(`FAIL  link ${speaker.name} — ${link.status} ${(await link.text()).slice(0, 160)}`)
      continue
    }

    linked.add(speaker.id)
    console.log(`OK    ${speaker.name} <- ${file} (${(bytes.length / 1024).toFixed(0)}KB)`)
  }

  const missing = speakers.filter((speaker) => !linked.has(speaker.id))
  console.log(`\nLinked ${linked.size}/${speakers.length} speakers.`)
  if (missing.length) console.log(`Still without a photo: ${missing.map((s) => s.name).join(', ')}`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
