import { isPastArchiveWindow } from './logic.js'
import { readDb, updateDb } from './store.js'

/**
 * Çıkışının üzerinden 72 saat geçmiş misafirleri guests dizisinden alıp
 * archive dizisine taşır. Taşınan kayıtları döner. Taşınacak kayıt yoksa
 * diske yazmadan erken çıkar.
 */
export async function runArchiveSweep(now = new Date()) {
  const current = await readDb()
  const hasExpired = current.guests.some((guest) => isPastArchiveWindow(guest, now))
  if (!hasExpired) return []

  return updateDb((db) => {
    const remaining = []
    const moved = []

    for (const guest of db.guests) {
      if (isPastArchiveWindow(guest, now)) {
        moved.push({ ...guest, status: 'archived', archivedAt: now.toISOString() })
      } else {
        remaining.push(guest)
      }
    }

    db.guests = remaining
    db.archive = [...db.archive, ...moved]

    return moved
  })
}
