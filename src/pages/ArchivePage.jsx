import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import ArchiveTable from '../components/ArchiveTable'
import { api } from '../lib/api'

export default function ArchivePage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    // Basit debounce: her tuş vuruşunda değil, yazma durunca sorgula.
    const timer = setTimeout(async () => {
      try {
        const data = await api.getArchive(query)
        if (!cancelled) setRecords(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-medium text-[var(--ink)]">Arşiv</h2>
          <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
            Çıkışının üzerinden 72 saat geçen kayıtlar otomatik olarak buraya taşınır.
          </p>
        </div>
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
            className="input w-72 pl-9"
          />
        </div>
      </div>

      <ArchiveTable records={records} loading={loading} />
    </section>
  )
}
