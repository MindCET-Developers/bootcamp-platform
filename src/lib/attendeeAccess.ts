import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'

export const ATTENDEE_COOKIE = 'mindcet_event_access'
export const ACCESS_WINDOW_MS = 15 * 60 * 1000
export const MAX_ACCESS_FAILURES = 5

const secret = () => {
  const value = process.env.PAYLOAD_SECRET
  if (!value) throw new Error('PAYLOAD_SECRET is required')
  return value
}

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export const hashAccessCode = (code: string) => {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(code.trim(), salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export const verifyAccessCode = (code: string, stored: string) => {
  const [algorithm, salt, expected] = stored.split('$')
  if (algorithm !== 'scrypt' || !salt || !expected) return false
  const actual = scryptSync(code.trim(), salt, 64).toString('hex')
  return safeEqual(actual, expected)
}

export const createAccessCookie = (eventID: number, expiresAt: Date) => {
  const payload = Buffer.from(
    JSON.stringify({ eventID, expiresAt: expiresAt.getTime() }),
  ).toString('base64url')
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export const verifyAccessCookie = (value?: string | null) => {
  if (!value) return null
  const [payload, signature] = value.split('.')
  if (!payload || !signature) return null
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url')
  if (!safeEqual(signature, expected)) return null

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      eventID: number
      expiresAt: number
    }
    if (!Number.isInteger(parsed.eventID) || parsed.expiresAt <= Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

export const readCookie = (request: Request, name: string) => {
  const cookie = request.headers.get('cookie') || ''
  const pair = cookie.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : null
}

export const requireEventAccess = (request: Request) =>
  verifyAccessCookie(readCookie(request, ATTENDEE_COOKIE))

// Magic link: a stable, signed token that lets an attendee unlock the event
// by scanning a QR code instead of typing the shared access code. The token is
// derived from PAYLOAD_SECRET, so it stays constant until the secret changes.
export const createMagicLinkToken = () =>
  createHmac('sha256', secret()).update('attendee-magic-link').digest('base64url')

export const verifyMagicLinkToken = (token: string) =>
  safeEqual(token, createMagicLinkToken())

export const createProfileToken = () => randomBytes(32).toString('base64url')

export const hashProfileToken = (token: string) =>
  createHmac('sha256', secret()).update(token).digest('hex')

export const verifyProfileToken = (token: string, expected: string) =>
  safeEqual(hashProfileToken(token), expected)

export const requestKey = (request: Request) => {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const source = forwarded || request.headers.get('x-real-ip') || 'local-development'
  return createHmac('sha256', secret()).update(source).digest('hex')
}

export const accessCodeExpiry = (eventEndsAt: string) => {
  const now = Date.now()
  const thirtyDays = now + 30 * 24 * 60 * 60 * 1000
  const weekAfterEvent = new Date(eventEndsAt).getTime() + 7 * 24 * 60 * 60 * 1000
  return new Date(Math.max(now + 60 * 60 * 1000, Math.min(thirtyDays, weekAfterEvent)))
}
