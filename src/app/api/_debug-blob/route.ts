import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'

// TEMPORARY diagnostic route — remove after debugging media uploads.
export const dynamic = 'force-dynamic'

export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN || ''
  const info = { hasToken: Boolean(token), tokenLen: token.length }
  try {
    const res = await put(`debug/probe-${Date.now()}.txt`, 'hello', {
      access: 'public',
      token,
      addRandomSuffix: true,
    })
    return NextResponse.json({ ok: true, ...info, url: res.url })
  } catch (e: unknown) {
    const err = e as { message?: string; name?: string; stack?: string }
    return NextResponse.json(
      { ok: false, ...info, name: err?.name, error: err?.message, stack: (err?.stack || '').slice(0, 600) },
      { status: 500 },
    )
  }
}
