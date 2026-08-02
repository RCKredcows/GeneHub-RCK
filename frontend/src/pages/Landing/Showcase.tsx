import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'

/**
 * Feature showcase for the landing page.
 *
 * A vertical tab list with one illustration per feature, advancing on its own
 * until the visitor touches it.
 *
 * The illustrations are diagrams of real structures -- a record's columns, a
 * tank's canister ring, stock against a reorder point. Labels use the domain's
 * own vocabulary and tag numbers rather than invented ranch or customer names,
 * so nothing here reads as a screenshot of an account that does not exist.
 */

const DWELL_MS = 7000

const inventoryRows = [
  { tag: 'Heatwave', kind: 'Semen', qty: '24', loc: 'T1 · C4 · A2', low: false },
  { tag: '#9416968', kind: 'Embryo', qty: '6', loc: 'T1 · C2 · B1', low: false },
  { tag: 'Man o’ War', kind: 'Semen', qty: '112', loc: 'T2 · C1 · A5', low: false },
  { tag: 'Galileo', kind: 'Semen', qty: '3', loc: 'T2 · C7 · C3', low: true },
]

function InventoryArt() {
  const selected = 1

  return (
    <svg viewBox="0 0 340 214" role="img" aria-label="Inventory records showing sire tag, type, quantity, and location">
      <g className="showcase__head">
        <text x="10" y="14">SIRE</text>
        <text x="112" y="14">TYPE</text>
        <text x="196" y="14">QTY</text>
        <text x="240" y="14">LOCATION</text>
      </g>
      <line className="showcase__rule" x1="6" y1="24" x2="334" y2="24" />

      {inventoryRows.map(({ tag, kind, qty, loc, low }, index) => {
        // Spread to the foot of the frame, so the panel is not bottom-heavy.
        const y = 52 + index * 44
        const embryo = kind === 'Embryo'

        return (
          <g key={tag} className="showcase__row" style={{ '--d': index } as CSSProperties}>
            {index === selected && (
              <rect className="showcase__row-sel" x="6" y={y - 17} width="328" height="30" rx="7" />
            )}

            <circle className={embryo ? 'showcase__dot is-embryo' : 'showcase__dot'} cx="16" cy={y - 4} r="4.5" />
            <text className="showcase__tag" x="28" y={y}>{tag}</text>

            <rect
              className={embryo ? 'showcase__pill is-embryo' : 'showcase__pill'}
              x="112"
              y={y - 13}
              width={embryo ? 50 : 47}
              height="18"
              rx="9"
            />
            <text className={embryo ? 'showcase__pill-text is-embryo' : 'showcase__pill-text'} x={112 + (embryo ? 25 : 23.5)} y={y}>
              {kind}
            </text>

            <text className={low ? 'showcase__qty is-low' : 'showcase__qty'} x="196" y={y}>{qty}</text>
            <text className="showcase__loc" x="240" y={y}>{loc}</text>

            {index !== inventoryRows.length - 1 && (
              <line className="showcase__rule" x1="6" y1={y + 17} x2="334" y2={y + 17} />
            )}
          </g>
        )
      })}
    </svg>
  )
}

/*
  A canister holds canes, so that is what it reports: how many of its cane
  slots are used, and what is on them. The arc around each canister is canes
  used over capacity -- not an invented "percent full".
*/
const CANE_CAPACITY = 6

const canisters = [
  { canes: 6, straws: 214, embryos: 0 },
  { canes: 5, straws: 96, embryos: 18 },
  { canes: 3, straws: 64, embryos: 0 },
  { canes: 6, straws: 180, embryos: 24 },
  { canes: 4, straws: 120, embryos: 6 },
  { canes: 0, straws: 0, embryos: 0 },
]

const TANK_CX = 170
const TANK_CY = 130

function summarise({ canes, straws, embryos }: (typeof canisters)[number]) {
  if (canes === 0) return `empty, space for ${CANE_CAPACITY} canes`
  const parts = [`${canes} of ${CANE_CAPACITY} canes`, `${straws} straws`]
  if (embryos) parts.push(`${embryos} embryos`)
  return parts.join(', ')
}

