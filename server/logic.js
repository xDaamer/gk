const MS_PER_DAY = 24 * 60 * 60 * 1000
const ARCHIVE_AFTER_MS = 72 * 60 * 60 * 1000 // 72 saat

/**
 * Giriş/çıkış tarihleri arasındaki gece sayısını hesaplar. Asgari 1 gece.
 */
export function calcNights(checkInDate, checkOutDate) {
  const inMs = new Date(checkInDate).getTime()
  const outMs = new Date(checkOutDate).getTime()
  if (Number.isNaN(inMs) || Number.isNaN(outMs) || outMs <= inMs) return 1
  return Math.max(1, Math.round((outMs - inMs) / MS_PER_DAY))
}

/**
 * pricingMode'a göre pricePerNight <-> totalPrice senkronizasyonunu yapar.
 * guest objesini mutasyona uğratmadan güncellenmiş halini döner.
 */
export function syncPricing(guest) {
  const nights = calcNights(guest.checkInDate, guest.checkOutDate)
  const next = { ...guest }

  if (guest.pricingMode === 'total') {
    const total = Number(guest.totalPrice) || 0
    next.totalPrice = total
    next.pricePerNight = nights > 0 ? Math.round((total / nights) * 100) / 100 : 0
  } else {
    // varsayılan: nightly
    const perNight = Number(guest.pricePerNight) || 0
    next.pricePerNight = perNight
    next.totalPrice = Math.round(perNight * nights * 100) / 100
  }

  return next
}

/**
 * Tarih uzatmayı uygular. pricingMode ne olursa olsun, misafirin kurulduğu
 * gecelik ORANI (pricePerNight) sabit tutulur ve yeni gece sayısına göre
 * totalPrice yeniden hesaplanır. (syncPricing'i 'total' modunda doğrudan
 * kullanmak yanlış olurdu: totalPrice'ı sabit tutup pricePerNight'ı küçültür,
 * bu da ek geceleri fiilen ücretsiz yapar.)
 */
export function applyExtension(guest, newCheckOutDate) {
  const nights = calcNights(guest.checkInDate, newCheckOutDate)
  const pricePerNight = Number(guest.pricePerNight) || 0
  const totalPrice = Math.round(pricePerNight * nights * 100) / 100
  return { ...guest, checkOutDate: newCheckOutDate, pricePerNight, totalPrice }
}

/**
 * Kalan gece sayısını (bugünden çıkış tarihine) hesaplar. Negatif olabilir (süre geçmiş).
 */
export function getRemainingDays(checkOutDate, now = new Date()) {
  const outMs = new Date(checkOutDate).getTime()
  if (Number.isNaN(outMs)) return null
  return Math.ceil((outMs - now.getTime()) / MS_PER_DAY)
}

/**
 * Bir misafirin arayüzde nasıl gösterileceğini belirleyen türetilmiş durumu döner:
 * 'critical' | 'normal' | 'checked_out' | 'expired'
 * ('expired' = 72 saat kuralı geçmiş, arşive taşınmayı bekliyor / arşivde)
 */
export function deriveDisplayStatus(guest, now = new Date()) {
  if (guest.status === 'archived') return 'archived'

  if (guest.status === 'checked_out') {
    const outAt = new Date(guest.actualCheckOutDate ?? guest.checkOutDate).getTime()
    const elapsed = now.getTime() - outAt
    return elapsed >= ARCHIVE_AFTER_MS ? 'expired' : 'checked_out'
  }

  // status === 'active'
  const remaining = getRemainingDays(guest.checkOutDate, now)
  if (remaining !== null && remaining <= 3) return 'critical'
  return 'normal'
}

/**
 * Çıkış anının üzerinden 72 saat geçip geçmediğini kontrol eder.
 */
export function isPastArchiveWindow(guest, now = new Date()) {
  if (guest.status !== 'checked_out') return false
  const outAt = new Date(guest.actualCheckOutDate ?? guest.checkOutDate).getTime()
  if (Number.isNaN(outAt)) return false
  return now.getTime() - outAt >= ARCHIVE_AFTER_MS
}

export { ARCHIVE_AFTER_MS, MS_PER_DAY }
