# Gondolys Club

Site vitrine du Gondolys Club (plage centrale, Canet-en-Roussillon) avec le module de réservation de transats.

Stack : React 19, Vite, TypeScript, Tailwind CSS 4, Framer Motion. Hébergement Netlify.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # vérifie les types puis génère dist/
```

## Espace pro

Accessible par le lien « Espace pro » du pied de page, ou directement sur `/pro`.

Chaque réservation venue du site est une **demande** : elle reste « à confirmer » et n'occupe aucun transat tant que le club ne l'a pas confirmée. Le club la confirme (attribution automatique, ou en touchant un transat libre pour choisir l'emplacement) ou la refuse. Les réservations saisies par le club sont confirmées d'office.

Tant qu'aucune base n'est branchée, les demandes ne quittent pas le navigateur du client : sur le site en ligne, le module renvoie donc vers le téléphone du club.

- **Journée** : plan des 50 transats pour le jour choisi (libre, réservé, client arrivé, bloqué), liste des réservations, saisie d'une réservation, arrivée, absence, annulation, changement de transat, blocage d'un transat.
- **Disposition** : glisser-déposer des transats par paire ou à l'unité, rotation, annuler / rétablir, enregistrement. La disposition vaut pour tous les jours et n'est jamais visible côté client.

L'attribution automatique des transats est dans `src/lib/api/allocate.ts` : paire entière pour 2, paires voisines pour 3 ou 4, transat déjà isolé pour une personne seule.

### Mode démonstration

`npm run dev` active `VITE_DEMO=true` (fichier `.env.development`) : l'espace pro s'ouvre sans mot de passe, avec des réservations d'exemple enregistrées dans le navigateur.

Le build de production n'active pas ce mode : `/pro` affiche « Espace pro indisponible » tant que Supabase n'est pas branché. Ne pas mettre `VITE_DEMO=true` sur Netlify, l'espace serait ouvert à tout le monde.

### Brancher Supabase

L'interface ne parle qu'au contrat `ProApi` (`src/lib/api/types.ts`). Il reste à écrire un adaptateur Supabase qui l'implémente et à le renvoyer depuis `src/lib/api/index.ts`. Aucun composant n'est à modifier.

## Déployer sur Netlify

Connecter le dépôt GitHub : `netlify.toml` contient déjà la commande de build, le dossier publié, la redirection SPA et les en-têtes de cache.

## Où modifier quoi

| Besoin | Fichier |
| --- | --- |
| Adresse, téléphone, horaires, Instagram | `src/config/club.ts` (objet `club`) |
| Jours proposés, maximum par réservation, prix, paiement sur place | `src/config/club.ts` (objet `booking`) |
| Dimensions du plan, disposition de départ | `src/lib/api/defaultLayout.ts` |
| Couleurs et typographies | `src/index.css` (bloc `@theme`) |
| Logo | `src/assets/logo-gondolys.png` |
| Titre, description, Open Graph, données structurées | `index.html` |

## État actuel

Fait :
- Page vitrine complète, mobile d'abord.
- Module de réservation côté interface : choix du jour (fuseau Europe/Paris), nombre de transats, récapitulatif.
- SEO de base : balises meta, Open Graph, schema.org, robots.txt.
- Espace pro complet côté interface, en mode démonstration.
- Polices auto-hébergées (aucun appel à Google Fonts, donc rien à déclarer côté RGPD).

À faire avant mise en ligne :
- Remplacer le logo par le fichier source du client. Le PNG actuel est détouré depuis une capture d'écran.
- Faire confirmer les horaires et la saison par le club (repris des annuaires en ligne).
- Renseigner `pricePerSunbed` si le prix doit s'afficher.
- Ajouter les mentions légales et la politique de confidentialité (raison sociale, SIRET, hébergeur).
- Ajouter une image Open Graph (`og:image`) et l'URL définitive (`og:url`, lien canonique, sitemap).

À faire pour ouvrir la réservation en ligne :
- Créer le projet Supabase : tables, RPC de réservation (même règle que `allocate.ts`), RLS, compte admin.
- Écrire l'adaptateur Supabase de l'espace pro (voir plus haut).
- Côté client : authentification puis appel de la RPC depuis `handleContinue` dans `src/components/BookingCard.tsx`, et passer `booking.onlineOpen` à `true`.
- Espace pro : fermeture d'une journée, réglages (prix, saison), statistiques, mise à jour en temps réel.
