'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'

type IconName = 'home' | 'calendar' | 'people' | 'user' | 'search' | 'close' | 'arrow'

type SpeakerView = {
  id: number
  name: string
  role: string
  organization: string
  bio: string
  photo: string
}

type SessionView = {
  id: number
  dayID: number
  title: string
  startsAt: string
  endsAt: string
  type: string
  description: string
  state: 'scheduled' | 'live' | 'completed' | 'cancelled'
  speakers: SpeakerView[]
}

type LocalProfile = {
  participantId?: number
  editToken?: string
  name: string
  role: string
  organization: string
  about: string
  tags: string[]
  contactURL: string
  status?: 'pending' | 'approved' | 'hidden'
}

const blankProfile: LocalProfile = {
  name: '', role: '', organization: '', about: '', tags: [], contactURL: '',
}

export type BootcampAppData = {
  event: {
    id: number
    name: string
    startsAt: string
    endsAt: string
    city: string
    venue: string
    timezone: string
    eyebrow: string
    headline: string
    partnerLine: string
  }
  days: Array<{ id: number; label: string; title: string; date: string; summary: string }>
  sessions: SessionView[]
  participants: Array<{
    id: number
    name: string
    role: string
    organization: string
    about: string
    tags: string[]
    contactURL: string
  }>
  announcements: Array<{
    id: number
    title: string
    message: string
    priority: 'info' | 'schedule' | 'important'
  }>
  features: { directory: boolean; feedback: boolean }
}

const Icon = ({ name }: { name: IconName }) => {
  const paths: Record<IconName, ReactNode> = {
    home: <path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    people: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  }

  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  )
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

const formatTime = (value: string, timezone: string) =>
  new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(new Date(value))

const formatDate = (value: string, timezone: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: timezone,
  }).format(new Date(value))

