import { useCallback, useEffect, useState } from 'react'
import Dashboard from '../components/Dashboard'
import FloorPlanSection from '../components/FloorPlanSection'
import GuestsSection from '../components/GuestsSection'
import { api } from '../lib/api'

export default function DashboardPage() {
  const [version, setVersion] = useState(0)
  const [rooms, setRooms] = useState([])

  // Oda/temizlik durumlarını tazeler; misafir işlemlerinden sonra da çağrılır.
  const loadRooms = useCallback(async () => {
    try {
      const data = await api.getRooms()
      setRooms(data)
    } catch {
      // Oda durumu ikincil bilgidir; hata halinde plan son bilinen veriyle kalır.
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await api.getRooms()
        if (!cancelled) setRooms(data)
      } catch {
        // yoksay
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Misafir eklendi/çıkış yapıldı/uzatıldı: istatistikler ve oda durumları tazelenir.
  const handleGuestsChanged = useCallback(() => {
    setVersion((v) => v + 1)
    return loadRooms()
  }, [loadRooms])

  return (
    <>
      <Dashboard refreshSignal={version} />
      <GuestsSection rooms={rooms} onChanged={handleGuestsChanged} />
      <FloorPlanSection rooms={rooms} onRoomsChanged={loadRooms} />
    </>
  )
}
