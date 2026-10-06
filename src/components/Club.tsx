import { club } from '../config/club'

const offer = [
  { title: 'Transats face à la mer', text: 'Installés sur le sable, à quelques pas de l’eau.' },
  { title: 'Salons sous paillote', text: 'Pour passer l’après-midi à plusieurs, à l’ombre.' },
  { title: 'Terrasse ombragée', text: 'Fraîche et à l’abri du vent, même quand la tramontane souffle.' },
  { title: 'Cuisine méditerranéenne', text: 'Grillades à la plancha, salades fraîches et tapas.' },
]

export default function Club() {
  return (
    <section className="bg-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-24">
        <div className="min-w-0">
          <h2 className="font-display text-4xl leading-[1.02] text-petrol-900 sm:text-5xl">
            Sur le sable de Canet depuis {club.since}.
          </h2>
          <p className="mt-5 max-w-[46ch] text-lg text-petrol-950/85">
            Le Gondolys est un club de plage familial, posé sur la plage centrale, tout près des
            commerces. On y vient pour la journée : un transat le matin, une table à l'ombre à midi,
            un verre quand le soleil descend.
          </p>
        </div>

        <ul className="grid min-w-0 gap-x-10 gap-y-7 sm:grid-cols-2">
          {offer.map((item) => (
            <li key={item.title} className="border-t-2 border-petrol-900 pt-4">
              <h3 className="text-xl font-semibold text-petrol-900">{item.title}</h3>
              <p className="mt-1 text-petrol-950/80">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
