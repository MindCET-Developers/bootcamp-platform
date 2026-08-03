import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'

// Prevents the Supabase Free project from sleeping due to inactivity.
// Triggered by a Vercel Cron (see vercel.json). Runs a lightweight query
// so the database registers regular activity.
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const payload = await getPayload({ config })
    const { totalDocs } = await payload.count({ collection: 'users', overrideAccess: true })
    return NextResponse.json({ ok: true, users: totalDocs, at: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'keep-alive failed' },
      { status: 500 },
    )
  }
}
