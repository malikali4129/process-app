import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import './App.css'

type ProcessItem = {
  label: string
  remaining: string
  progress: number
  icon: string
  tone: string
}

type ProcessGroup = {
  title: string
  subtitle: string
  items: ProcessItem[]
}

type ItemTemplate = {
  label: string
  icon: string
  tone: string
  compute: (now: Date) => { remaining: string; progress: number }
}

type GroupTemplate = {
  title: string
  subtitle: string
  items: ItemTemplate[]
}

const SECOND_MS = 1000
const MINUTE_MS = 60 * SECOND_MS
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const YEAR_MS = 365.2425 * DAY_MS
const SYNODIC_MONTH_MS = 29.530588853 * DAY_MS
const MOON_PHASE_MS = SYNODIC_MONTH_MS / 8
const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0)
const APP_EPOCH_MS = Date.UTC(2026, 0, 1, 0, 0, 0)

const clampPercent = (value: number) => Math.max(0, Math.min(100, value))

const formatDuration = (ms: number) => {
  if (ms <= 0) {
    return '0 seconds left'
  }

  let remaining = Math.ceil(ms / 1000)
  const days = Math.floor(remaining / 86400)
  remaining -= days * 86400
  const hours = Math.floor(remaining / 3600)
  remaining -= hours * 3600
  const minutes = Math.floor(remaining / 60)
  remaining -= minutes * 60
  const seconds = remaining

  const parts: string[] = []

  if (days > 0) {
    parts.push(`${days} day${days === 1 ? '' : 's'}`)
  }

  if (hours > 0 && parts.length < 2) {
    parts.push(`${hours} hour${hours === 1 ? '' : 's'}`)
  }

  if (minutes > 0 && parts.length < 2) {
    parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`)
  }

  if (parts.length < 2) {
    parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`)
  }

  return `${parts.join(' ')} left`
}

const formatYearsRemaining = (years: number) => {
  if (years <= 1) {
    return `${Math.max(0, Math.round(years * 365))} days left`
  }

  if (years < 1000) {
    return `${Math.round(years)} years left`
  }

  if (years < 1_000_000) {
    return `${Math.round(years).toLocaleString('en-US')} years left`
  }

  if (years < 1_000_000_000) {
    return `${(years / 1_000_000).toFixed(2)} million years left`
  }

  if (years < 1_000_000_000_000) {
    return `${(years / 1_000_000_000).toFixed(2)} billion years left`
  }

  return `${years.toExponential(2)} years left`
}

const yearlyCountdown = (
  now: Date,
  getTarget: (year: number) => Date,
): { remaining: string; progress: number } => {
  const target = getTarget(now.getFullYear())
  const next = target > now ? target : getTarget(now.getFullYear() + 1)
  const previous = getTarget(next.getFullYear() - 1)

  const total = next.getTime() - previous.getTime()
  const elapsed = now.getTime() - previous.getTime()

  return {
    remaining: formatDuration(next.getTime() - now.getTime()),
    progress: clampPercent((elapsed / total) * 100),
  }
}

const getSecondSundayInMay = (year: number) => {
  const date = new Date(year, 4, 1)
  const firstSundayOffset = (7 - date.getDay()) % 7
  const secondSunday = 1 + firstSundayOffset + 7
  return new Date(year, 4, secondSunday, 0, 0, 0, 0)
}

const getThirdSundayInJune = (year: number) => {
  const date = new Date(year, 5, 1)
  const firstSundayOffset = (7 - date.getDay()) % 7
  const thirdSunday = 1 + firstSundayOffset + 14
  return new Date(year, 5, thirdSunday, 0, 0, 0, 0)
}

const getFourthThursdayInNovember = (year: number) => {
  const date = new Date(year, 10, 1)
  const firstThursdayOffset = (4 - date.getDay() + 7) % 7
  const fourthThursday = 1 + firstThursdayOffset + 21
  return new Date(year, 10, fourthThursday, 0, 0, 0, 0)
}

