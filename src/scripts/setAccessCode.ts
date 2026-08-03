import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../payload.config'

// Never trigger Payload's development schema-push flow when running a script.
process.env.PAYLOAD_MIGRATING = 'true'

const run = async () => {
  const code = (process.argv[2] || process.env.NEW_ACCESS_CODE || '').trim()

  if (code.length < 8) {
    console.error('Provide an access code of at least 8 characters.')
    console.error('Usage: pnpm set:access-code <code>   (or NEW_ACCESS_CODE=<code>)')
    process.exit(1)
  }

  const payload = await getPayload({ config })

  // Setting `newAccessCode` fires the AppSettings beforeChange hook, which
  // hashes the code, updates accessCodeUpdatedAt, and strips the plaintext.
  await payload.updateGlobal({
    slug: 'app-settings',
    overrideAccess: true,
    data: { newAccessCode: code },
  })

  payload.logger.info(`Attendee access code updated to "${code}"`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
