import { club } from '../config/club'
import logo from '../assets/logo-gondolys.png'
import { Link } from '../lib/router'

export default function Footer() {
  return (
    <footer className="bg-petrol-950 text-cream/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-5 py-8 sm:px-8">
        <img
          src={logo}
          alt={club.name}
          width={780}
          height={259}
          loading="lazy"
          className="h-14 w-auto"
        />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base">
          <p>
            © {new Date().getFullYear()} {club.name}, {club.address.city}.
          </p>
          <Link
            to="/pro"
            id="lien-espace-pro"
            className="font-semibold text-cream underline decoration-cream/40 underline-offset-4 hover:decoration-sun"
          >
            Espace pro
          </Link>
        </div>
      </div>
    </footer>
  )
}
