/**
 * Otelin sabit oda envanteri.
 * - 1. kat (zemin): 101, 102, 103 + Lobi / Merdiven / Asansör
 * - 2-6. katlar: x01 … x06 (x = kat numarası)
 */

export const FLOORS = [1, 2, 3, 4, 5, 6]

const GROUND_FLOOR_ROOMS = ['101', '102', '103']
const TYPICAL_FLOOR_SLOTS = [1, 2, 3, 4, 5, 6]

export function roomsForFloor(floor) {
  if (floor === 1) return [...GROUND_FLOOR_ROOMS]
  return TYPICAL_FLOOR_SLOTS.map((slot) => `${floor}0${slot}`)
}

export const ALL_ROOMS = FLOORS.flatMap(roomsForFloor)
export const ROOM_SET = new Set(ALL_ROOMS)

export function isKnownRoom(roomNumber) {
  return ROOM_SET.has(String(roomNumber))
}

export function floorOf(roomNumber) {
  const floor = Number(String(roomNumber).charAt(0))
  return Number.isFinite(floor) ? floor : null
}

export const HOUSEKEEPING_STATUSES = ['clean', 'dirty']

/**
 * db.housekeeping haritasından bir odanın temizlik durumunu okur.
 * Kaydı olmayan oda varsayılan olarak temizdir.
 */
export function housekeepingOf(db, roomNumber) {
  const entry = db.housekeeping?.[String(roomNumber)]
  return entry?.status === 'dirty' ? 'dirty' : 'clean'
}

export function setHousekeeping(db, roomNumber, status, now = new Date()) {
  if (!db.housekeeping || typeof db.housekeeping !== 'object') db.housekeeping = {}
  const entry = { status, updatedAt: now.toISOString() }
  db.housekeeping[String(roomNumber)] = entry
  return entry
}
