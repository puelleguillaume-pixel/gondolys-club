import { club } from '../config/club'

export default function Infos() {
  return (
    <section id="infos" className="relative scroll-mt-0 bg-petrol-900 text-cream">
      <div aria-hidden="true" className="scallop rotate-180 text-[#dfe8e5]" />
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
        <h2 className="font-display text-4xl leading-[1.02] sm:text-5xl">Infos pratiques</h2>

        <div className="mt-10 grid gap-10 md:grid-cols-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-sun">Adresse</h3>
            <address className="mt-2 text-lg not-italic leading-snug">
              {club.address.street}
              <br />
              {club.address.postalCode} {club.address.city}
            </address>
            <a
              href={club.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block font-semibold underline decoration-sun decoration-2 underline-offset-4 hover:text-sun"
            >
              Voir l'itinéraire
            </a>
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-sun">Horaires</h3>
            <dl className="mt-2 text-lg leading-snug">
              {club.hoursSummary.map((row) => (
                <div key={row.days} className="flex justify-between gap-4 border-b border-cream/20 py-2">
                  <dt>{row.days}</dt>
                  <dd className="shrink-0 font-semibold tabular-nums">{row.hours}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-cream/80">{club.seasonNote}.</p>
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-sun">Contact</h3>
            <p className="mt-2 text-lg leading-snug">
              <a href={club.phone.href} className="font-semibold hover:text-sun">
                {club.phone.display}
              </a>
            </p>
            <p className="mt-1 text-lg leading-snug">
              <a
                href={club.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline decoration-sun decoration-2 underline-offset-4 hover:text-sun"
              >
                {club.instagram.handle}
              </a>{' '}
              sur Instagram
            </p>
          </div>
        </div>

        <a
          href="#reserver"
          className="mt-12 inline-block rounded-full bg-sun px-7 py-4 text-lg font-semibold text-petrol-950 transition-colors hover:bg-sun-deep"
        >
          Réserver un transat
        </a>
      </div>
    </section>
  )
}
