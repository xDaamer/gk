import { randomUUID } from 'node:crypto'
import cors from 'cors'
import express from 'express'

import { runArchiveSweep } from './server/archive.js'
import {
  applyExtension,
  calcNights,
  deriveDisplayStatus,
  getRemainingDays,
  syncPricing,
} from './server/logic.js'
import {
  ALL_ROOMS,
  HOUSEKEEPING_STATUSES,
  floorOf,
  housekeepingOf,
  isKnownRoom,
  setHousekeeping,
} from './server/rooms.js'
import { computeStats } from './server/stats.js'
import { readDb, updateDb, writeDb } from './server/store.js'

const PORT = process.env.PORT || 5001
const ARCHIVE_SWEEP_INTERVAL_MS = 15 * 60 * 1000 // 15 dakikada bir otomatik kontrol

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' })) // yedek içe aktarma için varsayılan 100kb limiti yetersiz kalabilir

// --- yardımcılar -----------------------------------------------------------

function withComputed(guest, now = new Date()) {
  return {
    ...guest,
    nights: calcNights(guest.checkInDate, guest.checkOutDate),
    remainingDays: getRemainingDays(guest.checkOutDate, now),
    displayStatus: deriveDisplayStatus(guest, now),
  }
}

const REQUIRED_FIELDS = [
  'tcNo',
  'fullName',
  'phone',
  'roomNumber',
  'checkInDate',
  'checkOutDate',
  'pricingMode',
]

function validateGuestPayload(body) {
  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = body[field]
    return value === undefined || value === null || value === ''
  })
  if (missing.length > 0) {
    return `Eksik alanlar: ${missing.join(', ')}`
  }
  if (!isKnownRoom(body.roomNumber)) {
    return `Bilinmeyen oda numarası: ${body.roomNumber}`
  }
  if (!['nightly', 'total'].includes(body.pricingMode)) {
    return "pricingMode 'nightly' veya 'total' olmalıdır"
  }
  if (body.pricingMode === 'nightly' && !(Number(body.pricePerNight) > 0)) {
    return 'pricePerNight pozitif bir sayı olmalıdır'
  }
  if (body.pricingMode === 'total' && !(Number(body.totalPrice) > 0)) {
    return 'totalPrice pozitif bir sayı olmalıdır'
  }
  if (Number.isNaN(new Date(body.checkInDate).getTime())) {
    return 'checkInDate geçerli bir tarih olmalıdır'
  }
  if (Number.isNaN(new Date(body.checkOutDate).getTime())) {
    return 'checkOutDate geçerli bir tarih olmalıdır'
  }
  if (new Date(body.checkOutDate).getTime() <= new Date(body.checkInDate).getTime()) {
    return 'checkOutDate, checkInDate tarihinden sonra olmalıdır'
  }
  if (body.paymentStatus && !['paid', 'partial', 'pending'].includes(body.paymentStatus)) {
    return "paymentStatus 'paid', 'partial' veya 'pending' olmalıdır"
  }
  return null
}

// --- sağlık kontrolü ---------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

// --- misafirler ----------------------------------------------------------

app.get('/api/guests', async (_req, res, next) => {
  try {
    await runArchiveSweep()
    const db = await readDb()
    const now = new Date()
    res.json(db.guests.map((g) => withComputed(g, now)))
  } catch (err) {
    next(err)
  }
})

app.post('/api/guests', async (req, res, next) => {
  try {
    const validationError = validateGuestPayload(req.body)
    if (validationError) {
      return res.status(400).json({ error: validationError })
    }

    const now = new Date().toISOString()
    const draft = {
      id: randomUUID(),
      tcNo: String(req.body.tcNo),
      fullName: String(req.body.fullName),
      phone: String(req.body.phone),
      roomNumber: String(req.body.roomNumber),
      checkInDate: req.body.checkInDate,
      checkOutDate: req.body.checkOutDate,
      pricingMode: req.body.pricingMode,
      pricePerNight: Number(req.body.pricePerNight) || 0,
      totalPrice: Number(req.body.totalPrice) || 0,
      paymentStatus: req.body.paymentStatus || 'pending',
      paidAmount: Number(req.body.paidAmount) || 0,
      notes: req.body.notes || '',
      status: 'active',
      actualCheckOutDate: null,
      createdAt: now,
    }

    const guest = syncPricing(draft)

    const saved = await updateDb((db) => {
      db.guests.push(guest)
      return guest
    })

    res.status(201).json(withComputed(saved))
  } catch (err) {
    next(err)
  }
})

