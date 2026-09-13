import { BedDouble, DoorOpen, Landmark, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'
import StatCard from './StatCard'

const REFRESH_MS = 60_000

export default function Dashboard({ refreshSignal }) {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await api.getStats()
        if (!cancelled) {
          setStats(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }

    load()
    const id = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
    // refreshSignal değiştiğinde (ör. yeni misafir eklendiğinde) anında yenile.
  }, [refreshSignal])

  return (
    <section>
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-display text-xl font-medium text-[var(--ink)]">Kontrol Paneli</h2>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          eyebrow="Aktif Doluluk"
          icon={BedDouble}
          loading={!stats}
          value={stats ? `${stats.activeOccupancy}/${stats.totalRooms}` : null}
          caption={
            stats?.dirtyRooms
              ? `${stats.dirtyRooms} oda temizlik bekliyor`
              : 'şu an konaklayan oda'
          }
        />
        <StatCard
          eyebrow="Aylık Toplam Ciro"
          icon={Landmark}
          loading={!stats}
          value={stats ? formatCurrency(stats.monthlyRevenue) : null}
          caption="bu ay tahsil edilen"
        />
        <StatCard
          eyebrow="Tahmini Kalan Gelir"
          icon={TrendingUp}
          loading={!stats}
          value={stats ? formatCurrency(stats.pendingRevenue) : null}
          caption="aktif rezervasyonlardan"
        />
        <StatCard
          eyebrow="Bugün Çıkış Yapacak"
          icon={DoorOpen}
          loading={!stats}
          value={stats?.todaysCheckouts}
          caption="oda teslim edilecek"
        />
      </div>
    </section>
  )
}
