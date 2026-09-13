import {
  AREA_LABEL,
  ROOM_STATE_STYLE,
  VIEW_BOX,
  planForFloor,
  roomState,
} from '../lib/floorPlan'

const AREA_FILL = 'rgba(20, 30, 24, 0.035)'
const AREA_STROKE = 'rgba(20, 30, 24, 0.14)'

function AreaGlyph({ area }) {
  const cx = area.x + area.w / 2
  const cy = area.y + area.h / 2

  if (area.kind === 'stairs') {
    // Basamaklar + eskizdeki iniş/çıkış okları
    const steps = [0, 1, 2, 3].map((i) => (
      <line
        key={i}
        x1={cx - 46}
        x2={cx + 46}
        y1={cy - 30 + i * 20}
        y2={cy - 30 + i * 20}
        stroke={AREA_STROKE}
        strokeWidth="3"
      />
    ))
    return (
      <g>
        <rect
          x={cx - 46}
          y={cy - 38}
          width="92"
          height="76"
          rx="4"
          fill="none"
          stroke={AREA_STROKE}
          strokeWidth="3"
        />
        {steps}
      </g>
    )
  }

  if (area.kind === 'elevator') {
    return (
      <g stroke={AREA_STROKE} strokeWidth="3" fill="none">
        <rect x={cx - 34} y={cy - 34} width="68" height="68" rx="4" />
        <path d={`M ${cx - 14} ${cy + 6} l 0 -22 l -8 8 m 8 -8 l 8 8`} strokeLinecap="round" />
        <path d={`M ${cx + 14} ${cy - 6} l 0 22 l -8 -8 m 8 8 l 8 -8`} strokeLinecap="round" />
      </g>
    )
  }

  return null
}

function RoomTile({ box, room, selected, onSelect }) {
  const state = roomState(room)
  const style = ROOM_STATE_STYLE[state]
  const cx = box.x + box.w / 2
  const isFilled = state === 'occupied' || state === 'critical'

  return (
    <g
      className="cursor-pointer"
      onClick={() => onSelect(box.roomNumber)}
      role="button"
      tabIndex={0}
      aria-label={`Oda ${box.roomNumber} — ${style.label}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(box.roomNumber)
        }
      }}
    >
      <rect
        x={box.x + 4}
        y={box.y + 4}
        width={box.w - 8}
        height={box.h - 8}
        rx="10"
        fill={style.fill}
        stroke={selected ? 'var(--brass)' : style.stroke}
        strokeWidth={selected ? 6 : 3}
        className="transition-[stroke,stroke-width] duration-150"
      />

      <text
        x={cx}
        y={box.y + box.h / 2 - 4}
        textAnchor="middle"
        fill={style.text}
        fontSize="34"
        fontWeight="600"
        className="font-mono select-none"
      >
        {box.roomNumber}
      </text>

      <text
        x={cx}
        y={box.y + box.h / 2 + 26}
        textAnchor="middle"
        fill={style.subText}
        fontSize="17"
        className="select-none"
      >
        {isFilled ? (room?.guest?.fullName ?? 'Dolu') : style.label}
      </text>

      {/* Paylaşımlı daire: ilk misafirin yanında toplam kişi sayısı */}
      {room?.occupantCount > 1 && (
        <text
          x={cx}
          y={box.y + box.h / 2 + 48}
          textAnchor="middle"
          fill={style.subText}
          fontSize="15"
          className="select-none"
        >
          +{room.occupantCount - 1} kişi daha
        </text>
      )}

      {/* Dolu ama kirli oda: köşede uyarı noktası */}
      {isFilled && room?.housekeeping === 'dirty' && (
        <circle cx={box.x + box.w - 24} cy={box.y + 26} r="9" fill="var(--soil)" />
      )}
    </g>
  )
}

export default function FloorPlan({ floor, roomsByNumber, selectedRoom, onSelectRoom }) {
  const { rooms, areas } = planForFloor(floor)

  return (
    <svg
      viewBox={`0 0 ${VIEW_BOX.width} ${VIEW_BOX.height}`}
      className="block h-auto w-full"
      role="img"
      aria-label={`${floor}. kat planı`}
    >
      {/* Bina dış hattı */}
      <rect
        x="8"
        y="8"
        width={VIEW_BOX.width - 16}
        height={VIEW_BOX.height - 16}
        rx="14"
        fill="none"
        stroke="var(--line)"
        strokeWidth="3"
      />

      {areas.map((area) => (
        <g key={`${area.kind}-${area.x}`}>
          <rect
            x={area.x + 4}
            y={area.y + 4}
            width={area.w - 8}
            height={area.h - 8}
            rx="10"
            fill={AREA_FILL}
            stroke={AREA_STROKE}
            strokeWidth="2"
            strokeDasharray={area.kind === 'corridor' ? '10 8' : undefined}
          />
          <AreaGlyph area={area} />
          <text
            x={area.x + area.w / 2}
            y={area.kind === 'corridor' ? area.y + area.h / 2 + 6 : area.y + area.h - 22}
            textAnchor="middle"
            fill="var(--ink-muted)"
            fontSize="18"
            letterSpacing="2"
            className="select-none uppercase"
          >
            {area.label ?? AREA_LABEL[area.kind]}
          </text>
        </g>
      ))}

      {rooms.map((box) => (
        <RoomTile
          key={box.roomNumber}
          box={box}
          room={roomsByNumber.get(box.roomNumber)}
          selected={selectedRoom === box.roomNumber}
          onSelect={onSelectRoom}
        />
      ))}
    </svg>
  )
}
