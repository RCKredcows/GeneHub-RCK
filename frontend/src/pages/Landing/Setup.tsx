import { useEffect, useState, type CSSProperties } from 'react'

/**
 * Setup flow for the landing page.
 *
 * Four steps, each carried by its own drawing rather than a paragraph: add the
 * people, build the storage, map it down to the slot, then put units in it.
 * Every drawing reuses a shape from elsewhere on the page -- the canister ring,
 * the teal/violet split between semen and embryos -- so the section reads as
 * the same product, not as clip art.
 */

function CustomersArt() {
  const rows = [
    { y: 18, accent: 'teal' },
    { y: 44, accent: 'violet' },
  ]

  return (
    <svg viewBox="0 0 80 80" aria-hidden="true">
      {rows.map(({ y, accent }, index) => (
        <g key={y} className="setup__piece" style={{ '--d': index } as CSSProperties}>
          <rect className="setup__card" x="8" y={y} width="64" height="22" rx="7" />
          <circle className={`setup__avatar is-${accent}`} cx="21" cy={y + 11} r="5.5" />
          <rect className="setup__line" x="32" y={y + 7} width="30" height="3.5" rx="1.75" />
          <rect className="setup__line is-short" x="32" y={y + 14} width="18" height="3" rx="1.5" />
        </g>
      ))}
    </svg>
  )
}

function TanksArt() {
  // Squat dewars seen head on: wide bodies, fully rounded ends, a lid on the
  // neck and a name plate on the front. Heights vary so it reads as a row of
  // tanks rather than one shape repeated.
  const tanks = [
    { x: 8, height: 30, active: false },
    { x: 30, height: 36, active: true },
    { x: 52, height: 26, active: false },
  ]

  const floor = 62
  const width = 20

  return (
    <svg viewBox="0 0 80 80" aria-hidden="true">
      {tanks.map(({ x, height, active }, index) => {
        const top = floor - height
        const centre = x + width / 2

        return (
          <g
            key={x}
            className={active ? 'setup__tank setup__piece is-active' : 'setup__tank setup__piece'}
            style={{ '--d': index } as CSSProperties}
          >
            <rect
              className="setup__vessel"
              x={x}
              y={top}
              width={width}
              height={height}
              rx={width / 2}
            />

            {/* Lid sitting on the neck. */}
            <rect className="setup__lid-cap" x={centre - 6} y={top - 5} width="12" height="7" rx="3.5" />

            {/* Name plate, where a tank gets its number in the tank room. */}
            <rect className="setup__plate" x={centre - 5} y={top + height * 0.46} width="10" height="6" rx="3" />
          </g>
        )
      })}

      <line className="setup__floor" x1="6" y1={floor} x2="74" y2={floor} />
    </svg>
  )
}

function CanistersArt() {
  const ring = Array.from({ length: 6 }, (_, index) => {
    const angle = (index / 6) * Math.PI * 2 - Math.PI / 2
    return {
      index,
      x: 40 + Math.cos(angle) * 18,
      y: 40 + Math.sin(angle) * 18,
    }
  })

  return (
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <circle className="setup__rim" cx="40" cy="40" r="30" />
      {ring.map(({ x, y, index }) => (
        <circle
          key={index}
          className={`setup__slot setup__piece${index === 1 ? ' is-filled' : ''}`}
          style={{ '--d': index } as CSSProperties}
          cx={x}
          cy={y}
          r="6"
        />
      ))}
      <circle className="setup__hub" cx="40" cy="40" r="4" />
    </svg>
  )
}

function InventoryArt() {
  // Canes standing in a cane holder: teal for semen, violet for embryos.
  const canes = [
    { x: 16, h: 40, kind: 'teal' },
    { x: 27, h: 48, kind: 'teal' },
    { x: 38, h: 34, kind: 'violet' },
    { x: 49, h: 44, kind: 'teal' },
    { x: 60, h: 38, kind: 'violet' },
  ]

  return (
    <svg viewBox="0 0 80 80" aria-hidden="true">
      {canes.map(({ x, h, kind }, index) => (
        <g key={x} className="setup__piece" style={{ '--d': index } as CSSProperties}>
          <rect className="setup__cane" x={x - 2} y={62 - h} width="5" height={h} rx="2.5" />
          <circle className={`setup__tip is-${kind}`} cx={x + 0.5} cy={62 - h + 4} r="3.5" />
        </g>
      ))}
      <line className="setup__floor" x1="10" y1="66" x2="70" y2="66" />
    </svg>
  )
}

const STEPS = [
  { id: 'customers', label: 'Add customers', caption: 'Who owns what', art: <CustomersArt /> },
  { id: 'tanks', label: 'Create tanks', caption: 'Where it lives', art: <TanksArt /> },
  { id: 'canisters', label: 'Map canisters', caption: 'Down to the cane', art: <CanistersArt /> },
  { id: 'inventory', label: 'Add inventory', caption: 'Straws and embryos', art: <InventoryArt /> },
]

const DWELL_MS = 3800

/**
 * Plays the four setup steps on a loop. There is nothing to click: it runs on
 * its own, and the row of labels underneath reports where it has got to.
 */
export default function Setup() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setActive((current) => (current + 1) % STEPS.length), DWELL_MS)
    return () => clearTimeout(timer)
  }, [active])

  return (
    <div className="setup">
      <div className="setup__stage">
        {/* Keyed on the step so the drawing re-enters and re-assembles. */}
        <div className="setup__art" key={active}>
          {STEPS[active].art}
        </div>
      </div>

      <ol className="setup__steps">
        {STEPS.map(({ id, label, caption }, index) => (
          <li key={id} className={`setup__step${index === active ? ' is-active' : ''}`}>
            <span className="setup__step-track">
              {index === active && <span className="setup__step-fill" key={active} />}
            </span>
            <span className="setup__step-label">{label}</span>
            <span className="setup__step-caption">{caption}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
