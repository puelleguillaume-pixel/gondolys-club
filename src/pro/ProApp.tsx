import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import logo from '../assets/logo-gondolys.png'
import { api } from '../lib/api'
import type { ProApi, Sunbed } from '../lib/api/types'
import { Link } from '../lib/router'
import DayView from './DayView'
import LayoutEditor from './LayoutEditor'
import { Button, errorMessage } from './ui'

type Tab = 'day' | 'layout'

export default function ProApp() {
  if (!api) return <Unavailable />
  return <Gate api={api} />
}

function Shell({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="min-h-screen bg-shell text-petrol-950">
      <header className="bg-petrol-950 text-cream">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/" aria-label="Retour au site">
              <img src={logo} alt="Gondolys Club" width={780} height={259} className="h-10 w-auto" />
            </Link>
            <span className="font-display text-xl">Espace pro</span>
          </div>
          {actions}
        </div>
      </header>
      {children}
    </div>
  )
}

function Unavailable() {
  return (
    <Shell>
      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl text-petrol-900">Espace pro indisponible</h1>
        <p className="mt-3 text-lg">
          La connexion sécurisée n'est pas encore configurée sur ce site. L'espace pro ouvrira dès que la
          base de données sera branchée.
        </p>
        <Link to="/" className="mt-6 inline-block font-semibold text-petrol-900 underline decoration-sun decoration-2 underline-offset-4">
          Retour au site
        </Link>
      </main>
    </Shell>
  )
}

function Gate({ api }: { api: ProApi }) {
  const [session, setSession] = useState<{ email: string } | null | undefined>(undefined)

  useEffect(() => {
    api.getSession().then(setSession, () => setSession(null))
  }, [api])

  if (session === undefined) return <Shell><p className="p-8 text-lg">Chargement…</p></Shell>
  if (!session) return <Login api={api} onSignedIn={() => api.getSession().then(setSession)} />
  return <Dashboard api={api} onSignOut={() => api.signOut().then(() => setSession(null))} />
}

function Login({ api, onSignedIn }: { api: ProApi; onSignedIn: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const signIn = async (e?: FormEvent) => {
    e?.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.signIn(email, password)
      onSignedIn()
    } catch (err) {
      setError(errorMessage(err))
    }
    setBusy(false)
  }

  const field = 'mt-1 min-h-12 w-full rounded-2xl border-2 border-petrol-900/25 bg-white px-4 text-base focus:border-petrol-900'

  return (
    <Shell>
      <main className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="rounded-[2rem] bg-white p-6 ring-1 ring-petrol-900/15 sm:p-8">
          <h1 className="font-display text-3xl leading-tight text-petrol-900">Connexion</h1>
          {api.mode === 'demo' ? (
            <>
              <p className="mt-3 text-lg">
                Version de démonstration. Les réservations affichées sont des exemples, et ce que vous
                modifiez reste dans ce navigateur.
              </p>
              <p className="mt-3 text-petrol-950/75">
                Sur le site en ligne, cet écran demandera l'e-mail et le mot de passe du club.
              </p>
              <Button variant="primary" id="pro-entrer" className="mt-6 w-full" disabled={busy} onClick={() => signIn()}>
                Entrer dans la démonstration
              </Button>
            </>
          ) : (
            <form onSubmit={signIn} className="mt-5">
              <label htmlFor="pro-email" className="block text-sm font-semibold">
                E-mail
              </label>
              <input id="pro-email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
              <label htmlFor="pro-mdp" className="mt-4 block text-sm font-semibold">
                Mot de passe
              </label>
              <input id="pro-mdp" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
              {error && (
                <p role="alert" className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 font-medium text-danger">
                  {error}
                </p>
              )}
              <Button type="submit" variant="primary" className="mt-6 w-full" disabled={busy}>
                Se connecter
              </Button>
            </form>
          )}
        </div>
      </main>
    </Shell>
  )
}

function Dashboard({ api, onSignOut }: { api: ProApi; onSignOut: () => void }) {
  const [tab, setTab] = useState<Tab>('day')
  const [layout, setLayout] = useState<Sunbed[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getLayout().then(setLayout, (e) => setError(errorMessage(e)))
  }, [api])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'day', label: 'Journée' },
    { id: 'layout', label: 'Disposition' },
  ]

  return (
    <Shell
      actions={
        <div className="flex items-center gap-2">
          <nav aria-label="Espace pro" className="flex rounded-full bg-cream/10 p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                id={`onglet-${t.id}`}
                aria-current={tab === t.id ? 'page' : undefined}
                onClick={() => setTab(t.id)}
                className={`min-h-10 rounded-full px-4 text-base font-semibold transition-colors ${
                  tab === t.id ? 'bg-cream text-petrol-950' : 'text-cream hover:bg-cream/10'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <button type="button" onClick={onSignOut} className="min-h-10 rounded-full px-3 text-base font-medium text-cream/85 hover:text-cream">
            Quitter
          </button>
        </div>
      }
    >
      {api.mode === 'demo' && (
        <p className="bg-sun px-4 py-2 text-center text-sm font-semibold text-petrol-950">
          Démonstration : réservations d'exemple, enregistrées dans ce navigateur uniquement.
        </p>
      )}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {error ? (
          <p role="alert" className="text-lg text-danger">{error}</p>
        ) : !layout ? (
          <p className="text-lg">Chargement du plan…</p>
        ) : tab === 'day' ? (
          <DayView api={api} layout={layout} />
        ) : (
          <LayoutEditor api={api} layout={layout} onSaved={setLayout} />
        )}
      </main>
    </Shell>
  )
}