export function BootcampApp({ data }: { data: BootcampAppData }) {
  const [tab, setTab] = useState<'home' | 'agenda' | 'people' | 'me'>('home')
  const [activeDay, setActiveDay] = useState(data.days[0]?.id || 0)
  const [selected, setSelected] = useState<SessionView | null>(null)
  const [search, setSearch] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [feedbackState, setFeedbackState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [now, setNow] = useState(() => Date.now())
  const [profile, setProfile] = useState<LocalProfile>(blankProfile)
  const [tagText, setTagText] = useState('')
  const [profileState, setProfileState] = useState<'loading' | 'idle' | 'saving' | 'saved' | 'error'>('loading')
  const [profileMessage, setProfileMessage] = useState('')

  const profileKey = `mindcet-profile-${data.event.id}`

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const raw = window.localStorage.getItem(profileKey)
      if (!raw) { setProfileState('idle'); return }
      try {
        const stored = JSON.parse(raw) as LocalProfile
        setProfile(stored)
        setTagText((stored.tags || []).join(', '))
        if (!stored.participantId || !stored.editToken) { setProfileState('idle'); return }
        const query = new URLSearchParams({
          participantId: String(stored.participantId), editToken: stored.editToken,
        })
        fetch(`/api/attendee/profile?${query}`)
          .then(async (response) => {
            if (!response.ok) throw new Error('Your saved profile could not be found.')
            const current = await response.json() as LocalProfile
            const merged = { ...stored, ...current, editToken: stored.editToken }
            setProfile(merged)
            setTagText((merged.tags || []).join(', '))
            window.localStorage.setItem(profileKey, JSON.stringify(merged))
            setProfileState('idle')
          })
          .catch((error: Error) => { setProfileMessage(error.message); setProfileState('error') })
      } catch {
        window.localStorage.removeItem(profileKey)
        setProfileState('idle')
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [profileKey])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!selected) return
    document.body.classList.add('sheet-open')
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setSelected(null)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.classList.remove('sheet-open')
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [selected])

  const remaining = Math.max(0, new Date(data.event.startsAt).getTime() - now)
  const countdown = [
    Math.floor(remaining / 86_400_000),
    Math.floor(remaining / 3_600_000) % 24,
    Math.floor(remaining / 60_000) % 60,
    Math.floor(remaining / 1000) % 60,
  ]

  const currentSession =
    data.sessions.find((session) => session.state === 'live') ||
    data.sessions.find((session) => new Date(session.endsAt).getTime() > now) ||
    data.sessions[0]

  const daySessions = data.sessions.filter((session) => session.dayID === activeDay)
  const people = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return data.participants
    return data.participants.filter((person) =>
      [person.name, person.role, person.organization, person.about, ...person.tags]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [data.participants, search])

  const navigate = (next: typeof tab) => {
    setTab(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openSession = (session: SessionView) => {
    setSelected(session)
    setRating(0)
    setComment('')
    setFeedbackState('idle')
  }

  const submitFeedback = async () => {
    if (!selected || rating === 0) return
    setFeedbackState('saving')
    const response = await fetch('/api/attendee/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: selected.id, rating, comment }),
    })
    setFeedbackState(response.ok ? 'saved' : 'error')
  }

  const saveProfile = async () => {
    const tags = tagText.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 10)
    const next = { ...profile, tags }
    setProfileState('saving')
    setProfileMessage('')
    const response = await fetch('/api/attendee/profile', {
      method: profile.participantId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    })
    const result = await response.json().catch(() => ({})) as LocalProfile & { error?: string }
    if (!response.ok) {
      setProfileMessage(result.error || 'Could not save your profile.')
      setProfileState('error')
      return
    }
    const saved = { ...next, ...result, editToken: result.editToken || profile.editToken }
    setProfile(saved)
    window.localStorage.setItem(profileKey, JSON.stringify(saved))
    setProfileState('saved')
  }

  const deleteProfile = async () => {
    if (!profile.participantId || !profile.editToken) return
    if (!window.confirm('Delete your bootcamp profile from this event?')) return
    const response = await fetch('/api/attendee/profile', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: profile.participantId, editToken: profile.editToken }),
    })
    if (!response.ok) { setProfileMessage('Could not delete your profile.'); setProfileState('error'); return }
    window.localStorage.removeItem(profileKey)
    setProfile(blankProfile)
    setTagText('')
    setProfileState('idle')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" onClick={() => navigate('home')}>
          <span className="brand-logo" aria-label="GESAwards">
            <svg className="brand-logo-arrow" viewBox="0 0 28 28" aria-hidden="true">
              <line x1="8" y1="20" x2="16" y2="10" stroke="#FF3333" strokeWidth="2.5" strokeLinecap="round"/>
              <polygon points="20,4 26,8 18,12" fill="#FF3333"/>
              <rect x="7" y="19" width="3" height="3" fill="#AAAAAA"/>
            </svg>
            <span className="brand-logo-tail">wards</span>
          </span>
          <span className="brand-sub">Bootcamp companion</span>
        </a>
        <span className="signal-label">SEOUL / 37°33′N</span>
      </header>

      <main id="top" className="app-main">
        {tab === 'home' && (
          <section className="screen home-screen">
            <article className="hero card">
              <div className="hero-signal">
                <span />
              </div>
              <span className="eyebrow">{data.event.eyebrow}</span>
              <h1>{data.event.headline}</h1>
              <div className="event-meta">
                <span>
                  {formatDate(data.event.startsAt, data.event.timezone)}–
                  {formatDate(data.event.endsAt, data.event.timezone)}
                </span>
                <span>{data.event.city}, South Korea</span>
                {data.event.partnerLine && <span>{data.event.partnerLine}</span>}
              </div>
              <div className="countdown" aria-label="Countdown to event">
                {countdown.map((value, index) => (
                  <div key={['days', 'hours', 'mins', 'secs'][index]}>
                    <b>{String(value).padStart(2, '0')}</b>
                    <small>{['days', 'hours', 'mins', 'secs'][index]}</small>
                  </div>
                ))}
              </div>
            </article>

            {data.announcements[0] && (
              <aside className={`announcement ${data.announcements[0].priority}`}>
                <span>{data.announcements[0].priority}</span>
                <div>
                  <b>{data.announcements[0].title}</b>
                  <p>{data.announcements[0].message}</p>
                </div>
              </aside>
            )}

            {currentSession && (
              <section className="section-block">
                <header className="section-heading">
                  <div>
                    <span className="eyebrow">Program signal</span>
                    <h2>{currentSession.state === 'live' ? 'Happening now' : 'Up next'}</h2>
                  </div>
                  <span
                    className={
                      currentSession.state === 'live' ? 'live-indicator' : 'next-indicator'
                    }
                  >
                    {currentSession.state === 'live' ? 'LIVE' : 'NEXT'}
                  </span>
                </header>
                <button className="now-card card" onClick={() => openSession(currentSession)}>
                  <div>
                    <span className="session-type">{currentSession.type}</span>
                    <h3>{currentSession.title}</h3>
                    <p>{currentSession.speakers.map((speaker) => speaker.name).join(' · ')}</p>
                  </div>
                  <div className="now-time">
                    <b>{formatTime(currentSession.startsAt, data.event.timezone)}</b>
                  </div>
                </button>
              </section>
            )}

            <section className="section-block">
              <header className="section-heading">
                <h2>Explore</h2>
              </header>
              <div className="quick-grid">
                <button className="quick-card card" onClick={() => navigate('agenda')}>
                  <Icon name="calendar" />
                  <b>Full agenda</b>
                  <span>{data.days.length} focused days</span>
                </button>
                <button className="quick-card card" onClick={() => navigate('people')}>
                  <Icon name="people" />
                  <b>Meet people</b>
                  <span>{data.participants.length} founders & mentors</span>
                </button>
              </div>
            </section>
          </section>
        )}

        {tab === 'agenda' && (
          <section className="screen agenda-screen">
            <header className="page-heading">
              <div>
                <span className="eyebrow">Your journey</span>
                <h1>Agenda</h1>
              </div>
              <span>{data.event.timezone.replace('Asia/', '')} time</span>
            </header>
            <div className="day-tabs" role="tablist" aria-label="Event days">
              {data.days.map((day) => (
                <button
                  aria-selected={activeDay === day.id}
                  className={activeDay === day.id ? 'active' : ''}
                  key={day.id}
                  onClick={() => setActiveDay(day.id)}
                  role="tab"
                >
                  <b>{day.label}</b>
                  <span>
                    {day.title} · {formatDate(day.date, data.event.timezone)}
                  </span>
                </button>
              ))}
            </div>
            <div className="timeline">
              {daySessions.map((session) => (
                <article className="timeline-row" key={session.id}>
                  <time>{formatTime(session.startsAt, data.event.timezone)}</time>
                  <span className="timeline-rail" aria-hidden="true">
                    <i />
                  </span>
                  <button className="session-card card" onClick={() => openSession(session)}>
                    <span className="session-type">{session.type}</span>
                    <h3>{session.title}</h3>
                    {session.speakers.length > 0 && (
                      <div className="speaker-chips">
                        {session.speakers.map((speaker) => (
                          <span className="speaker-chip" key={speaker.id}>
                            {speaker.photo ? (
                              <img
                                alt=""
                                className="speaker-avatar"
                                loading="lazy"
                                src={speaker.photo}
                              />
                            ) : (
                              <span className="speaker-avatar profile-monogram">
                                {initials(speaker.name)}
                              </span>
                            )}
                            <span className="speaker-chip-name">{speaker.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'people' && (
          <section className="screen people-screen">
            <header className="page-heading">
              <div>
                <span className="eyebrow">Community</span>
                <h1>People</h1>
              </div>
              <span>{people.length} profiles</span>
            </header>
            <label className="search-field">
              <Icon name="search" />
              <span className="sr-only">Search people</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, startup or interest"
              />
              {search && (
                <button aria-label="Clear search" onClick={() => setSearch('')} type="button">
                  <Icon name="close" />
                </button>
              )}
            </label>
            <div className="people-grid">
              {people.map((person) => (
                <article className="person-card card" key={person.id}>
                  <div className="person-heading">
                    <span className="profile-monogram">{initials(person.name)}</span>
                    <div>
                      <h3>{person.name}</h3>
                      {/* Role and organization are optional, so join only what exists. */}
                      {(person.role || person.organization) && (
                        <p>{[person.role, person.organization].filter(Boolean).join(' · ')}</p>
                      )}
                    </div>
                  </div>
                  {person.about && <p className="person-about">{person.about}</p>}
                  <div className="tags">
                    {person.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  {person.contactURL && (
                    <a
                      href={`https://${person.contactURL.replace(/^https?:\/\//, '')}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Connect <Icon name="arrow" />
                    </a>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'me' && (
          <section className="screen me-screen">
            <header className="page-heading">
              <div>
                <span className="eyebrow">Your space</span>
                <h1>Me</h1>
              </div>
            </header>
            {profile.status && (
              <div className={`profile-status ${profile.status}`}>
                <span />
                <div>
                  <b>{profile.status === 'approved' ? 'Published' : profile.status === 'hidden' ? 'Hidden' : 'Waiting for approval'}</b>
                  <p>{profile.status === 'approved' ? 'Your profile is visible in People.' : profile.status === 'hidden' ? 'Your profile is saved but not shown in People.' : 'The team will review your profile before it appears in People.'}</p>
                </div>
              </div>
            )}
            <article className="profile-form card">
              <div className="profile-intro">
                <span className="profile-monogram">{profile.name ? initials(profile.name) : '?'}</span>
                <div><h2>Your bootcamp profile</h2><p>Saved on this device. No account or email needed.</p></div>
              </div>
              <div className="form-grid">
                <label><span>Name *</span><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
                <label><span>Role</span><input value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })} /></label>
                <label><span>Organization</span><input value={profile.organization} onChange={(e) => setProfile({ ...profile, organization: e.target.value })} /></label>
                <label className="wide"><span>About</span><textarea maxLength={1000} value={profile.about} onChange={(e) => setProfile({ ...profile, about: e.target.value })} /></label>
                <label className="wide"><span>Interests</span><input placeholder="AI, learning, founders" value={tagText} onChange={(e) => setTagText(e.target.value)} /><small>Separate with commas</small></label>
                <label className="wide"><span>Link</span><input inputMode="url" placeholder="linkedin.com/in/you" value={profile.contactURL} onChange={(e) => setProfile({ ...profile, contactURL: e.target.value })} /></label>
              </div>
              {profileMessage && <p className="form-error" role="alert">{profileMessage}</p>}
              <div className="profile-actions">
                <button className="save-profile" disabled={profileState === 'saving' || profileState === 'loading'} onClick={saveProfile}>
                  {profileState === 'saving' ? 'Saving…' : profile.participantId ? 'Save changes' : 'Submit for approval'}
                </button>
                {profile.participantId && <button className="delete-profile" onClick={deleteProfile}>Delete profile</button>}
              </div>
              {profileState === 'saved' && <small className="save-confirmation">Saved. Your profile is waiting for review.</small>}
            </article>
            <section className="settings-card card">
              <div>
                <span>Active event</span>
                <b>{data.event.name}</b>
              </div>
              <div>
                <span>Directory</span>
                <b>{data.features.directory ? 'Enabled' : 'Disabled'}</b>
              </div>
              <div>
                <span>Session feedback</span>
                <b>{data.features.feedback ? 'Enabled' : 'Disabled'}</b>
              </div>
              <div>
                <span>Design system</span>
                <b>02 · Seoul Signal</b>
              </div>
            </section>
          </section>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        {(
          [
            ['home', 'Home', 'home'],
            ['agenda', 'Agenda', 'calendar'],
            ['people', 'People', 'people'],
            ['me', 'Me', 'user'],
          ] as const
        ).map(([value, label, icon]) => (
          <button
            className={tab === value ? 'active' : ''}
            key={value}
            onClick={() => navigate(value)}
          >
            <Icon name={icon} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {selected && (
        <div
          className="sheet-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}
        >
          <section
            aria-labelledby="session-title"
            aria-modal="true"
            className="session-sheet"
            role="dialog"
          >
            <header className="sheet-header">
              <div>
                <span className="session-type">{selected.type}</span>
                <h2 id="session-title">{selected.title}</h2>
              </div>
              <button
                aria-label="Close session details"
                className="close-button"
                onClick={() => setSelected(null)}
              >
                <Icon name="close" />
              </button>
            </header>
            <p className="sheet-meta">
              {formatTime(selected.startsAt, data.event.timezone)}–
              {formatTime(selected.endsAt, data.event.timezone)}
            </p>
            <p className="sheet-description">{selected.description}</p>
            {selected.speakers.map((speaker) => (
              <article className="speaker-row" key={speaker.id}>
                {speaker.photo ? (
                  <img alt="" className="speaker-avatar speaker-avatar-lg" src={speaker.photo} />
                ) : (
                  <span className="profile-monogram">{initials(speaker.name)}</span>
                )}
                <div>
                  <h3>{speaker.name}</h3>
                  <p>
                    {speaker.role}
                    {speaker.organization && ` · ${speaker.organization}`}
                  </p>
                  <small>{speaker.bio}</small>
                </div>
              </article>
            ))}
            {data.features.feedback && (
              <div className="feedback-panel">
                <h3>How useful was this session?</h3>
                <div className="rating" role="radiogroup" aria-label="Session rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      aria-checked={rating === value}
                      aria-label={`${value} stars`}
                      className={rating >= value ? 'active' : ''}
                      key={value}
                      onClick={() => setRating(value)}
                      role="radio"
                    >
                      ★
                    </button>
                  ))}
                </div>
                <label>
                  <span>Optional note</span>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="What worked? What would make it better?"
                  />
                </label>
                <button
                  className="submit-feedback"
                  disabled={!rating || feedbackState === 'saving' || feedbackState === 'saved'}
                  onClick={submitFeedback}
                >
                  {feedbackState === 'saving'
                    ? 'Saving…'
                    : feedbackState === 'saved'
                      ? 'Feedback saved'
                      : feedbackState === 'error'
                        ? 'Try again'
                        : 'Send feedback'}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