app.get('/api/guests/:id', async (req, res, next) => {
  try {
    const db = await readDb()
    const guest =
      db.guests.find((g) => g.id === req.params.id) ||
      db.archive.find((g) => g.id === req.params.id)
    if (!guest) return res.status(404).json({ error: 'Misafir bulunamadı' })
    res.json(withComputed(guest))
  } catch (err) {
    next(err)
  }
})

app.put('/api/guests/:id', async (req, res, next) => {
  try {
    const updated = await updateDb((db) => {
      const idx = db.guests.findIndex((g) => g.id === req.params.id)
      if (idx === -1) return null

      const merged = { ...db.guests[idx], ...req.body, id: db.guests[idx].id }
      const guest = syncPricing(merged)
      db.guests[idx] = guest
      return guest
    })

    if (!updated) return res.status(404).json({ error: 'Misafir bulunamadı' })
    res.json(withComputed(updated))
  } catch (err) {
    next(err)
  }
})

app.delete('/api/guests/:id', async (req, res, next) => {
  try {
    const removed = await updateDb((db) => {
      const idx = db.guests.findIndex((g) => g.id === req.params.id)
      if (idx === -1) return null
      const [guest] = db.guests.splice(idx, 1)
      return guest
    })

    if (!removed) return res.status(404).json({ error: 'Misafir bulunamadı' })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// --- erken/normal çıkış ----------------------------------------------------

app.post('/api/guests/:id/checkout', async (req, res, next) => {
  try {
    const now = new Date()
    const actualCheckOutDate = req.body?.actualCheckOutDate || now.toISOString()
    const applyPriceRevision = Boolean(req.body?.applyPriceRevision)

    const updated = await updateDb((db) => {
      const idx = db.guests.findIndex((g) => g.id === req.params.id)
      if (idx === -1) return null

      const guest = { ...db.guests[idx] }
      const actualNights = calcNights(guest.checkInDate, actualCheckOutDate)
      const suggestedTotalPrice = Math.round(guest.pricePerNight * actualNights * 100) / 100

      guest.status = 'checked_out'
      guest.actualCheckOutDate = actualCheckOutDate

      if (applyPriceRevision) {
        guest.totalPrice = suggestedTotalPrice
        guest.checkOutDate = actualCheckOutDate
      }

      db.guests[idx] = guest
      // Çıkış yapılan oda otomatik olarak "kirli" işaretlenir.
      setHousekeeping(db, guest.roomNumber, 'dirty', now)
      return { guest, actualNights, suggestedTotalPrice }
    })

    if (!updated) return res.status(404).json({ error: 'Misafir bulunamadı' })

    res.json({
      ...withComputed(updated.guest),
      suggestedRevision: {
        actualNights: updated.actualNights,
        suggestedTotalPrice: updated.suggestedTotalPrice,
        applied: applyPriceRevision,
      },
    })
  } catch (err) {
    next(err)
  }
})

// --- tarih uzatma ----------------------------------------------------------

app.post('/api/guests/:id/extend', async (req, res, next) => {
  try {
    const { newCheckOutDate } = req.body || {}
    if (!newCheckOutDate || Number.isNaN(new Date(newCheckOutDate).getTime())) {
      return res.status(400).json({ error: 'Geçerli bir newCheckOutDate gereklidir' })
    }

    const updated = await updateDb((db) => {
      const idx = db.guests.findIndex((g) => g.id === req.params.id)
      if (idx === -1) return null

      if (new Date(newCheckOutDate).getTime() <= new Date(db.guests[idx].checkInDate).getTime()) {
        throw new Error('newCheckOutDate, checkInDate tarihinden sonra olmalıdır')
      }

      const guest = applyExtension(db.guests[idx], newCheckOutDate)
      db.guests[idx] = guest
      return guest
    })

    if (!updated) return res.status(404).json({ error: 'Misafir bulunamadı' })
    res.json(withComputed(updated))
  } catch (err) {
    if (err.message?.includes('checkInDate')) {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
})

// --- odalar & temizlik (kirli/temiz) ------------------------------------

function toOccupantSummary(guest, now) {
  return {
    id: guest.id,
    fullName: guest.fullName,
    phone: guest.phone,
    checkInDate: guest.checkInDate,
    checkOutDate: guest.checkOutDate,
    paymentStatus: guest.paymentStatus,
    remainingDays: getRemainingDays(guest.checkOutDate, now),
    displayStatus: deriveDisplayStatus(guest, now),
  }
}

/**
 * Bir oda birden fazla misafir barındırabilir (paylaşımlı daireler).
 * `guests` çıkışı en yakın olandan başlayarak sıralanır; `guest` bu ilk
 * misafirdir ve odanın plandaki rengini/etiketini belirler.
 */
function buildRoomView(db, now = new Date()) {
  const activeByRoom = new Map()
  for (const guest of db.guests) {
    if (guest.status !== 'active') continue
    const key = String(guest.roomNumber)
    const bucket = activeByRoom.get(key)
    if (bucket) bucket.push(guest)
    else activeByRoom.set(key, [guest])
  }

  return ALL_ROOMS.map((roomNumber) => {
    const occupants = (activeByRoom.get(roomNumber) ?? [])
      .map((guest) => toOccupantSummary(guest, now))
      .sort((a, b) => new Date(a.checkOutDate) - new Date(b.checkOutDate))

    return {
      roomNumber,
      floor: floorOf(roomNumber),
      housekeeping: housekeepingOf(db, roomNumber),
      housekeepingUpdatedAt: db.housekeeping?.[roomNumber]?.updatedAt ?? null,
      occupied: occupants.length > 0,
      occupantCount: occupants.length,
      guests: occupants,
      guest: occupants[0] ?? null,
    }
  })
}

app.get('/api/rooms', async (_req, res, next) => {
  try {
    await runArchiveSweep()
    const db = await readDb()
    res.json(buildRoomView(db))
  } catch (err) {
    next(err)
  }
})

app.patch('/api/rooms/:roomNumber/housekeeping', async (req, res, next) => {
  try {
    const roomNumber = String(req.params.roomNumber)
    if (!isKnownRoom(roomNumber)) {
      return res.status(404).json({ error: 'Oda bulunamadı' })
    }

    const { status } = req.body || {}
    if (!HOUSEKEEPING_STATUSES.includes(status)) {
      return res.status(400).json({ error: "status 'clean' veya 'dirty' olmalıdır" })
    }

    const entry = await updateDb((db) => setHousekeeping(db, roomNumber, status))
    res.json({ roomNumber, floor: floorOf(roomNumber), ...entry })
  } catch (err) {
    next(err)
  }
})

// --- arşiv -----------------------------------------------------------------

app.get('/api/archive', async (req, res, next) => {
  try {
    await runArchiveSweep()
    const db = await readDb()
    const q = (req.query.q || '').toString().trim().toLowerCase()

    let results = db.archive
    if (q) {
      results = results.filter(
        (g) =>
          g.fullName?.toLowerCase().includes(q) ||
          g.tcNo?.toLowerCase?.().includes(q) ||
          g.roomNumber?.toString().includes(q) ||
          g.phone?.includes(q),
      )
    }

    res.json(results.map((g) => withComputed(g)))
  } catch (err) {
    next(err)
  }
})

// --- yedekleme (export / import) --------------------------------------

app.get('/api/export', async (_req, res, next) => {
  try {
    const db = await readDb()
    const date = new Date().toISOString().slice(0, 10)
    res.setHeader('Content-Disposition', `attachment; filename="gk-regency-backup-${date}.json"`)
    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify(db, null, 2))
  } catch (err) {
    next(err)
  }
})

function isValidGuestRecord(record) {
  return (
    record &&
    typeof record === 'object' &&
    typeof record.id === 'string' &&
    typeof record.fullName === 'string'
  )
}

app.post('/api/import', async (req, res, next) => {
  try {
    const { guests, archive, housekeeping } = req.body || {}
    if (!Array.isArray(guests) || !Array.isArray(archive)) {
      return res
        .status(400)
        .json({ error: 'Geçersiz yedek dosyası: guests ve archive dizileri gerekli' })
    }
    if (![...guests, ...archive].every(isValidGuestRecord)) {
      return res.status(400).json({ error: 'Geçersiz yedek dosyası: kayıt formatı tanınmadı' })
    }

    const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v)
    await writeDb({ guests, archive, housekeeping: isPlainObject(housekeeping) ? housekeeping : {} })
    res.json({ ok: true, guests: guests.length, archive: archive.length })
  } catch (err) {
    next(err)
  }
})

// --- istatistikler -----------------------------------------------------

app.get('/api/stats', async (_req, res, next) => {
  try {
    await runArchiveSweep()
    const db = await readDb()
    res.json(computeStats(db))
  } catch (err) {
    next(err)
  }
})

// --- hata yakalayıcı ---------------------------------------------------

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Sunucu hatası', detail: err.message })
})

app.listen(PORT, () => {
  console.log(`GK Regency API http://localhost:${PORT} adresinde çalışıyor`)
  // Başlangıçta ve ardından periyodik olarak 72 saat kuralını kontrol et.
  runArchiveSweep().catch((err) => console.error('Arşiv taraması başarısız:', err))
  setInterval(() => {
    runArchiveSweep().catch((err) => console.error('Arşiv taraması başarısız:', err))
  }, ARCHIVE_SWEEP_INTERVAL_MS)
})
