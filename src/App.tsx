import { Suspense, lazy } from 'react'
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'
import Hero from './components/Hero'
import Club from './components/Club'
import Steps from './components/Steps'
import Infos from './components/Infos'
import Footer from './components/Footer'
import { useRoute } from './lib/router'

// L'espace pro est chargé à la demande : les visiteurs du site ne le téléchargent pas.
const ProApp = lazy(() => import('./pro/ProApp'))

export default function App() {
  const route = useRoute()

  if (route.startsWith('/pro')) {
    return (
      <Suspense fallback={<p className="p-8 text-lg">Chargement…</p>}>
        <ProApp />
      </Suspense>
    )
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <a
          href="#reserver"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-sun focus:px-4 focus:py-2 focus:text-petrol-950"
        >
          Aller à la réservation
        </a>
        <main>
          <Hero />
          <Club />
          <Steps />
          <Infos />
        </main>
        <Footer />
      </MotionConfig>
    </LazyMotion>
  )
}
