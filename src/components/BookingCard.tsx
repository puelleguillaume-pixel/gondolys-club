import { useMemo, useState } from 'react'
import { AnimatePresence, m as motion } from 'framer-motion'
import { booking, club } from '../config/club'
import { dayNumber, formatLong, shortWeekday, upcomingDays, weekdayIndex } from '../lib/dates'

const plural = (n: number) => `${n} transat${n > 1 ? 's' : ''}`

export default function BookingCard() {
  const days = useMemo(() => upcomingDays(booking.daysAhead), [])
  const [date, setDate] = useState(days[0])
  const [count, setCount] = useState(2)
  const [step, setStep] = useState<'choose' | 'summary'>('choose')

  const hours = club.hours[weekdayIndex(date)]
  const total = booking.pricePerSunbed === null ? null : booking.pricePerSunbed * count

  /**
   * Point de branchement du back : quand `booking.onlineOpen` est vrai,
   * remplacer par l'authentification du client puis l'appel à la RPC de réservation.
   */
  const handleContinue = () => setStep('summary')

  return (
    <section
      id="reserver"
      aria-labelledby="reserver-titre"
      className="scroll-mt-6 rounded-[2rem] bg-cream p-5 text-petrol-950 shadow-[0_24px_60px_-20px_rgba(8,34,45,0.65)] sm:p-7"
    >
      <h2 id="reserver-titre" className="font-display text-3xl leading-none">
        Réserver un transat
      </h2>

      <AnimatePresence mode="wait" initial={false}>
        {step === 'choose' ? (
          <motion.div
            key="choose"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22 }}
          >
            <fieldset className="mt-6">
              <legend className="text-base font-semibold">Quel jour ?</legend>
              <div className="mt-3 grid grid-cols-7 gap-1.5">
                {days.map((d) => {
                  const selected = d === date
                  return (
                    <label
                      key={d}
                      className={`flex cursor-pointer flex-col items-center rounded-2xl py-2 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sun-deep ${
                        selected
                          ? 'bg-petrol-900 text-cream'
                          : 'bg-petrol-900/[0.07] hover:bg-petrol-900/[0.14]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="jour"
                        id={`jour-${d}`}
                        value={d}
                        checked={selected}
                        onChange={() => setDate(d)}
                        className="sr-only"
                        aria-label={formatLong(d)}
                      />
                      <span aria-hidden="true" className="text-xs font-medium opacity-80">
                        {shortWeekday(d)}
                      </span>
                      <span aria-hidden="true" className="text-lg font-semibold leading-tight tabular-nums">
                        {dayNumber(d)}
                      </span>
                    </label>
                  )
                })}
              </div>
              <p className="mt-3 text-base text-petrol-700" aria-live="polite">
                <span className="font-semibold text-petrol-950 first-letter:uppercase inline-block">
                  {formatLong(date)}
                </span>
                , le club est ouvert de {hours.open} à {hours.close}.
              </p>
            </fieldset>

            <div className="mt-6 flex items-center justify-between gap-4">
              <span id="quantite-label" className="whitespace-nowrap text-base font-semibold">
                Combien de transats&nbsp;?
              </span>
              <div role="group" aria-labelledby="quantite-label" className="flex items-center gap-1">
                <StepperButton
                  id="quantite-moins"
                  label="Un transat de moins"
                  disabled={count <= 1}
                  onClick={() => setCount((c) => c - 1)}
                >
                  −
                </StepperButton>
                <output
                  id="quantite"
                  aria-live="polite"
                  aria-label={plural(count)}
                  className="w-10 text-center font-display text-3xl leading-none tabular-nums"
                >
                  {count}
                </output>
                <StepperButton
                  id="quantite-plus"
                  label="Un transat de plus"
                  disabled={count >= booking.maxPerBooking}
                  onClick={() => setCount((c) => c + 1)}
                >
                  +
                </StepperButton>
              </div>
            </div>
            <p className="mt-1 text-sm text-petrol-700">
              {booking.maxPerBooking} transats maximum par réservation.
            </p>

            <button
              type="button"
              id="reserver-continuer"
              onClick={handleContinue}
              className="mt-6 w-full rounded-full bg-sun px-6 py-4 text-lg font-semibold text-petrol-950 transition-colors hover:bg-sun-deep"
            >
              Continuer
            </button>
            <p className="mt-3 text-center text-sm text-petrol-700">
              {total !== null && <>{total} € la journée. </>}
              {booking.paymentOnSite && 'Vous réglez sur place, rien à payer en ligne.'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.22 }}
          >
            <dl className="mt-6 divide-y divide-petrol-900/15 border-y border-petrol-900/15">
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-petrol-700">Jour</dt>
                <dd className="text-right font-semibold first-letter:uppercase">{formatLong(date)}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-petrol-700">Horaires</dt>
                <dd className="text-right font-semibold">
                  {hours.open} – {hours.close}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-petrol-700">Transats</dt>
                <dd className="text-right font-semibold">{count}</dd>
              </div>
            </dl>

            <p className="mt-5 text-base">
              La réservation en ligne ouvre bientôt. D'ici là, réservez {plural(count)} par téléphone :
            </p>
            <a
              href={club.phone.href}
              className="mt-2 inline-block font-display text-3xl leading-tight text-petrol-900 underline decoration-sun decoration-4 underline-offset-4"
            >
              {club.phone.display}
            </a>

            <button
              type="button"
              id="reserver-modifier"
              onClick={() => setStep('choose')}
              className="mt-6 w-full rounded-full border-2 border-petrol-900 px-6 py-3.5 text-lg font-semibold text-petrol-900 transition-colors hover:bg-petrol-900 hover:text-cream"
            >
              Modifier ma demande
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function StepperButton({
  id,
  label,
  disabled,
  onClick,
  children,
}: {
  id: string
  label: string
  disabled: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      id={id}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full bg-petrol-900 text-2xl font-semibold leading-none text-cream transition-colors hover:bg-petrol-950 disabled:cursor-not-allowed disabled:bg-petrol-900/15 disabled:text-petrol-900/40"
    >
      {children}
    </button>
  )
}
