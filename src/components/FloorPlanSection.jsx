import { BrushCleaning, ChevronDown, ChevronUp, MousePointer2, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api'
import {
  FLOORS,
  MAX_FLOOR,
  MIN_FLOOR,
  ROOM_STATE_STYLE,
  clampFloor,
  floorLabel,
  roomState,
} from '../lib/floorPlan'
import { formatDateShort } from '../lib/format'
import FloorPlan from './FloorPlan'

const WHEEL_THRESHOLD = 26 // trackpad'in küçük adımlarını biriktir
const WHEEL_LOCK_MS = 280 // iki kat değişimi arasındaki asgari süre

const LEGEND = [
  { state: 'clean', label: 'Temiz · Boş' },
  { state: 'dirty', label: 'Kirli' },
  { state: 'occupied', label: 'Dolu' },
  { state: 'critical', label: 'Çıkışa ≤ 3 gün' },
]

function LegendSwatch({ state }) {
  const style = ROOM_STATE_STYLE[state]
  return (
    <span
      className="inline-block h-3 w-3 shrink-0 rounded-[3px]"
      style={{ background: style.fill, border: `1.5px solid ${style.stroke}` }}
    />
  )
}

function Counter({ value, label, tone }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-mono text-sm font-semibold tabular-nums" style={{ color: tone }}>
        {value}
      </span>
      <span className="text-xs text-[var(--ink-muted)]">{label}</span>
    </span>
  )
}

function RoomDetail({ room, busy, onSetHousekeeping }) {
  if (!room) {
    return (
      <div className="flex h-full flex-col justify-center rounded-xl border border-dashed border-[var(--line)] p-5 text-center">
        <MousePointer2 size={18} className="mx-auto mb-2 text-[var(--ink-muted)]" />
        <p className="text-sm text-[var(--ink-muted)]">
          Detay ve temizlik durumu için plandan bir oda seçin.
        </p>
      </div>
    )
  }

  const state = roomState(room)
  const style = ROOM_STATE_STYLE[state]
  const isDirty = room.housekeeping === 'dirty'

  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--line)] bg-[var(--surface-card)] p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-2xl font-semibold text-[var(--ink)]">
          {room.roomNumber}
        </span>
        <span
          className="rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{
            background: state === 'clean' ? 'var(--forest-soft)' : style.fill,
            color: state === 'occupied' || state === 'critical' ? style.text : style.text,
            border: `1px solid ${style.stroke}`,
          }}
        >
          {style.label}
        </span>
      </div>
      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
        {floorLabel(room.floor)}
      </p>

      {room.guest ? (
        <dl className="mt-4 space-y-2 border-t border-[var(--line)] pt-4 text-sm">
          <div>
            <dt className="text-xs text-[var(--ink-muted)]">Misafir</dt>
            <dd className="font-medium text-[var(--ink)]">{room.guest.fullName}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--ink-muted)]">Telefon</dt>
            <dd className="font-mono text-[var(--ink)]">{room.guest.phone}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--ink-muted)]">Konaklama</dt>
            <dd className="font-mono text-[var(--ink)]">
              {formatDateShort(room.guest.checkInDate)} → {formatDateShort(room.guest.checkOutDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--ink-muted)]">Kalan</dt>
            <dd
              className={`font-mono ${
                room.guest.displayStatus === 'critical' ? 'text-red-600' : 'text-[var(--ink)]'
              }`}
            >
              {room.guest.remainingDays < 0
                ? 'Süresi geçti'
                : room.guest.remainingDays === 0
                  ? 'Bugün çıkış'
                  : `${room.guest.remainingDays} gün`}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4 border-t border-[var(--line)] pt-4 text-sm text-[var(--ink-muted)]">
          Oda boş.
        </p>
      )}

      <div className="mt-auto pt-5">
        <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">Temizlik</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy || !isDirty}
            onClick={() => onSetHousekeeping(room.roomNumber, 'clean')}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[var(--forest-line)] px-3 py-2 text-xs font-semibold text-[var(--forest-text)] transition hover:bg-[var(--forest-soft)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles size={13} />
            Temiz
          </button>
          <button
            type="button"
            disabled={busy || isDirty}
            onClick={() => onSetHousekeeping(room.roomNumber, 'dirty')}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[var(--soil-line)] px-3 py-2 text-xs font-semibold text-[var(--soil)] transition hover:bg-[var(--soil-soft)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <BrushCleaning size={13} />
            Kirli
          </button>
        </div>
        {room.housekeepingUpdatedAt && (
          <p className="mt-2 text-[11px] text-[var(--ink-muted)]">
            Son güncelleme: {formatDateShort(room.housekeepingUpdatedAt)}
          </p>
        )}
      </div>
    </div>
  )
}

