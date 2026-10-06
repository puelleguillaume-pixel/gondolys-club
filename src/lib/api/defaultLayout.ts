import type { Sunbed } from './types'

/** Dimensions du plan, en unités SVG. */
export const PLAN = { w: 1000, h: 700, seaH: 80, clubY: 650 }
export const BED = { w: 40, h: 78, gap: 6 }

/** Zone dans laquelle un transat peut être posé (entre la mer et le club). */
export const BOUNDS = {
  minX: 30,
  maxX: PLAN.w - 30,
  minY: PLAN.seaH + BED.h / 2 + 2,
  maxY: PLAN.clubY - BED.h / 2 - 2,
}

/** Disposition de départ : 5 rangées de 5 paires, numérotées depuis la mer. */
export function defaultLayout(): Sunbed[] {
  const beds: Sunbed[] = []
  const half = (BED.w + BED.gap) / 2
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const pair = row * 5 + col
      const cx = 130 + col * 185
      const y = 150 + row * 108
      beds.push({ n: pair * 2 + 1, x: cx - half, y, r: 0 }, { n: pair * 2 + 2, x: cx + half, y, r: 0 })
    }
  }
  return beds
}
