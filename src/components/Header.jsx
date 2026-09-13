import { useClock } from '../hooks/useClock'
import { formatDateLong, formatDayName, formatTime } from '../lib/format'

function Crest() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <rect
        x="7"
        y="7"
        width="16"
        height="16"
        stroke="var(--brass)"
        strokeWidth="1.2"
        transform="rotate(45 15 15)"
      />
      <circle cx="15" cy="15" r="2" fill="var(--brass)" />
    </svg>
  )
}

export default function Header() {
  const now = useClock()

  return (
    <header className="bg-[var(--surface-header)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <Crest />
          <div>
            <p className="font-display text-xl tracking-[0.06em] text-[var(--ink)]">GK REGENCY</p>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--ink-muted)]">
              Otel &amp; Konaklama
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--ink-muted)]">
            {formatDayName(now)} · {formatDateLong(now)}
          </p>
          <div className="mt-1.5 inline-flex rounded-md border border-[var(--brass-soft)] bg-[var(--plaque-bg)] px-4 py-1.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.12)]">
            <span className="font-mono text-2xl font-medium tracking-wider text-[var(--brass)] tabular-nums">
              {formatTime(now)}
            </span>
          </div>
        </div>
      </div>
      <div className="h-px bg-[linear-gradient(90deg,transparent,var(--brass)_50%,transparent)] opacity-50" />
    </header>
  )
}
