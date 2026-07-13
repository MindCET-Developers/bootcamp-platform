'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

export function AccessGate({ eventName, city }: { eventName: string; city: string }) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!code.trim()) return
    setState('loading')
    const response = await fetch('/api/attendee/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    if (response.ok) {
      router.refresh()
      return
    }
    const result = (await response.json().catch(() => ({}))) as { error?: string }
    setMessage(result.error || 'Could not verify the code.')
    setState('error')
  }

  return (
    <main className="access-gate">
      <section className="access-card">
        <div className="access-signal" aria-hidden="true"><span /></div>
        <span className="eyebrow">{city} / Event access</span>
        <h1>Enter the shared code</h1>
        <p>{eventName} is a private event space. You only need to enter the code once on this device.</p>
        <form onSubmit={submit}>
          <label htmlFor="event-code">Event code</label>
          <input
            autoCapitalize="characters"
            autoComplete="one-time-code"
            autoFocus
            id="event-code"
            onChange={(event) => { setCode(event.target.value); setState('idle') }}
            placeholder="Enter code"
            spellCheck={false}
            value={code}
          />
          {state === 'error' && <p className="form-error" role="alert">{message}</p>}
          <button disabled={state === 'loading' || !code.trim()} type="submit">
            {state === 'loading' ? 'Checking…' : 'Enter bootcamp'}
          </button>
        </form>
        <small>No account, email or password required.</small>
      </section>
    </main>
  )
}
