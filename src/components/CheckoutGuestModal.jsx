import { X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function calcNights(checkIn, checkOut) {
  const inMs = new Date(checkIn).getTime()
  const outMs = new Date(checkOut).getTime()
  if (Number.isNaN(inMs) || Number.isNaN(outMs) || outMs <= inMs) return 0
  return Math.max(1, Math.round((outMs - inMs) / (24 * 60 * 60 * 1000)))
}

export default function CheckoutGuestModal({ guest, onClose, onCheckedOut }) {
  const [actualCheckOutDate, setActualCheckOutDate] = useState(() => toLocalInputValue(new Date()))
  const isEarly = useMemo(
    () => new Date(actualCheckOutDate).getTime() < new Date(guest.checkOutDate).getTime(),
    [actualCheckOutDate, guest.checkOutDate],
  )
  const [applyPriceRevision, setApplyPriceRevision] = useState(isEarly)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const actualNights = calcNights(guest.checkInDate, actualCheckOutDate)
  const suggestedTotal = actualNights > 0 ? guest.pricePerNight * actualNights : guest.totalPrice

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await api.checkoutGuest(guest.id, {
        actualCheckOutDate: new Date(actualCheckOutDate).toISOString(),
        applyPriceRevision,
      })
      onCheckedOut?.(result)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--line)] bg-[var(--surface-card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <h2 className="font-display text-lg tracking-wide text-[var(--ink)]">Çıkış İşlemi</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--ink-muted)] transition hover:bg-black/5 hover:text-[var(--ink)]"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <p className="text-sm text-[var(--ink-muted)]">
            <span className="font-medium text-[var(--ink)]">{guest.fullName}</span> · Oda{' '}
            {guest.roomNumber}
          </p>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[var(--ink-muted)]">
              Çıkış Anı
            </span>
            <input
              type="datetime-local"
              className="input"
              value={actualCheckOutDate}
              onChange={(e) => setActualCheckOutDate(e.target.value)}
            />
          </label>

          <div className="rounded-lg border border-[var(--line)] p-4 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-[var(--ink-muted)]">Planlanan</span>
              <span className="font-mono tabular-nums">
                {guest.nights} gece · {formatCurrency(guest.totalPrice)}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--ink-muted)]">Gerçek konaklama</span>
              <span className="font-mono font-semibold tabular-nums text-[var(--ink)]">
                {actualNights} gece · {formatCurrency(suggestedTotal)}
              </span>
            </div>
          </div>

          {isEarly && (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={applyPriceRevision}
                onChange={(e) => setApplyPriceRevision(e.target.checked)}
              />
              <span className="text-[var(--ink-muted)]">
                Erken çıkış — tutarı gerçek konaklanan geceye göre revize et (
                <span className="font-medium text-[var(--ink)]">{formatCurrency(suggestedTotal)}</span>
                )
              </span>
            </label>
          )}

          {error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-black/5"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-[var(--btn-primary-bg)] px-4 py-2 text-sm font-medium text-[var(--btn-primary-text)] transition hover:bg-[var(--btn-primary-bg-hover)] disabled:opacity-60"
            >
              {submitting ? 'İşleniyor…' : 'Çıkışı Onayla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
