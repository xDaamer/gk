/**
 * El çizimi kat planlarının şematik karşılığı.
 *
 * 2-6. katlar (tip kat) — saat yönünde: X05 (sol uç), X06 / Merdiven / X01 (üst),
 * X02 (sağ uç), X03 / Asansör / X04 (alt); ortada koridor.
 *
 * 1. kat (zemin) — 103 ve Merdiven üstte, Lobi sağda, 102 / Asansör / 101 altta.
 *
 * Tüm kutular 1000x600'lük viewBox içinde, boşluksuz döşenmiş dikdörtgenlerdir.
 */

export const VIEW_BOX = { width: 1000, height: 600 }

export const FLOORS = [1, 2, 3, 4, 5, 6]
export const MIN_FLOOR = 1
export const MAX_FLOOR = 6

// Tip kat: kutu -> odanın son hanesi (x01 … x06)
const TYPICAL_ROOMS = [
  { slot: 5, x: 16, y: 16, w: 184, h: 568 },
  { slot: 6, x: 200, y: 16, w: 204, h: 224 },
  { slot: 1, x: 608, y: 16, w: 202, h: 224 },
  { slot: 2, x: 810, y: 16, w: 174, h: 568 },
  { slot: 3, x: 608, y: 344, w: 202, h: 240 },
  { slot: 4, x: 200, y: 344, w: 204, h: 240 },
]

const TYPICAL_AREAS = [
  { kind: 'stairs', label: 'Merdiven', x: 404, y: 16, w: 204, h: 224 },
  { kind: 'corridor', label: 'Koridor', x: 200, y: 240, w: 610, h: 104 },
  { kind: 'elevator', label: 'Asansör', x: 404, y: 344, w: 204, h: 240 },
]

// Zemin (1.) kat: oda numaraları sabit
const GROUND_ROOMS = [
  { roomNumber: '103', x: 16, y: 16, w: 324, h: 224 },
  { roomNumber: '102', x: 16, y: 380, w: 324, h: 204 },
  { roomNumber: '101', x: 684, y: 380, w: 300, h: 204 },
]

const GROUND_AREAS = [
  { kind: 'stairs', label: 'Merdiven', x: 340, y: 16, w: 344, h: 224 },
  { kind: 'lobby', label: 'Lobi', x: 684, y: 16, w: 300, h: 364 },
  { kind: 'corridor', label: 'Koridor', x: 16, y: 240, w: 668, h: 140 },
  { kind: 'elevator', label: 'Asansör', x: 340, y: 380, w: 344, h: 204 },
]

/**
 * Verilen kat için çizilecek oda ve ortak alan kutularını döner.
 */
export function planForFloor(floor) {
  if (floor === MIN_FLOOR) {
    return { rooms: GROUND_ROOMS.map((r) => ({ ...r })), areas: GROUND_AREAS }
  }
  return {
    rooms: TYPICAL_ROOMS.map(({ slot, ...box }) => ({
      ...box,
      roomNumber: `${floor}0${slot}`,
    })),
    areas: TYPICAL_AREAS,
  }
}

export function floorLabel(floor) {
  return floor === MIN_FLOOR ? 'Zemin Kat (1)' : `${floor}. Kat`
}

export function clampFloor(floor) {
  return Math.min(MAX_FLOOR, Math.max(MIN_FLOOR, floor))
}

/**
 * Bir odanın kat planındaki görsel durumunu belirler.
 * 'critical'  -> dolu, çıkışına <= 3 gün
 * 'occupied'  -> dolu
 * 'dirty'     -> boş, temizlik bekliyor
 * 'clean'     -> boş ve temiz
 */
export function roomState(room) {
  if (!room) return 'clean'
  if (room.occupied) {
    return room.guest?.displayStatus === 'critical' ? 'critical' : 'occupied'
  }
  return room.housekeeping === 'dirty' ? 'dirty' : 'clean'
}

export const ROOM_STATE_STYLE = {
  occupied: {
    label: 'Dolu',
    fill: 'var(--forest)',
    stroke: 'var(--forest-deep)',
    text: '#f6f1e4',
    subText: 'rgba(246, 241, 228, 0.72)',
  },
  critical: {
    label: 'Dolu · Çıkış yakın',
    fill: '#b91c1c',
    stroke: '#7f1d1d',
    text: '#ffffff',
    subText: 'rgba(255, 255, 255, 0.78)',
  },
  dirty: {
    label: 'Kirli',
    fill: 'var(--soil-soft)',
    stroke: 'var(--soil-line)',
    text: 'var(--soil)',
    subText: 'var(--soil)',
  },
  clean: {
    label: 'Temiz · Boş',
    fill: '#ffffff',
    stroke: 'var(--forest-line)',
    text: 'var(--forest-text)',
    subText: 'var(--ink-muted)',
  },
}

export const AREA_LABEL = {
  stairs: 'Merdiven',
  elevator: 'Asansör',
  corridor: 'Koridor',
  lobby: 'Lobi',
}
