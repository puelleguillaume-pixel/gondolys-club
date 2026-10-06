import { useMemo, useState, type FormEvent } from 'react'
import { AnimatePresence, m as motion } from 'framer-motion'
import { booking, club } from '../config/club'
import { isDemo, publicApi } from '../lib/api'
import { dayNumber, formatLong, shortWeekday, upcomingDays, weekdayIndex } from '../lib/dates'

const plural = (n: number) => `${n} transat${n > 1 ? 's' : ''}`

export default function BookingCard() {
  const days = useMemo(() => upcomingDays(booking.daysAhead), [])
  const [date, setDate] = useState(days[0])
  const [count, setCount] = useState(2)
  const [step, setStep] = useState<'choose' | 'summary' | 'sent'>('choose')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const hours = club.hours[weekdayIndex(date)]
  const total = booking.pricePerSunbed === null ? null : booking.pricePerSunbed * count

  const handleContinue = () => {
    setError(null)
    setStep('summary')
  }

  /**
   * Envoie la demande au club. Elle n'est définitive qu'une fois confirmée dans l'espace pro.
   * Point de branchement du back : ajouter ici l'authentification du client avant l'envoi.
   */
  const sendRequest = async (e: FormEvent) => {
    e.preventDefault()
    if (!publicApi || busy) return
    setBusy(true)
    setError(null)
    try {
      await publicApi.requestReservation({ date, quantity: count, name, phone })
      setStep('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : "La demande n'est pas partie. Réessayez.")
    }
    setBusy(false)
  }

  const field =
    'mt-1 min-h-12 w-full rounded-2xl border-2 border-petrol-900/25 bg-white px-4 text-base focus:border-petrol-900'

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
        ) : step === 'summary' ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.22 }}
          >
            <Recap date={date} hours={`${hours.open} – ${hours.close}`} count={count} />

            {publicApi ? (
              <form onSubmit={sendRequest}>
                <label htmlFor="demande-nom" className="mt-5 block text-sm font-semibold">
                  Votre nom
                </label>
                <input
                  id="demande-nom"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={field}
                />
                <label htmlFor="demande-tel" className="mt-4 block text-sm font-semibold">
                  Votre téléphone
                </label>
                <input
                  id="demande-tel"
                  type="tel"
                  inputMode="tel"
                  required
                  pattern="[0-9+ .]{10,17}"
                  title="Un numéro de téléphone, par exemple 06 12 34 56 78"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={field}
                />
                {error && (
                  <p role="alert" className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 font-medium text-danger">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  id="demande-envoyer"
                  disabled={busy}
                  className="mt-6 w-full rounded-full bg-sun px-6 py-4 text-lg font-semibold text-petrol-950 transition-colors hover:bg-sun-deep disabled:opacity-50"
                >
                  Envoyer ma demande
                </button>
                <p className="mt-3 text-center text-sm text-petrol-700">
                  Le club confirme chaque réservation. La vôtre est définitive une fois confirmée.
                </p>
              </form>
            ) : (
              <>
                <p className="mt-5 text-base">
                  La réservation en ligne ouvre bientôt. D'ici là, réservez {plural(count)} par téléphone :
                </p>
                <a
                  href={club.phone.href}
                  className="mt-2 inline-block font-display text-3xl leading-tight text-petrol-900 underline decoration-sun decoration-4 underline-offset-4"
                >
                  {club.phone.display}
                </a>
              </>
            )}

            <button
              type="button"
              id="reserver-modifier"
              onClick={() => setStep('choose')}
              className="mt-4 w-full rounded-full border-2 border-petrol-900 px-6 py-3.5 text-lg font-semibold text-petrol-900 transition-colors hover:bg-petrol-900 hover:text-cream"
            >
              Modifier ma demande
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p role="status" className="mt-5 font-display text-2xl leading-tight text-petrol-900">
              Demande envoyée, {name.trim().split(' ')[0]}.
            </p>
            <Recap date={date} hours={`${hours.open} – ${hours.close}`} count={count} />
            <p className="mt-5 text-base">
              Elle est <strong className="font-semibold">en attente de confirmation</strong>. Le club vous
              répond au {phone.trim()}. Votre réservation est définitive une fois confirmée.
            </p>
            {isDemo && (
              <p className="mt-4 rounded-2xl bg-sun/40 px-4 py-3 text-sm font-medium">
                Démonstration : la demande est visible dans l'espace pro de ce navigateur.
              </p>
            )}
            <button
              type="button"
              id="demande-autre"
              onClick={() => setStep('choose')}
              className="mt-6 w-full rounded-full border-2 border-petrol-900 px-6 py-3.5 text-lg font-semibold text-petrol-900 transition-colors hover:bg-petrol-900 hover:text-cream"
            >
              Faire une autre demande
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function Recap({ date, hours, count }: { date: string; hours: string; count: number }) {
  const rows = [
    { label: 'Jour', value: formatLong(date), cap: true },
    { label: 'Horaires', value: hours },
    { label: 'Transats', value: String(count) },
  ]
  return (
    <dl className="mt-6 divide-y divide-petrol-900/15 border-y border-petrol-900/15">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-4 py-3">
          <dt className="text-petrol-700">{row.label}</dt>
          <dd className={`text-right font-semibold ${row.cap ? 'first-letter:uppercase' : ''}`}>{row.value}</dd>
        </div>
      ))}
    </dl>
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
