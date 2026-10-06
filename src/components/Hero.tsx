import { m as motion } from 'framer-motion'
import { club } from '../config/club'
import logo from '../assets/logo-gondolys.png'
import BookingCard from './BookingCard'

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-petrol-900 text-cream">
      <div
        aria-hidden="true"
        className="scales absolute inset-0 [mask-image:linear-gradient(115deg,transparent_10%,black_75%)]"
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <header className="flex items-center justify-between gap-4 py-5">
          <a href="#top" id="top" className="block shrink-0">
            <img
              src={logo}
              alt="Gondolys Club, depuis 1937"
              width={780}
              height={259}
              className="h-14 w-auto sm:h-16"
            />
          </a>
          <nav aria-label="Navigation principale" className="flex items-center gap-2 sm:gap-5">
            <a
              href="#infos"
              className="hidden rounded-full px-3 py-2 text-base font-medium text-cream/90 hover:text-cream sm:block"
            >
              Infos pratiques
            </a>
            <a
              href="#reserver"
              className="rounded-full bg-sun px-5 py-2.5 text-base font-semibold text-petrol-950 transition-colors hover:bg-sun-deep"
            >
              Réserver
            </a>
          </nav>
        </header>

        <motion.div
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.09 }}
          className="grid items-center gap-10 pb-16 pt-8 sm:pt-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14 lg:pb-24"
        >
          <div className="min-w-0">
            <motion.h1
              variants={rise}
              className="font-display text-[clamp(2.6rem,10.5vw,5.25rem)] leading-[0.98]"
            >
              Votre transat sur la plage centrale de Canet.
            </motion.h1>
            <motion.p variants={rise} className="mt-6 max-w-[34ch] text-xl leading-snug text-cream/90">
              Choisissez votre jour, le {club.name} vous garde une place face à la mer.
            </motion.p>
          </div>

          <motion.div variants={rise} className="min-w-0">
            <BookingCard />
          </motion.div>
        </motion.div>
      </div>

      <div aria-hidden="true" className="scallop relative text-cream" />
    </section>
  )
}
