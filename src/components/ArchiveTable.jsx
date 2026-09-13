import { Fragment, useState } from 'react'
import { formatCurrency, formatDateShort } from '../lib/format'

const PAYMENT_LABEL = { paid: 'Ödendi', partial: 'Kısmi', pending: 'Bekliyor' }

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--ink-muted)]">
        {label}
      </div>
      <div className="mt-0.5 text-[var(--ink)]">{value}</div>
    </div>
  )
}

export default function ArchiveTable({ records, loading }) {
  const [expandedId, setExpandedId] = useState(null)

  if (loading) {
    return <p className="py-10 text-center text-sm text-[var(--ink-muted)]">Yükleniyor…</p>
  }

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--line)] py-14 text-center">
        <p className="text-sm text-[var(--ink-muted)]">Arşivde kayıt bulunamadı.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
      <table className="w-full min-w-[820px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--line)] bg-black/[0.02] text-left text-[11px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
            <th className="px-4 py-3 font-semibold">Oda</th>
            <th className="px-4 py-3 font-semibold">Misafir</th>
            <th className="px-4 py-3 font-semibold">Giriş</th>
            <th className="px-4 py-3 font-semibold">Çıkış</th>
            <th className="px-4 py-3 font-semibold">Gece</th>
            <th className="px-4 py-3 text-right font-semibold">Tutar</th>
            <th className="px-4 py-3 font-semibold">Ödeme</th>
            <th className="px-4 py-3 font-semibold">Arşivlendi</th>
          </tr>
        </thead>
        <tbody>
          {records.map((g) => {
            const expanded = expandedId === g.id
            return (
              <Fragment key={g.id}>
                <tr
                  onClick={() => setExpandedId(expanded ? null : g.id)}
                  className="cursor-pointer border-b border-[var(--line)] last:border-0 hover:bg-black/[0.02]"
                >
                  <td className="px-4 py-3 font-mono text-[var(--ink)]">{g.roomNumber}</td>
                  <td className="px-4 py-3 font-medium text-[var(--ink)]">{g.fullName}</td>
                  <td className="px-4 py-3 font-mono text-[var(--ink-muted)]">
                    {formatDateShort(g.checkInDate)}
                  </td>
                  <td className="px-4 py-3 font-mono text-[var(--ink-muted)]">
                    {formatDateShort(g.actualCheckOutDate || g.checkOutDate)}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-[var(--ink)]">
                    {g.nights}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-[var(--ink)]">
                    {formatCurrency(g.totalPrice)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-[var(--brass-soft)] px-2 py-0.5 text-xs text-[var(--brass)]">
                      {PAYMENT_LABEL[g.paymentStatus] || g.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--ink-muted)]">
                    {g.archivedAt ? formatDateShort(g.archivedAt) : '—'}
                  </td>
                </tr>
                {expanded && (
                  <tr className="border-b border-[var(--line)] bg-black/[0.015]">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
                        <Detail label="TC Kimlik No" value={g.tcNo} />
                        <Detail label="Telefon" value={g.phone} />
                        <Detail label="Ödenen Tutar" value={formatCurrency(g.paidAmount)} />
                        <Detail
                          label="Kalan Bakiye"
                          value={formatCurrency(Math.max(0, (g.totalPrice || 0) - (g.paidAmount || 0)))}
                        />
                        <div className="col-span-2 sm:col-span-4">
                          <Detail label="Notlar" value={g.notes || '—'} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
