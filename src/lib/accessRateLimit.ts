import type { Payload } from 'payload'

import { ACCESS_WINDOW_MS, MAX_ACCESS_FAILURES } from './attendeeAccess'

export const getAccessBlock = async (payload: Payload, key: string) => {
  const result = await payload.find({
    collection: 'access-attempts',
    overrideAccess: true,
    limit: 1,
    where: { key: { equals: key } },
  })
  const attempt = result.docs[0]
  const blockedUntil = attempt?.blockedUntil ? new Date(attempt.blockedUntil).getTime() : 0
  return blockedUntil > Date.now() ? Math.ceil((blockedUntil - Date.now()) / 1000) : 0
}

export const recordAccessFailure = async (payload: Payload, key: string) => {
  const result = await payload.find({
    collection: 'access-attempts',
    overrideAccess: true,
    limit: 1,
    where: { key: { equals: key } },
  })
  const current = result.docs[0]
  const now = Date.now()
  const inWindow = current && now - new Date(current.windowStartedAt).getTime() < ACCESS_WINDOW_MS
  const failures = inWindow ? current.failures + 1 : 1
  const data = {
    key,
    failures,
    windowStartedAt: inWindow ? current.windowStartedAt : new Date(now).toISOString(),
    blockedUntil:
      failures >= MAX_ACCESS_FAILURES ? new Date(now + ACCESS_WINDOW_MS).toISOString() : null,
  }

  if (current) {
    await payload.update({ collection: 'access-attempts', id: current.id, overrideAccess: true, data })
  } else {
    await payload.create({ collection: 'access-attempts', overrideAccess: true, data })
  }
  return failures >= MAX_ACCESS_FAILURES ? Math.ceil(ACCESS_WINDOW_MS / 1000) : 0
}

export const clearAccessFailures = async (payload: Payload, key: string) => {
  await payload.delete({
    collection: 'access-attempts',
    overrideAccess: true,
    where: { key: { equals: key } },
  })
}
