import { useEffect, useState } from 'react'

/**
 * Bilgisayarın yerel sistem saatini saniyede bir günceller.
 * Tüm tarih/saat gösterimleri bu hook üzerinden new Date()'e dayanır.
 */
export function useClock(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
