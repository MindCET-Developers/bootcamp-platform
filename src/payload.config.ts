import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Announcements } from './collections/Announcements'
import { AccessAttempts } from './collections/AccessAttempts'
import { EventDays } from './collections/EventDays'
import { Events } from './collections/Events'
import { Feedback } from './collections/Feedback'
import { Participants } from './collections/Participants'
import { Sessions } from './collections/Sessions'
import { Speakers } from './collections/Speakers'
import { AppSettings } from './globals/AppSettings'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const databaseURL = process.env.DATABASE_URL || ''
const supabaseSessionURL = databaseURL.includes('pooler.supabase.com')
  ? databaseURL.replace(':6543/', ':5432/')
  : databaseURL
const connectionString =
  supabaseSessionURL.includes('pooler.supabase.com') &&
  !supabaseSessionURL.includes('uselibpqcompat=true')
    ? `${supabaseSessionURL}${supabaseSessionURL.includes('?') ? '&' : '?'}uselibpqcompat=true`
    : supabaseSessionURL

export default buildConfig({
  admin: {
    user: Users.slug,
    theme: 'dark',
    meta: {
      titleSuffix: ' · GESAwards Bootcamp',
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Events,
    EventDays,
    Sessions,
    Speakers,
    Participants,
    Announcements,
    Feedback,
    AccessAttempts,
    Media,
    Users,
  ],
  globals: [AppSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    prodMigrations: process.env.PAYLOAD_RUN_MIGRATIONS === 'true' ? migrations : undefined,
    pool: {
      connectionString,
      max: 5,
    },
  }),
  sharp,
  plugins: [
    // Store uploaded media in Vercel Blob. On Vercel the filesystem is
    // read-only, so local-disk uploads fail; when BLOB_READ_WRITE_TOKEN is
    // set the adapter is used, otherwise we fall back to local disk (dev).
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
})
