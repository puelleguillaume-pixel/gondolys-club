import type { KeyboardEvent, ReactNode, Ref, SVGProps } from 'react'
import { BED, PLAN } from '../lib/api/defaultLayout'
import type { Sunbed } from '../lib/api/types'

export type BedState = 'free' | 'reserved' | 'arrived' | 'blocked'

const fills: Record<BedState, { body: string; text: string }> = {
  free: { body: 'fill-white stroke-petrol-900', text: 'fill-petrol-950' },
  reserved: { body: 'fill-petrol-900 stroke-petrol-950', text: 'fill-cream' },
  arrived: { body: 'fill-ok stroke-petrol-950', text: 'fill-cream' },
  blocked: { body: 'fill-off stroke-petrol-500', text: 'fill-petrol-950/50' },
}

const stateLabel: Record<BedState, string> = {
  free: 'libre',
  reserved: 'réservé',
  arrived: 'client arrivé',
  blocked: 'bloqué',
}

type Props = {
  layout: Sunbed[]
  stateOf?: (n: number) => BedState
  /** Transats mis en avant (sélection en cours). */
  selected?: ReadonlySet<number>
  /** Transats proposés comme destination d'un déplacement. */
  targets?: ReadonlySet<number>
  onActivate?: (n: number) => void
  bedProps?: (n: number) => SVGProps<SVGGElement>
  svgRef?: Ref<SVGSVGElement>
  label: string
  children?: ReactNode
}

/** Le plan de la plage : la mer en haut, le club en bas, les 50 transats entre les deux. */
export default function PlanCanvas({
  layout,
  stateOf,
  selected,
  targets,
  onActivate,
  bedProps,
  svgRef,
  label,
  children,
}: Props) {
  const onKey = (n: number) => (e: KeyboardEvent<SVGGElement>) => {
    if (onActivate && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onActivate(n)
    }
  }

  return (
    <>
    <div className="overflow-x-auto rounded-3xl bg-[#f3e9d2] ring-1 ring-petrol-900/15">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${PLAN.w} ${PLAN.h}`}
        role="group"
        aria-label={label}
        className="block w-full min-w-[720px] select-none"
      >
        <rect width={PLAN.w} height={PLAN.seaH} className="fill-petrol-500" />
        <path
          d={`M0 ${PLAN.seaH} ${'q10 -12 20 0 t20 0 '.repeat(25)} V0 H0Z`}
          className="fill-petrol-500"
        />
        <text x={PLAN.w / 2} y={PLAN.seaH / 2 + 2} textAnchor="middle" dominantBaseline="central" className="fill-cream font-display text-[30px]">
          La mer
        </text>

        <rect y={PLAN.clubY} width={PLAN.w} height={PLAN.h - PLAN.clubY} className="fill-petrol-900" />
        <text x={PLAN.w / 2} y={(PLAN.clubY + PLAN.h) / 2 + 1} textAnchor="middle" dominantBaseline="central" className="fill-cream font-display text-[24px]">
          Le club
        </text>

        {layout.map((bed) => {
          const state = stateOf?.(bed.n) ?? 'free'
          const isSelected = selected?.has(bed.n) ?? false
          const isTarget = targets?.has(bed.n) ?? false
          const style = fills[state]
          return (
            <g
              key={bed.n}
              transform={`translate(${bed.x} ${bed.y}) rotate(${bed.r})`}
              role="button"
              tabIndex={0}
              aria-label={`Transat ${bed.n}, ${stateLabel[state]}`}
              aria-pressed={isSelected}
              onClick={onActivate ? () => onActivate(bed.n) : undefined}
              onKeyDown={onKey(bed.n)}
              className="cursor-pointer outline-none [&:focus-visible>.ring]:opacity-100"
              {...bedProps?.(bed.n)}
            >
              <rect
                className={`ring fill-none stroke-sun-deep ${isSelected ? 'opacity-100' : 'opacity-0'}`}
                x={-BED.w / 2 - 6}
                y={-BED.h / 2 - 6}
                width={BED.w + 12}
                height={BED.h + 12}
                rx={15}
                strokeWidth={5}
              />
              <rect
                className={style.body}
                x={-BED.w / 2}
                y={-BED.h / 2}
                width={BED.w}
                height={BED.h}
                rx={10}
                strokeWidth={2}
              />
              {/* Têtière : indique le sens du transat. */}
              <rect
                x={-BED.w / 2 + 6}
                y={BED.h / 2 - 18}
                width={BED.w - 12}
                height={11}
                rx={5}
                className={state === 'free' ? 'fill-petrol-900/15' : 'fill-white/25'}
              />
              {state === 'blocked' && (
                <path
                  d={`M${-BED.w / 2 + 7} ${-BED.h / 2 + 7}L${BED.w / 2 - 7} ${BED.h / 2 - 7}M${BED.w / 2 - 7} ${-BED.h / 2 + 7}L${-BED.w / 2 + 7} ${BED.h / 2 - 7}`}
                  className="stroke-petrol-500"
                  strokeWidth={2}
                  fill="none"
                />
              )}
              {isTarget && (
                <rect
                  className="fill-sun/40 stroke-sun-deep"
                  x={-BED.w / 2}
                  y={-BED.h / 2}
                  width={BED.w}
                  height={BED.h}
                  rx={10}
                  strokeWidth={3}
                  strokeDasharray="7 5"
                />
              )}
              <text
                transform={`rotate(${-bed.r})`}
                y={-8}
                textAnchor="middle"
                dominantBaseline="central"
                className={`${style.text} pointer-events-none text-[20px] font-bold tabular-nums`}
              >
                {bed.n}
              </text>
              {state === 'arrived' && (
                <path
                  d="M-7 14l5 5 9-10"
                  transform={`rotate(${-bed.r})`}
                  className="pointer-events-none fill-none stroke-cream"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </g>
          )
        })}
        {children}
      </svg>
    </div>
    <p className="mt-2 text-sm text-petrol-950/70 md:hidden">Faites défiler le plan sur le côté pour voir tous les transats.</p>
    </>
  )
}

export function Legend() {
  const items: { state: BedState; label: string }[] = [
    { state: 'free', label: 'Libre' },
    { state: 'reserved', label: 'Réservé' },
    { state: 'arrived', label: 'Client arrivé' },
    { state: 'blocked', label: 'Bloqué' },
  ]
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-petrol-950/80">
      {items.map((item) => (
        <li key={item.state} className="flex items-center gap-2">
          <svg viewBox="0 0 20 26" className="h-6 w-5" aria-hidden="true">
            <rect x="1" y="1" width="18" height="24" rx="5" strokeWidth="2" className={fills[item.state].body} />
            {item.state === 'blocked' && <path d="M5 5l10 16M15 5L5 21" className="stroke-petrol-500" strokeWidth="1.5" />}
            {item.state === 'arrived' && <path d="M5.5 13.5l3 3 6-6.5" className="fill-none stroke-cream" strokeWidth="2.2" strokeLinecap="round" />}
          </svg>
          {item.label}
        </li>
      ))}
    </ul>
  )
}
