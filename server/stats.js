import { ALL_ROOMS, housekeepingOf } from './rooms.js'

function isSameCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * Dashboard istatistiklerini hesaplar.
 * - activeOccupancy: şu an aktif (konaklamakta olan) misafir/oda sayısı
 * - monthlyRevenue: bu ay giriş yapan konaklamalardan tahsil edilmiş toplam tutar
 * - pendingRevenue: aktif konaklamalardan henüz tahsil edilmemiş tahmini gelir
 * - todaysCheckouts: bugün çıkışı planlanan aktif misafir sayısı
 * - totalRooms / dirtyRooms: oda envanteri ve temizlik bekleyen oda sayısı
 */
export function computeStats(db, now = new Date()) {
  const activeGuests = db.guests.filter((g) => g.status === 'active')

  const activeOccupancy = activeGuests.length

  const allKnownGuests = [...db.guests, ...db.archive]
  const monthlyRevenue = allKnownGuests
    .filter((g) => {
      const checkIn = new Date(g.checkInDate)
      return (
        !Number.isNaN(checkIn.getTime()) &&
        checkIn.getFullYear() === now.getFullYear() &&
        checkIn.getMonth() === now.getMonth()
      )
    })
    .reduce((sum, g) => sum + (Number(g.paidAmount) || 0), 0)

  const pendingRevenue = activeGuests
    .filter((g) => g.paymentStatus !== 'paid')
    .reduce((sum, g) => {
      const total = Number(g.totalPrice) || 0
      const paid = Number(g.paidAmount) || 0
      return sum + Math.max(0, total - paid)
    }, 0)

  const todaysCheckouts = activeGuests.filter((g) => {
    const checkOut = new Date(g.checkOutDate)
    return !Number.isNaN(checkOut.getTime()) && isSameCalendarDay(checkOut, now)
  }).length

  const dirtyRooms = ALL_ROOMS.filter((room) => housekeepingOf(db, room) === 'dirty').length

  return {
    activeOccupancy,
    totalRooms: ALL_ROOMS.length,
    dirtyRooms,
    monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
    pendingRevenue: Math.round(pendingRevenue * 100) / 100,
    todaysCheckouts,
  }
}
