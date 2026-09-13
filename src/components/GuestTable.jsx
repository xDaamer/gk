import { CalendarClock, DoorOpen } from 'lucide-react'
import { formatCurrency, formatDateShort } from '../lib/format'

function HousekeepingBadge({ status }) {
  if (!status) return <span className="text-xs text-[var(--ink-muted)]">—</span>
  const dirty = status === 'dirty'
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{
        borderColor: dirty ? 'var(--soil-line)' : 'var(--forest-line)',
        color: dirty ? 'var(--soil)' : 'var(--forest-text)',
        background: dirty ? 'var(--soil-soft)' : 'var(--forest-soft)',
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: dirty ? 'var(--soil)' : 'var(--forest)' }}
      />
      {dirty ? 'Kirli' : 'Temiz'}
    </span>
  )
}

const PAYMENT_LABEL = { paid: 'Ödendi', partial: 'Kısmi', pending: 'Bekliyor' }

function remainingLabel(remainingDays) {
  if (remainingDays < 0) return 'Süresi geçti'
  if (remainingDays === 0) return 'Bugün çıkış'
  return `${remainingDays} gün kaldı`
}

function StatusBadge({ guest }) {
  if (guest.displayStatus === 'critical') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-600/10 px-2 py-0.5 text-xs font-semibold text-red-600">
        {remainingLabel(guest.remainingDays)}
      </span>
    )
  }
  if (guest.displayStatus === 'checked_out') {
    return (
      <span className="inline-flex items-center rounded-full bg-black/10 px-2 py-0.5 text-xs font-medium text-[var(--ink-muted)]">
        Çıkış Yaptı
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--brass-soft)] px-2 py-0.5 text-xs text-[var(--brass)]">
      Konaklıyor
    </span>
  )
}

function rowClass(displayStatus) {
  if (displayStatus === 'critical') {
    return 'border-l-4 border-l-red-500 bg-red-500/[0.06] hover:bg-red-500/[0.1]'
  }
  if (displayStatus === 'checked_out') {
    return 'border-l-4 border-l-transparent bg-black/[0.025] text-[var(--ink-muted)]'
  }
  return 'border-l-4 border-l-transparent hover:bg-black/[0.02]'
}

export default function GuestTable({ guests, loading, housekeepingByRoom, onExtend, onCheckout }) {
  if (loading) {
    return <p className="py-10 text-center text-sm text-[var(--ink-muted)]">Yükleniyor…</p>
  }

  if (guests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--line)] py-14 text-center">
        <p className="text-sm text-[var(--ink-muted)]">Kayıt bulunamadı.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--line)] bg-black/[0.02] text-left text-[11px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
            <th className="px-4 py-3 font-semibold">Oda</th>
            <th className="px-4 py-3 font-semibold">Temizlik</th>
            <th className="px-4 py-3 font-semibold">Misafir</th>
            <th className="px-4 py-3 font-semibold">Giriş</th>
            <th className="px-4 py-3 font-semibold">Çıkış</th>
            <th className="px-4 py-3 font-semibold">Gece</th>
            <th className="px-4 py-3 text-right font-semibold">Tutar</th>
            <th className="px-4 py-3 font-semibold">Ödeme</th>
            <th className="px-4 py-3 font-semibold">Durum</th>
            <th className="px-4 py-3 font-semibold">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {guests.map((g) => {
            const isActive = g.status === 'active'
            return (
              <tr key={g.id} className={`border-b border-[var(--line)] last:border-0 ${rowClass(g.displayStatus)}`}>
                <td className="px-4 py-3 font-mono text-[var(--ink)]">{g.roomNumber}</td>
                <td className="px-4 py-3">
                  <HousekeepingBadge status={housekeepingByRoom?.get(String(g.roomNumber))} />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-[var(--ink)]">{g.fullName}</div>
                  <div className="text-xs text-[var(--ink-muted)]">{g.phone}</div>
                </td>
                <td className="px-4 py-3 font-mono text-[var(--ink-muted)]">
                  {formatDateShort(g.checkInDate)}
                </td>
                <td className="px-4 py-3 font-mono text-[var(--ink-muted)]">
                  {formatDateShort(g.checkOutDate)}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums text-[var(--ink)]">{g.nights}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-[var(--ink)]">
                  {formatCurrency(g.totalPrice)}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-[var(--brass-soft)] px-2 py-0.5 text-xs text-[var(--brass)]">
                    {PAYMENT_LABEL[g.paymentStatus] || g.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge guest={g} />
                </td>
                <td className="px-4 py-3">
                  {isActive ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onExtend?.(g)}
                        title="Tarih Uzat"
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] px-2 py-1 text-xs font-medium text-[var(--ink)] transition hover:border-[var(--brass)] hover:text-[var(--brass)]"
                      >
                        <CalendarClock size={13} />
                        Uzat
                      </button>
                      <button
                        type="button"
                        onClick={() => onCheckout?.(g)}
                        title="Erken / Normal Çıkış"
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] px-2 py-1 text-xs font-medium text-[var(--ink)] transition hover:border-red-500 hover:text-red-600"
                      >
                        <DoorOpen size={13} />
                        Çıkış
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--ink-muted)]">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