function TankArt() {
  // Hovering (or focusing) a canister reads out its contents in the header.
  // Nothing moves in the ring -- a map you are trying to read should hold still.
  const [inspected, setInspected] = useState<number | null>(null)
  const active = inspected ?? 3
  const shown = canisters[active]
  const empty = shown.canes === 0

  const ring = canisters.map((can, index) => {
    const angle = (index / 6) * Math.PI * 2 - Math.PI / 2
    return {
      can,
      index,
      angle,
      x: TANK_CX + Math.cos(angle) * 52,
      y: TANK_CY + Math.sin(angle) * 52,
    }
  })

  return (
    <svg viewBox="0 0 340 214" role="img" aria-label="Tank map: six canisters and their contents. Hover a canister to read it.">
      {/* Readout. Fixed position, so the eye always knows where to look. */}
      <g className="showcase__head">
        <text x="8" y="13">CANISTER</text>
      </g>
      <text className="showcase__readout" x="8" y="34">{active + 1}</text>

      <text className="showcase__readout-note" x="334" y="13">
        {empty ? `Empty · ${CANE_CAPACITY} slots free` : `${shown.canes} of ${CANE_CAPACITY} canes`}
      </text>

      {empty ? (
        <>
          <rect className="showcase__pill is-empty" x="262" y="21" width="72" height="18" rx="9" />
          <text className="showcase__pill-text is-empty" x="298" y="34">Empty</text>
        </>
      ) : (
        <>
          <rect className="showcase__pill" x="186" y="21" width="68" height="18" rx="9" />
          <text className="showcase__pill-text" x="220" y="34">{shown.straws} straws</text>

          {shown.embryos > 0 && (
            <>
              <rect className="showcase__pill is-embryo" x="262" y="21" width="72" height="18" rx="9" />
              <text className="showcase__pill-text is-embryo" x="298" y="34">{shown.embryos} embryos</text>
            </>
          )}
        </>
      )}

      {/* Rim, with a tick at each canister position. */}
      <circle className="showcase__rim" cx={TANK_CX} cy={TANK_CY} r="78" />
      <circle className="showcase__rim is-inner" cx={TANK_CX} cy={TANK_CY} r="70" />
      {ring.map(({ angle, index }) => (
        <line
          key={`tick-${index}`}
          className="showcase__tick"
          x1={TANK_CX + Math.cos(angle) * 70}
          y1={TANK_CY + Math.sin(angle) * 70}
          x2={TANK_CX + Math.cos(angle) * 78}
          y2={TANK_CY + Math.sin(angle) * 78}
        />
      ))}

      <circle className="showcase__hub" cx={TANK_CX} cy={TANK_CY} r="21" />
      <text className="showcase__hub-text" x={TANK_CX} y={TANK_CY - 2}>TANK</text>
      <text className="showcase__hub-num" x={TANK_CX} y={TANK_CY + 11}>1</text>

      {ring.map(({ x, y, can, index }) => (
        <g
          key={index}
          className={[
            'showcase__canister',
            index === active ? 'is-active' : '',
            can.canes === 0 ? 'is-empty' : '',
          ].join(' ')}
          style={{ '--d': index } as CSSProperties}
          tabIndex={0}
          role="button"
          aria-label={`Canister ${index + 1}: ${summarise(can)}`}
          onMouseEnter={() => setInspected(index)}
          onMouseLeave={() => setInspected(null)}
          onFocus={() => setInspected(index)}
          onBlur={() => setInspected(null)}
        >
          <circle className="showcase__can-body" cx={x} cy={y} r="19" />
          {/* Canes used, drawn as an arc. pathLength is normalised to 100 so
              the dash array can be read straight off the ratio. */}
          <circle
            className="showcase__can-level"
            cx={x}
            cy={y}
            r="15.5"
            pathLength={100}
            strokeDasharray={`${(can.canes / CANE_CAPACITY) * 100} 100`}
            transform={`rotate(-90 ${x} ${y})`}
          />
          <text className="showcase__can-num" x={x} y={y + 4}>{index + 1}</text>
        </g>
      ))}
    </svg>
  )
}

const supplies = [
  { name: 'Straws', level: 0.78, count: '1,240' },
  { name: 'Sheaths', level: 0.52, count: '820' },
  { name: 'Gloves', level: 0.12, count: '90' },
  { name: 'Needles', level: 0.66, count: '7' },
]

/*
  Rows align to two edges: name on the left, count on the right, and a
  full-width track underneath so a bar ends directly below its own number.

  The reorder point is a short tick inside each row rather than one continuous
  rule -- a full-height line cuts straight through the names and counts on its
  way down the chart.
*/
const TRACK_X = 8
const TRACK_W = 326
const TRACK_H = 10
const ROW_TOP = 34
// Sized so the last bar lands near the foot of the 214-unit frame; a short
// chart in a tall panel leaves dead space under it.
const ROW_H = 48
const REORDER_AT = 0.25
const REORDER_X = TRACK_X + TRACK_W * REORDER_AT

