import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../payload.config'

process.env.PAYLOAD_MIGRATING = 'true'

const run = async () => {
  const email = (process.env.SEED_ADMIN_EMAIL || '').trim()
  const password = (process.argv[2] || process.env.SEED_ADMIN_PASSWORD || '').trim()

  if (!email || password.length < 8) {
    console.error('Need SEED_ADMIN_EMAIL and a password of at least 8 characters.')
    process.exit(1)
  }

  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })

  if (!docs.length) {
    console.error(`No user found with email ${email}`)
    process.exit(1)
  }

  await payload.update({
    collection: 'users',
    id: docs[0].id,
    data: { password },
    overrideAccess: true,
  })

  payload.logger.info(`Password rotated for ${email}`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
