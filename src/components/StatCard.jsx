export default function StatCard({ eyebrow, value, caption, icon: Icon, loading }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-card)] p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
          {eyebrow}
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--brass-soft)] text-[var(--brass)]">
          <Icon size={16} strokeWidth={1.75} />
        </span>
      </div>
      <p className="mt-4 font-mono text-3xl font-medium tabular-nums text-[var(--ink)]">
        {loading ? '—' : value}
      </p>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">{caption}</p>
    </div>
  )
}
