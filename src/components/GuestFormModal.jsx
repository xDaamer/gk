import { X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api } from '../lib/api'
import { FLOORS, floorLabel } from '../lib/floorPlan'

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function calcNights(checkIn, checkOut) {
  const inMs = new Date(checkIn).getTime()
  const outMs = new Date(checkOut).getTime()
  if (Number.isNaN(inMs) || Number.isNaN(outMs) || outMs <= inMs) return 0
  return Math.max(1, Math.round((outMs - inMs) / (24 * 60 * 60 * 1000)))
}

const EMPTY_FORM = () => {
  const now = new Date()
  return {
    tcNo: '',
    fullName: '',
    phone: '',
    roomNumber: '',
    checkInDate: toLocalInputValue(now),
    checkOutDate: toLocalInputValue(addDays(now, 1)),
    pricingMode: 'nightly',
    pricePerNight: '',
    totalPrice: '',
    paymentStatus: 'pending',
    paidAmount: '',
    notes: '',
  }
}

// Modal her açılışta üst bileşen tarafından yeni bir `key` ile mount edilir,
// bu yüzden form durumu burada bir kez, doğrudan başlatılır (effect gerekmez).
export default function GuestFormModal({ open, rooms = [], onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const nights = useMemo(
    () => calcNights(form.checkInDate, form.checkOutDate),
    [form.checkInDate, form.checkOutDate],
  )

  // Oda listesi kata göre gruplanır; dolu odalar seçilemez, kirli odalar işaretlenir.
  const roomsByFloor = useMemo(
    () =>
      FLOORS.map((floor) => ({
        floor,
        rooms: rooms.filter((room) => room.floor === floor),
      })).filter((group) => group.rooms.length > 0),
    [rooms],
  )

  // Gecelik <-> Toplam senkronizasyonu: biri değişince diğeri türetilir.
  function handlePricePerNightChange(value) {
    setForm((prev) => ({
      ...prev,
      pricingMode: 'nightly',
      pricePerNight: value,
      totalPrice: value === '' ? '' : String(Math.round(Number(value) * nights * 100) / 100),
    }))
  }

  function handleTotalPriceChange(value) {
    setForm((prev) => ({
      ...prev,
      pricingMode: 'total',
      totalPrice: value,
      pricePerNight:
        value === '' || nights === 0
          ? ''
          : String(Math.round((Number(value) / nights) * 100) / 100),
    }))
  }

  function handleDateChange(field, value) {
    setForm((prev) => {
      const draft = { ...prev, [field]: value }
      const n = calcNights(draft.checkInDate, draft.checkOutDate)
      if (n === 0) return draft
      // Aktif fiyat moduna göre diğer alanı tarih değişince yeniden hesapla.
      if (draft.pricingMode === 'nightly' && draft.pricePerNight !== '') {
        draft.totalPrice = String(Math.round(Number(draft.pricePerNight) * n * 100) / 100)
      } else if (draft.pricingMode === 'total' && draft.totalPrice !== '') {
        draft.pricePerNight = String(Math.round((Number(draft.totalPrice) / n) * 100) / 100)
      }
      return draft
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!form.tcNo || !form.fullName || !form.phone || !form.roomNumber) {
      setError('Lütfen zorunlu alanları doldurun.')
      return
    }
    if (nights === 0) {
      setError('Çıkış tarihi, giriş tarihinden sonra olmalıdır.')
      return
    }
    const rateValue = form.pricingMode === 'nightly' ? form.pricePerNight : form.totalPrice
    if (!(Number(rateValue) > 0)) {
      setError('Lütfen geçerli bir fiyat girin.')
      return
    }

    setSubmitting(true)
    try {
      const created = await api.createGuest({
        tcNo: form.tcNo.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        roomNumber: form.roomNumber.trim(),
        checkInDate: new Date(form.checkInDate).toISOString(),
        checkOutDate: new Date(form.checkOutDate).toISOString(),
        pricingMode: form.pricingMode,
        pricePerNight: Number(form.pricePerNight) || 0,
        totalPrice: Number(form.totalPrice) || 0,
        paymentStatus: form.paymentStatus,
        paidAmount: Number(form.paidAmount) || 0,
        notes: form.notes.trim(),
      })
      onCreated?.(created)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--surface-card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <h2 className="font-display text-lg tracking-wide text-[var(--ink)]">
            Yeni Misafir Kaydı
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--ink-muted)] transition hover:bg-black/5 hover:text-[var(--ink)]"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="TC Kimlik No" required>
              <input
                className="input"
                value={form.tcNo}
                maxLength={11}
                inputMode="numeric"
                onChange={(e) => setForm((f) => ({ ...f, tcNo: e.target.value }))}
              />
            </Field>
            <Field label="İsim Soyisim" required>
              <input
                className="input"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </Field>
            <Field label="Telefon" required>
              <input
                className="input"
                value={form.phone}
                inputMode="tel"
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </Field>
            <Field label="Oda No" required>
              <select
                className="input"
                value={form.roomNumber}
                onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))}
              >
                <option value="">Oda seçin…</option>
                {roomsByFloor.map((group) => (
                  <optgroup key={group.floor} label={floorLabel(group.floor)}>
                    {group.rooms.map((room) => (
                      <option key={room.roomNumber} value={room.roomNumber} disabled={room.occupied}>
                        {room.roomNumber}
                        {room.occupied
                          ? ' — dolu'
                          : room.housekeeping === 'dirty'
                            ? ' — boş (kirli)'
                            : ' — boş (temiz)'}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="Giriş Tarihi/Saati" required>
              <input
                type="datetime-local"
                className="input"
                value={form.checkInDate}
                onChange={(e) => handleDateChange('checkInDate', e.target.value)}
              />
            </Field>
            <Field label="Çıkış Tarihi/Saati" required>
              <input
                type="datetime-local"
                className="input"
                value={form.checkOutDate}
                onChange={(e) => handleDateChange('checkOutDate', e.target.value)}
              />
            </Field>
          </div>

          <div className="rounded-lg border border-[var(--line)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Fiyatlandırma · {nights > 0 ? `${nights} gece` : '— gece'}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Gecelik Fiyat (₺)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input font-mono tabular-nums"
                  value={form.pricePerNight}
                  onChange={(e) => handlePricePerNightChange(e.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="Toplam Fiyat (₺)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input font-mono tabular-nums"
                  value={form.totalPrice}
                  onChange={(e) => handleTotalPriceChange(e.target.value)}
                  placeholder="0"
                />
              </Field>
            </div>
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              {form.pricingMode === 'nightly'
                ? 'Gecelik fiyat esas alınıyor, toplam otomatik hesaplanıyor.'
                : 'Toplam fiyat esas alınıyor, gecelik tutar otomatik hesaplanıyor.'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Ödeme Durumu">
              <select
                className="input"
                value={form.paymentStatus}
                onChange={(e) => setForm((f) => ({ ...f, paymentStatus: e.target.value }))}
              >
                <option value="pending">Bekliyor</option>
                <option value="partial">Kısmi Ödendi</option>
                <option value="paid">Ödendi</option>
              </select>
            </Field>
            <Field label="Ödenen Tutar (₺)">
              <input
                type="number"
                min="0"
                step="0.01"
                className="input font-mono tabular-nums"
                value={form.paidAmount}
                onChange={(e) => setForm((f) => ({ ...f, paidAmount: e.target.value }))}
                placeholder="0"
              />
            </Field>
          </div>

          <Field label="Notlar">
            <textarea
              className="input min-h-20 resize-y"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Ör. Ön cephe, sessiz oda"
            />
          </Field>

          {error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-4">
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
              {submitting ? 'Kaydediliyor…' : 'Misafiri Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--ink-muted)]">
        {label} {required && <span className="text-[var(--brass)]">*</span>}
      </span>
      {children}
    </label>
  )
}
