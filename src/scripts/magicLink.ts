import 'dotenv/config'

import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

import QRCode from 'qrcode'

import { createMagicLinkToken } from '../lib/attendeeAccess'

// Prints the QR-ready magic link that unlocks the event without the shared code,
// and writes matching QR images (PNG + SVG) into ./qr.
// Usage: pnpm magic:link https://your-domain.com
//   (or set APP_BASE_URL / NEXT_PUBLIC_SERVER_URL in the environment)
const run = async () => {
  const base = (
    process.argv[2] ||
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    'http://localhost:3000'
  ).replace(/\/+$/, '')

  const token = createMagicLinkToken()
  const link = `${base}/join?t=${token}`

  const outDir = resolve(process.cwd(), 'qr')
  mkdirSync(outDir, { recursive: true })
  const pngPath = resolve(outDir, 'event-access.png')
  const svgPath = resolve(outDir, 'event-access.svg')

  const options = { errorCorrectionLevel: 'M' as const, margin: 2, width: 1024 }
  await QRCode.toFile(pngPath, link, { ...options, type: 'png' })
  await QRCode.toFile(svgPath, link, { ...options, type: 'svg' })

  console.log('\nQR / magic-link (bypasses the shared access code):\n')
  console.log(link)
  console.log('\nQR images written to:')
  console.log(`  ${pngPath}`)
  console.log(`  ${svgPath}`)
  console.log('\nAnyone who opens this link is let into the active event automatically.')
  console.log('The token stays valid until PAYLOAD_SECRET changes.\n')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
