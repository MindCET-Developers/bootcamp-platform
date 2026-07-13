import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    theme: 'dark',
    meta: {
      titleSuffix: ' · MindCET Bootcamp',
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
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],
})
