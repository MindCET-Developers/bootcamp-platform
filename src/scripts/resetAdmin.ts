import dotenv from 'dotenv'

// Optional: pass an env file path as the first CLI arg (e.g. .env.production.local).
// Loaded with dotenv's parser (handles quotes/special chars better than node --env-file),
// and takes precedence over any already-set vars via override.
const envFileArg = process.argv[2]
if (envFileArg) {
  dotenv.config({ path: envFileArg, override: true })
} else {
  dotenv.config()
}

process.env.PAYLOAD_MIGRATING = 'true'

const run = async () => {
  // Import payload + config AFTER env is loaded, so the config reads the right DATABASE_URL.
  const { getPayload } = await import('payload')
  const { default: config } = await import('../payload.config')

  const payload = await getPayload({ config })

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@mindcet.local'
  const password = process.env.SEED_ADMIN_PASSWORD || 'change-me-now'

  const existing = await payload.find({
    collection: 'users',
    limit: 1,
    overrideAccess: true,
    where: { email: { equals: email } },
  })

  if (existing.docs[0]) {
    await payload.update({
      collection: 'users',
      id: existing.docs[0].id,
      overrideAccess: true,
      data: { password },
    })
    payload.logger.info(`Password reset for existing user: ${email}`)
  } else {
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { email, password, name: 'GESAwards Admin', role: 'admin' },
    })
    payload.logger.info(`Created new admin user: ${email}`)
  }

  // List all users so we can see what actually exists in this DB.
  const all = await payload.find({ collection: 'users', limit: 100, overrideAccess: true })
  payload.logger.info(`Users in DB (${all.totalDocs}): ${all.docs.map((u: any) => u.email).join(', ')}`)

  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
