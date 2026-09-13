import { Plus, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import CheckoutGuestModal from './CheckoutGuestModal'
import ExtendGuestModal from './ExtendGuestModal'
import GuestFormModal from './GuestFormModal'
import GuestTable from './GuestTable'

function matchesQuery(guest, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    guest.fullName?.toLowerCase().includes(q) ||
    guest.tcNo?.toLowerCase().includes(q) ||
    guest.roomNumber?.toString().toLowerCase().includes(q) ||
    guest.phone?.includes(q)
  )
}

export default function GuestsSection({ rooms = [], onChanged }) {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalKey, setModalKey] = useState(0)
  const [extendingGuest, setExtendingGuest] = useState(null)
  const [checkingOutGuest, setCheckingOutGuest] = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await api.getGuests()
      setGuests(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => guests.filter((g) => matchesQuery(g, query)), [guests, query])

  const housekeepingByRoom = useMemo(
    () => new Map(rooms.map((room) => [room.roomNumber, room.housekeeping])),
    [rooms],
  )

  function handleCreated() {
    load()
    onChanged?.()
  }

  function openModal() {
    setModalKey((k) => k + 1) // yeni bir key -> modal temiz bir formla mount edilir
    setModalOpen(true)
  }

  function handleExtended() {
    setExtendingGuest(null)
    load()
    onChanged?.()
  }

  function handleCheckedOut() {
    setCheckingOutGuest(null)
    load()
    onChanged?.()
  }

  return (
    <section className="mt-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-medium text-[var(--ink)]">Misafirler</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="İsim, oda, telefon veya TC ile ara…"
              className="input w-64 pl-9"
            />
          </div>
          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--btn-primary-bg)] px-4 py-2 text-sm font-medium text-[var(--btn-primary-text)] transition hover:bg-[var(--btn-primary-bg-hover)]"
          >
            <Plus size={16} />
            Yeni Misafir
          </button>
        </div>
      </div>

      <GuestTable
        guests={filtered}
        loading={loading}
        housekeepingByRoom={housekeepingByRoom}
        onExtend={setExtendingGuest}
        onCheckout={setCheckingOutGuest}
      />

      <GuestFormModal
        key={modalKey}
        open={modalOpen}
        rooms={rooms}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />

      {extendingGuest && (
        <ExtendGuestModal
          guest={extendingGuest}
          onClose={() => setExtendingGuest(null)}
          onExtended={handleExtended}
        />
      )}

      {checkingOutGuest && (
        <CheckoutGuestModal
          guest={checkingOutGuest}
          onClose={() => setCheckingOutGuest(null)}
          onCheckedOut={handleCheckedOut}
        />
      )}
    </section>
  )
}