const getEasterDate = (year: number) => {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

const moonCountdown = (now: Date, phaseIndex: number) => {
  const nowMs = now.getTime()
  const cycleAge =
    ((nowMs - REFERENCE_NEW_MOON_MS) % SYNODIC_MONTH_MS + SYNODIC_MONTH_MS) %
    SYNODIC_MONTH_MS
  const targetAge = phaseIndex * MOON_PHASE_MS

  let delta = targetAge - cycleAge
  if (delta <= 0) {
    delta += SYNODIC_MONTH_MS
  }

  return {
    remaining: formatDuration(delta),
    progress: clampPercent(((SYNODIC_MONTH_MS - delta) / SYNODIC_MONTH_MS) * 100),
  }
}

const nextStepYearCountdown = (now: Date, step: number) => {
  const currentYear = now.getFullYear()
  const nextYear = Math.floor(currentYear / step) * step + step
  const next = new Date(nextYear, 0, 1, 0, 0, 0, 0)
  const previous = new Date(nextYear - step, 0, 1, 0, 0, 0, 0)

  const total = next.getTime() - previous.getTime()
  const elapsed = now.getTime() - previous.getTime()

  return {
    remaining: formatDuration(next.getTime() - now.getTime()),
    progress: clampPercent((elapsed / total) * 100),
  }
}

const longHorizonCountdown = (
  now: Date,
  yearsFromEpoch: number,
): { remaining: string; progress: number } => {
  const elapsedYears = (now.getTime() - APP_EPOCH_MS) / YEAR_MS
  const remainingYears = Math.max(0, yearsFromEpoch - elapsedYears)

  return {
    remaining: formatYearsRemaining(remainingYears),
    progress: clampPercent((elapsedYears / yearsFromEpoch) * 100),
  }
}

const groupsTemplate: GroupTemplate[] = [
  {
    title: 'Clockwork',
    subtitle: 'Short cycles that keep resetting throughout the day.',
    items: [
      {
        label: 'Next minute',
        icon: '⏱️',
        tone: 'emerald',
        compute: (now) => {
          const next = new Date(now)
          next.setSeconds(0, 0)
          next.setMinutes(next.getMinutes() + 1)

          const remainingSeconds = Math.ceil((next.getTime() - now.getTime()) / SECOND_MS)
          const progress =
            ((now.getSeconds() + now.getMilliseconds() / SECOND_MS) / 60) * 100

          return {
            remaining: `${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'} left`,
            progress: clampPercent(progress),
          }
        },
      },
      {
        label: 'Next hour',
        icon: '🕒',
        tone: 'amber',
        compute: (now) => {
          const next = new Date(now)
          next.setMinutes(0, 0, 0)
          next.setHours(next.getHours() + 1)
          const previous = new Date(next.getTime() - HOUR_MS)

          return {
            remaining: formatDuration(next.getTime() - now.getTime()),
            progress: clampPercent(
              ((now.getTime() - previous.getTime()) / HOUR_MS) * 100,
            ),
          }
        },
      },
      {
        label: 'Next day',
        icon: '📆',
        tone: 'sky',
        compute: (now) => {
          const next = new Date(now)
          next.setHours(24, 0, 0, 0)
          const previous = new Date(next.getTime() - DAY_MS)

          return {
            remaining: formatDuration(next.getTime() - now.getTime()),
            progress: clampPercent(
              ((now.getTime() - previous.getTime()) / DAY_MS) * 100,
            ),
          }
        },
      },
      {
        label: 'Next month',
        icon: '🗓️',
        tone: 'sage',
        compute: (now) => {
          const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0)
          const previous = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
          const total = next.getTime() - previous.getTime()

          return {
            remaining: formatDuration(next.getTime() - now.getTime()),
            progress: clampPercent(((now.getTime() - previous.getTime()) / total) * 100),
          }
        },
      },
      {
        label: 'Next year',
        icon: '🌍',
        tone: 'rust',
        compute: (now) => {
          const next = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0)
          const previous = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
          const total = next.getTime() - previous.getTime()

          return {
            remaining: formatDuration(next.getTime() - now.getTime()),
            progress: clampPercent(((now.getTime() - previous.getTime()) / total) * 100),
          }
        },
      },
    ],
  },
  {
    title: 'Seasons',
    subtitle: 'Recurring milestones that define the calendar.',
    items: [
      {
        label: "Next Valentine's Day",
        icon: '💘',
        tone: 'rose',
        compute: (now) => yearlyCountdown(now, (year) => new Date(year, 1, 14)),
      },
      {
        label: "Next Saint Patrick's Day",
        icon: '☘️',
        tone: 'mint',
        compute: (now) => yearlyCountdown(now, (year) => new Date(year, 2, 17)),
      },
      {
        label: 'Next Easter',
        icon: '🐣',
        tone: 'lavender',
        compute: (now) => yearlyCountdown(now, getEasterDate),
      },
      {
        label: "Next Mother's Day",
        icon: '🌷',
        tone: 'peach',
        compute: (now) => yearlyCountdown(now, getSecondSundayInMay),
      },
      {
        label: "Next Father's Day",
        icon: '🧢',
        tone: 'cobalt',
        compute: (now) => yearlyCountdown(now, getThirdSundayInJune),
      },
      {
        label: 'Next Halloween',
        icon: '🎃',
        tone: 'orange',
        compute: (now) => yearlyCountdown(now, (year) => new Date(year, 9, 31)),
      },
      {
        label: 'Next Thanksgiving',
        icon: '🦃',
        tone: 'brown',
        compute: (now) => yearlyCountdown(now, getFourthThursdayInNovember),
      },
      {
        label: 'Next Christmas',
        icon: '🎄',
        tone: 'green',
        compute: (now) => yearlyCountdown(now, (year) => new Date(year, 11, 25)),
      },
      {
        label: 'Next weekend',
        icon: '🧭',
        tone: 'ink',
        compute: (now) => {
          const day = now.getDay()
          const daysUntilSaturday = (6 - day + 7) % 7
          const target = new Date(now)
          target.setHours(0, 0, 0, 0)
          target.setDate(target.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday))

          const previous = new Date(target.getTime() - 7 * DAY_MS)
          const total = target.getTime() - previous.getTime()

          return {
            remaining: formatDuration(target.getTime() - now.getTime()),
            progress: clampPercent(((now.getTime() - previous.getTime()) / total) * 100),
          }
        },
      },
    ],
  },
  {
    title: 'Moon Phase',
    subtitle: 'A compact lunar sequence with its own rhythm.',
    items: [
      { label: 'Next New Moon', icon: '🌑', tone: 'ink', compute: (now) => moonCountdown(now, 0) },
      {
        label: 'Next Waxing Crescent',
        icon: '🌒',
        tone: 'emerald',
        compute: (now) => moonCountdown(now, 1),
      },
      {
        label: 'Next Quarter Moon',
        icon: '🌓',
        tone: 'amber',
        compute: (now) => moonCountdown(now, 2),
      },
      {
        label: 'Next Waxing Gibbous',
        icon: '🌔',
        tone: 'sky',
        compute: (now) => moonCountdown(now, 3),
      },
      {
        label: 'Next Full Moon',
        icon: '🌕',
        tone: 'gold',
        compute: (now) => moonCountdown(now, 4),
      },
      {
        label: 'Next Waning Gibbous',
        icon: '🌖',
        tone: 'plum',
        compute: (now) => moonCountdown(now, 5),
      },
      {
        label: 'Next Last Quarter Moon',
        icon: '🌗',
        tone: 'slate',
        compute: (now) => moonCountdown(now, 6),
      },
      {
        label: 'Next Waning Crescent',
        icon: '🌘',
        tone: 'night',
        compute: (now) => moonCountdown(now, 7),
      },
    ],
  },
  {
    title: 'Deep Time',
    subtitle: 'Slow processes that stretch far beyond daily life.',
    items: [
      {
        label: 'Next decade',
        icon: '🗺️',
        tone: 'emerald',
        compute: (now) => nextStepYearCountdown(now, 10),
      },
      {
        label: 'Next century',
        icon: '🏛️',
        tone: 'amber',
        compute: (now) => nextStepYearCountdown(now, 100),
      },
      {
        label: 'Next millennium',
        icon: '🕰️',
        tone: 'sky',
        compute: (now) => nextStepYearCountdown(now, 1000),
      },
      {
        label: "Halley's Comet returns",
        icon: '☄️',
        tone: 'rust',
        compute: (now) => {
          const target = new Date(2061, 6, 28, 0, 0, 0, 0)
          const previous = new Date(1986, 1, 9, 0, 0, 0, 0)
          const total = target.getTime() - previous.getTime()
          const elapsed = now.getTime() - previous.getTime()

          return {
            remaining: formatDuration(target.getTime() - now.getTime()),
            progress: clampPercent((elapsed / total) * 100),
          }
        },
      },
      {
        label: 'Chernobyl is fully safe again',
        icon: '🏗️',
        tone: 'mint',
        compute: (now) => {
          const target = new Date(2200, 0, 1, 0, 0, 0, 0)
          const previous = new Date(1986, 3, 26, 0, 0, 0, 0)
          const total = target.getTime() - previous.getTime()
          const elapsed = now.getTime() - previous.getTime()

          return {
            remaining: formatDuration(target.getTime() - now.getTime()),
            progress: clampPercent((elapsed / total) * 100),
          }
        },
      },
      {
        label: 'Voyager 1 reaches the Oort Cloud',
        icon: '🛰️',
        tone: 'cobalt',
        compute: (now) => {
          const target = new Date(2310, 0, 1, 0, 0, 0, 0)
          const previous = new Date(1977, 8, 5, 0, 0, 0, 0)
          const total = target.getTime() - previous.getTime()
          const elapsed = now.getTime() - previous.getTime()

          return {
            remaining: formatDuration(target.getTime() - now.getTime()),
            progress: clampPercent((elapsed / total) * 100),
          }
        },
      },
      {
        label: 'Milky Way collides with Andromeda',
        icon: '🌌',
        tone: 'plum',
        compute: (now) => longHorizonCountdown(now, 4_000_000_000),
      },
      {
        label: 'The Sun dies',
        icon: '☀️',
        tone: 'gold',
        compute: (now) => longHorizonCountdown(now, 5_000_000_000),
      },
      {
        label: 'Heat Death of the Universe',
        icon: '❄️',
        tone: 'ink',
        compute: (now) => longHorizonCountdown(now, 1e100),
      },
    ],
  },
]

