import { booking } from '../config/club'

const steps = [
  {
    title: 'Choisissez votre jour',
    text: `Et le nombre de transats, jusqu'à ${booking.maxPerBooking} par réservation.`,
  },
  {
    title: 'Envoyez votre demande',
    text: 'Votre nom et votre téléphone suffisent. Une demande par personne et par jour.',
  },
  {
    title: 'Le club confirme',
    text: `Votre réservation est définitive une fois confirmée. Le jour venu, donnez votre nom à l'accueil.${
      booking.paymentOnSite ? ' Vous réglez sur place.' : ''
    }`,
  },
]

export default function Steps() {
  return (
    <section className="bg-mist/35">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
        <h2 className="font-display text-4xl leading-[1.02] text-petrol-900 sm:text-5xl">
          Comment réserver
        </h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
          {steps.map((step, i) => (
            <li key={step.title} className="flex min-w-0 gap-4 md:flex-col md:gap-5">
              <span
                aria-hidden="true"
                className="grid size-14 shrink-0 place-items-center rounded-full bg-petrol-900 font-display text-2xl leading-none text-cream"
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-xl font-semibold text-petrol-900">{step.title}</h3>
                <p className="mt-1 max-w-[38ch] text-petrol-950/80">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