function SupplyArt() {
  return (
    <svg viewBox="0 0 340 214" role="img" aria-label="Supply levels against a reorder point, gloves running low">
      <g className="showcase__head">
        <text x={TRACK_X} y="12">ON HAND</text>
        <text className="showcase__reorder-label" x={REORDER_X} y="12">REORDER</text>
      </g>

      {supplies.map(({ name, level, count }, index) => {
        const top = ROW_TOP + index * ROW_H
        const trackY = top + 20
        const low = level < REORDER_AT

        return (
          <g key={name} className="showcase__row" style={{ '--d': index } as CSSProperties}>
            {low && <circle className="showcase__low-dot" cx={TRACK_X + 4} cy={top + 8} r="3.5" />}
            <text className="showcase__supply-name" x={TRACK_X + 14} y={top + 12}>{name}</text>

            <text
              className={low ? 'showcase__supply-count is-low' : 'showcase__supply-count'}
              x={TRACK_X + TRACK_W}
              y={top + 12}
            >
              {count}
            </text>

            <rect className="showcase__track" x={TRACK_X} y={trackY} width={TRACK_W} height={TRACK_H} rx="5" />
            <rect
              className={low ? 'showcase__fill is-low' : 'showcase__fill'}
              x={TRACK_X}
              y={trackY}
              width={Math.max(TRACK_H, TRACK_W * level)}
              height={TRACK_H}
              rx="5"
            />

            <line
              className="showcase__reorder"
              x1={REORDER_X}
              y1={trackY - 5}
              x2={REORDER_X}
              y2={trackY + TRACK_H + 5}
            />
          </g>
        )
      })}
    </svg>
  )
}

const FEATURES = [
  {
    id: 'inventory',
    title: 'Genetic inventory',
    body: 'Semen and embryos tracked by sire, owner, quantity, and status.',
    art: <InventoryArt />,
  },
  {
    id: 'storage',
    title: 'Tank & canister maps',
    body: 'Every tank laid out by canister and cane, so anyone on the crew can pull a unit.',
    art: <TankArt />,
  },
  {
    id: 'supplies',
    title: 'Supply control',
    body: 'Medical and breeding supplies carried with their usage history, and a warning before you run out.',
    art: <SupplyArt />,
  },
]

export default function Showcase() {
  const [active, setActive] = useState(0)
  const [running, setRunning] = useState(true)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  // Advances on its own, and stops for good once the visitor takes over.
  useEffect(() => {
    if (!running) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timer = setTimeout(() => setActive((current) => (current + 1) % FEATURES.length), DWELL_MS)
    return () => clearTimeout(timer)
  }, [active, running])

  const select = (index: number) => {
    setRunning(false)
    setActive(index)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = FEATURES.length - 1
    let next: number | null = null

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = active === last ? 0 : active + 1
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = active === 0 ? last : active - 1
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = last
    if (next === null) return

    event.preventDefault()
    select(next)
    tabs.current[next]?.focus()
  }

  return (
    <div className="showcase" onMouseEnter={() => setRunning(false)}>
      <div className="showcase__tabs" role="tablist" aria-orientation="vertical" onKeyDown={onKeyDown}>
        {FEATURES.map(({ id, title, body }, index) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`showcase-tab-${id}`}
            aria-selected={index === active}
            aria-controls={`showcase-panel-${id}`}
            tabIndex={index === active ? 0 : -1}
            ref={(node) => {
              tabs.current[index] = node
            }}
            className={`showcase__tab${index === active ? ' is-active' : ''}`}
            onClick={() => select(index)}
          >
            <span className="showcase__tab-title">{title}</span>
            <span className="showcase__tab-body">{body}</span>
            {index === active && running && <span className="showcase__progress" aria-hidden="true" />}
          </button>
        ))}
      </div>

      {FEATURES.map(({ id, art }, index) => (
        <div
          key={id}
          role="tabpanel"
          id={`showcase-panel-${id}`}
          aria-labelledby={`showcase-tab-${id}`}
          hidden={index !== active}
          className="showcase__panel"
        >
          {/* Keyed on the active index so the entry animation replays. */}
          <div className="showcase__art" key={active}>
            {art}
          </div>
        </div>
      ))}
    </div>
  )
}