export default function FloorPlanSection({ rooms, onRoomsChanged }) {
  const [floor, setFloor] = useState(MIN_FLOOR)
  const [direction, setDirection] = useState('up')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const planRef = useRef(null)
  const floorRef = useRef(floor)
  const wheelAccRef = useRef(0)
  const wheelLockRef = useRef(0)

  useEffect(() => {
    floorRef.current = floor
  }, [floor])

  const goToFloor = useCallback((next) => {
    const target = clampFloor(next)
    setDirection(target > floorRef.current ? 'up' : 'down')
    setFloor(target)
    setSelectedRoom(null)
  }, [])

  // Fare tekerleği: yukarı kaydır -> üst kat, aşağı kaydır -> alt kat.
  // Uçlara gelindiğinde preventDefault yapılmaz; sayfa normal şekilde kayar.
  useEffect(() => {
    const el = planRef.current
    if (!el) return

    function handleWheel(event) {
      const step = event.deltaY > 0 ? -1 : 1
      const next = floorRef.current + step
      if (next < MIN_FLOOR || next > MAX_FLOOR) return

      event.preventDefault()

      const now = Date.now()
      if (now < wheelLockRef.current) return

      wheelAccRef.current += Math.abs(event.deltaY)
      if (wheelAccRef.current < WHEEL_THRESHOLD) return

      wheelAccRef.current = 0
      wheelLockRef.current = now + WHEEL_LOCK_MS
      goToFloor(next)
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [goToFloor])

  const roomsByNumber = useMemo(() => {
    const map = new Map()
    for (const room of rooms) map.set(room.roomNumber, room)
    return map
  }, [rooms])

  const counts = useMemo(() => {
    const acc = { occupied: 0, dirty: 0, clean: 0 }
    for (const room of rooms) {
      if (room.occupied) acc.occupied += 1
      else if (room.housekeeping === 'dirty') acc.dirty += 1
      else acc.clean += 1
    }
    return acc
  }, [rooms])

  async function handleSetHousekeeping(roomNumber, status) {
    setBusy(true)
    setError(null)
    try {
      await api.setHousekeeping(roomNumber, status)
      await onRoomsChanged?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const selected = selectedRoom ? roomsByNumber.get(selectedRoom) : null

  return (
    <section className="mt-10">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-4">
          <h2 className="font-display text-xl font-medium text-[var(--ink)]">Kat Planı</h2>
          <div className="flex items-center gap-4">
            <Counter value={counts.occupied} label="dolu" tone="var(--forest)" />
            <Counter value={counts.dirty} label="kirli" tone="var(--soil)" />
            <Counter value={counts.clean} label="temiz" tone="var(--ink-muted)" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {LEGEND.map((item) => (
            <span key={item.state} className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
              <LegendSwatch state={item.state} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_270px]">
        <div
          ref={planRef}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              goToFloor(floor + 1)
            } else if (e.key === 'ArrowDown') {
              e.preventDefault()
              goToFloor(floor - 1)
            }
          }}
          className="relative overscroll-contain rounded-xl border border-[var(--line)] bg-[var(--surface-card)] p-4 pl-16 outline-none focus-visible:border-[var(--brass)] sm:p-6 sm:pl-20"
        >
          {/* Kat seçici ray: 6 üstte, zemin altta */}
          <div className="absolute left-3 top-1/2 flex -translate-y-1/2 flex-col items-center gap-1 sm:left-4">
            <ChevronUp
              size={14}
              className={floor === MAX_FLOOR ? 'text-[var(--line)]' : 'text-[var(--ink-muted)]'}
            />
            {[...FLOORS].reverse().map((f) => {
              const isActive = f === floor
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => goToFloor(f)}
                  aria-current={isActive ? 'true' : undefined}
                  title={floorLabel(f)}
                  className={`h-8 w-8 rounded-md font-mono text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[var(--forest)] text-[var(--btn-primary-text)]'
                      : 'text-[var(--ink-muted)] hover:bg-[var(--forest-soft)] hover:text-[var(--forest-text)]'
                  }`}
                >
                  {f}
                </button>
              )
            })}
            <ChevronDown
              size={14}
              className={floor === MIN_FLOOR ? 'text-[var(--line)]' : 'text-[var(--ink-muted)]'}
            />
          </div>

          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="font-display text-lg text-[var(--ink)]">{floorLabel(floor)}</h3>
            <span className="text-[11px] text-[var(--ink-muted)]">
              Katlar arası gezinmek için plan üzerinde fareyle kaydırın
            </span>
          </div>

          <div key={floor} className={direction === 'up' ? 'floor-enter-up' : 'floor-enter-down'}>
            <FloorPlan
              floor={floor}
              roomsByNumber={roomsByNumber}
              selectedRoom={selectedRoom}
              onSelectRoom={setSelectedRoom}
            />
          </div>
        </div>

        <RoomDetail room={selected} busy={busy} onSetHousekeeping={handleSetHousekeeping} />
      </div>
    </section>
  )
}
