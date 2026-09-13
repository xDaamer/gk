import { X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'

function toLocalInputValue(value) {
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function calcNights(checkIn, checkOut) {
  const inMs = new Date(checkIn).getTime()
  const outMs = new Date(checkOut).getTime()
  if (Number.isNaN(inMs) || Number.isNaN(outMs) || outMs <= inMs) return 0
  return Math.max(1, Math.round((outMs - inMs) / (24 * 60 * 60 * 1000)))
}

export default function ExtendGuestModal({ guest, onClose, onExtended }) {
  const [newCheckOutDate, setNewCheckOutDate] = useState(() => toLocalInputValue(guest.checkOutDate))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const newNights = useMemo(
    () => calcNights(guest.checkInDate, newCheckOutDate),
    [guest.checkInDate, newCheckOutDate],
  )
  // Uzatma her zaman misafirin kurulu gecelik ORANINI korur (bkz. server/logic.js
  // applyExtension) — bu yüzden önizleme aynı formülü kullanır.
  const newTotal = newNights > 0 ? guest.pricePerNight * newNights : 0
  const difference = newTotal - guest.totalPrice

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (newNights === 0) {
      setError('Yeni çıkış tarihi, giriş tarihinden sonra olmalıdır.')
      return
    }
    setSubmitting(true)
    try {
      const updated = await api.extendGuest(guest.id, {
        newCheckOutDate: new Date(newCheckOutDate).toISOString(),
      })
      onExtended?.(updated)
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
          <h2 className="font-display text-lg tracking-wide text-[var(--ink)]">Tarih Uzat</h2>
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
              Yeni Çıkış Tarihi/Saati
            </span>
            <input
              type="datetime-local"
              className="input"
              value={newCheckOutDate}
              onChange={(e) => setNewCheckOutDate(e.target.value)}
            />
          </label>

          <div className="rounded-lg border border-[var(--line)] p-4 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-[var(--ink-muted)]">Mevcut</span>
              <span className="font-mono tabular-nums">
                {guest.nights} gece · {formatCurrency(guest.totalPrice)}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--ink-muted)]">Yeni</span>
              <span className="font-mono font-semibold tabular-nums text-[var(--ink)]">
                {newNights} gece · {formatCurrency(newTotal)}
              </span>
            </div>
            <div className="mt-2 flex justify-between border-t border-[var(--line)] pt-2">
              <span className="text-[var(--ink-muted)]">Fark</span>
              <span
                className={`font-mono font-semibold tabular-nums ${difference >= 0 ? 'text-emerald-700' : 'text-red-600'}`}
              >
                {difference >= 0 ? '+' : ''}
                {formatCurrency(difference)}
              </span>
            </div>
          </div>

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
              {submitting ? 'Kaydediliyor…' : 'Tarihi Uzat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