const buildGroups = (now: Date): ProcessGroup[] =>
  groupsTemplate.map((group) => ({
    title: group.title,
    subtitle: group.subtitle,
    items: group.items.map((item) => {
      const dynamic = item.compute(now)

      return {
        label: item.label,
        icon: item.icon,
        tone: item.tone,
        remaining: dynamic.remaining,
        progress: dynamic.progress,
      }
    }),
  }))

function App() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date())
    }, SECOND_MS)

    return () => {
      window.clearInterval(id)
    }
  }, [])

  const groups = useMemo(() => buildGroups(now), [now])

  const nowLabel = new Intl.DateTimeFormat('en', {
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(now)

  const allItems = groups.flatMap((group) => group.items)
  const averageProgress = Math.round(
    allItems.reduce((sum, item) => sum + item.progress, 0) / allItems.length,
  )

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Process atlas</p>
          <h1>See time as a living stack of processes.</h1>
          <p className="hero-text">
            A visual dashboard for countdowns, recurring cycles, and long-range
            milestones. Each row is computed from the live clock and refreshed
            every second.
          </p>

          <div className="hero-stats">
            <article>
              <span>Snapshot</span>
              <strong>{nowLabel}</strong>
            </article>
            <article>
              <span>Tracked processes</span>
              <strong>{allItems.length}</strong>
            </article>
            <article>
              <span>Average progress</span>
              <strong>{averageProgress}%</strong>
            </article>
          </div>
        </div>

        <aside className="hero-side">
          <div className="orbit-card">
            <span className="orbit-label">Current mode</span>
            <strong>Countdown / Cycle / Horizon</strong>
            <p>
              The same interface can show minutes, holidays, moon phases, or
              cosmic timescales without changing the layout.
            </p>
          </div>

          <div className="progress-ring" aria-hidden="true">
            <div className="progress-ring__inner">
              <span>Process load</span>
              <strong>{averageProgress}%</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="section-stack">
        {groups.map((group) => (
          <section className="group-card" key={group.title}>
            <div className="group-header">
              <div>
                <p className="eyebrow">{group.title}</p>
                <h2>{group.subtitle}</h2>
              </div>
            </div>

            <div className="item-list">
              {group.items.map((item, index) => (
                <article
                  className={`item-row tone-${item.tone}`}
                  key={item.label}
                  style={{ '--delay': `${index * 90}ms` } as CSSProperties}
                >
                  <div className="item-topline">
                    <div className="item-label">
                      <span className="item-icon" aria-hidden="true">
                        {item.icon}
                      </span>
                      <strong>{item.label}</strong>
                    </div>
                    <span className="item-remaining">{item.remaining}</span>
                  </div>

                  <div className="track" aria-hidden="true">
                    <div
                      className="fill"
                      style={{ '--fill': `${item.progress}%` } as CSSProperties}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </section>
    </main>
  )
}

export default App
