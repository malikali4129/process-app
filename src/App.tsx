import type { CSSProperties } from 'react'
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

const groups: ProcessGroup[] = [
  {
    title: 'Clockwork',
    subtitle: 'Short cycles that keep resetting throughout the day.',
    items: [
      { label: 'Next minute', remaining: '21 seconds left', progress: 65, icon: '⏱️', tone: 'emerald' },
      { label: 'Next hour', remaining: '46 minutes left', progress: 23, icon: '🕒', tone: 'amber' },
      { label: 'Next day', remaining: '4 hours left', progress: 83, icon: '📆', tone: 'sky' },
      { label: 'Next month', remaining: '14 days left', progress: 54, icon: '🗓️', tone: 'sage' },
      { label: 'Next year', remaining: '259 days left', progress: 29, icon: '🌍', tone: 'rust' },
    ],
  },
  {
    title: 'Seasons',
    subtitle: 'Recurring milestones that define the calendar.',
    items: [
      { label: "Next Valentine's Day", remaining: '303 days left', progress: 15, icon: '💘', tone: 'rose' },
      { label: "Next Saint Patrick's Day", remaining: '334 days left', progress: 7, icon: '☘️', tone: 'mint' },
      { label: 'Next Easter', remaining: '345 days left', progress: 4, icon: '🐣', tone: 'lavender' },
      { label: "Next Mother's Day", remaining: '23 days left', progress: 92, icon: '🌷', tone: 'peach' },
      { label: "Next Father's Day", remaining: '65 days left', progress: 80, icon: '🧢', tone: 'cobalt' },
      { label: 'Next Halloween', remaining: '197 days left', progress: 46, icon: '🎃', tone: 'orange' },
      { label: 'Next Thanksgiving', remaining: '223 days left', progress: 39, icon: '🦃', tone: 'brown' },
      { label: 'Next Christmas', remaining: '252 days left', progress: 31, icon: '🎄', tone: 'green' },
      { label: 'End of this page', remaining: '2080 pixels left', progress: 56, icon: '🧭', tone: 'ink' },
    ],
  },
  {
    title: 'Moon Phase',
    subtitle: 'A compact lunar sequence with its own rhythm.',
    items: [
      { label: 'Next New Moon', remaining: '0 days left', progress: 100, icon: '🌑', tone: 'ink' },
      { label: 'Next Waxing Crescent', remaining: '4 days left', progress: 88, icon: '🌒', tone: 'emerald' },
      { label: 'Next Quarter Moon', remaining: '7 days left', progress: 77, icon: '🌓', tone: 'amber' },
      { label: 'Next Waxing Gibbous', remaining: '11 days left', progress: 66, icon: '🌔', tone: 'sky' },
      { label: 'Next Full Moon', remaining: '15 days left', progress: 55, icon: '🌕', tone: 'gold' },
      { label: 'Next Waning Gibbous', remaining: '18 days left', progress: 43, icon: '🌖', tone: 'plum' },
      { label: 'Next Last Quarter Moon', remaining: '22 days left', progress: 31, icon: '🌗', tone: 'slate' },
      { label: 'Next Waning Crescent', remaining: '25 days left', progress: 18, icon: '🌘', tone: 'night' },
    ],
  },
  {
    title: 'Deep Time',
    subtitle: 'Slow processes that stretch far beyond daily life.',
    items: [
      { label: 'Next decade', remaining: '4 years left', progress: 61, icon: '🗺️', tone: 'emerald' },
      { label: 'Next century', remaining: '74 years left', progress: 26, icon: '🏛️', tone: 'amber' },
      { label: 'Next millennium', remaining: '974 years left', progress: 4, icon: '🕰️', tone: 'sky' },
      { label: "Halley's Comet returns", remaining: '35 years left', progress: 69, icon: '☄️', tone: 'rust' },
      { label: 'Chernobyl is fully safe again', remaining: '174 years left', progress: 21, icon: '🏗️', tone: 'mint' },
      { label: 'Voyager 1 reaches the Oort Cloud', remaining: '284 years left', progress: 17, icon: '🛰️', tone: 'cobalt' },
      { label: 'Milky Way collides with Andromeda', remaining: '4 billion years left', progress: 70, icon: '🌌', tone: 'plum' },
      { label: 'The Sun dies', remaining: '5 billion years left', progress: 52, icon: '☀️', tone: 'gold' },
      { label: 'Heat Death of the Universe', remaining: '10^100 years left', progress: 8, icon: '❄️', tone: 'ink' },
    ],
  },
]

function App() {
  const nowLabel = new Intl.DateTimeFormat('en', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date())

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
            milestones. Each row is a process with a remaining state and a live
            progress bar.
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
              {group.items.map((item) => (
                <article className={`item-row tone-${item.tone}`} key={item.label}>
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
