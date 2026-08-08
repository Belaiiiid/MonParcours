import { Search } from 'lucide-react';

import { ROUTES } from '@/app/router/paths';
import { CitizenBackButton } from '@/components/citizen/CitizenBackButton';
import { useSessionStore } from '@/store/sessionStore';

interface AdministrationsHeroProps {
  /** Filtre courant de la liste des administrations. */
  query: string;
  onQueryChange: (value: string) => void;
}

/**
 * La barre de recherche, commune aux deux bandeaux.
 *
 * Le focus est porté par la bordure de la pastille et non par un anneau sur le
 * champ : la règle globale `:focus-visible` (index.css) dessinait un rectangle
 * bleu, l'anneau suivant le rayon de l'input — nul — et non celui de la
 * pastille.
 */
function SearchField({ query, onQueryChange }: AdministrationsHeroProps) {
  return (
    <>
      <label htmlFor="administrations-search" className="sr-only">
        Rechercher une administration
      </label>
      <div className="flex items-center gap-3 rounded-full border-2 border-white bg-white px-5 py-3 shadow-[0_12px_32px_-12px_rgba(9,31,78,0.35)] transition-colors duration-200 focus-within:border-[#3158b0] sm:px-6 sm:py-3.5">
        <Search className="size-5 shrink-0 text-[#3158b0]" aria-hidden="true" />
        {/* `type="text"` et non `search` : les navigateurs habillent le champ de
            recherche de leurs propres décorations — cadre au focus, croix
            d'effacement — qui ne suivent aucune de nos couleurs. Le rôle est
            déjà porté par `role="search"` sur le formulaire. */}
        <input
          id="administrations-search"
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Rechercher une administration…"
          // `!` sur l'anneau : la règle globale `:focus-visible` d'index.css a la
          // même spécificité qu'un utilitaire, l'important tranche.
          className="w-full appearance-none border-0 bg-transparent text-sm text-[#102a74] outline-none placeholder:text-[#102a74]/50 focus:outline-none focus-visible:outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 sm:text-base"
        />
      </div>
    </>
  );
}

/** La courbe qui referme le bandeau sur le fond de la page. */
function ExitCurve() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-10 w-full text-background md:h-14"
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M0 80V44C240 8 560 0 1440 0V80Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Bandeau d'ouverture de la liste des administrations — deux versions, selon
 * qu'une session est ouverte ou non.
 *
 * **Visiteur** : la photo institutionnelle, ancrée à droite, et le texte aligné
 * à gauche sur le ciel. La page prolonge l'accueil public (elle en porte aussi
 * l'en-tête, cf. `CitizenAppShell` variante `landing`), et un retour ramène
 * d'où l'on vient.
 *
 * **Citoyen connecté** : la planche des administrations, centrée, texte centré
 * dessus. Pas de retour : la liste est son point de départ, il n'y a rien
 * derrière.
 *
 * Le bandeau sort des marges de `main` (`-mx-4 md:-mx-8 -mt-8`) pour toucher
 * les bords de l'écran, et se referme sur une courbe qui rejoint le fond de la
 * page : la transition vers la grille de cartes est dessinée, pas subie.
 */
export function AdministrationsHero({ query, onQueryChange }: AdministrationsHeroProps) {
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);
  const displayName = useSessionStore((state) => state.displayName);

  if (isAuthenticated) {
    return (
      <section className="relative -mx-4 -mt-8 overflow-hidden md:-mx-8">
        {/* Le sujet de l'image — la planche de logos — est centré : le cadrage
            l'est aussi, et le texte se pose dessus au même endroit. */}
        <img
          src="/back.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover object-center"
        />

        {/* Voile blanc léger : les logos de la planche sont bleus, comme le
            texte posé dessus. Assez pour les faire reculer, pas assez pour
            qu'on cesse de les reconnaître. */}
        <div aria-hidden="true" className="absolute inset-0 bg-white/30" />

        {/* Rembourrage bas plus épais que le haut : le bloc reste centré dans ce
            qu'il lui reste de place, donc remonte d'environ 24px. La hauteur du
            bandeau, elle, ne bouge pas. */}
        <div className="relative mx-auto flex min-h-[420px] max-w-7xl flex-col items-center justify-center px-6 pb-24 pt-12 text-center sm:px-10 md:min-h-[500px] md:pb-28 md:pt-14 lg:px-14">
          <div className="max-w-2xl">
            {/* Le nom manque le temps que la session se charge : on salue sans
                lui plutôt que d'afficher un gabarit vide ou de faire sauter la
                ligne quand il arrive. */}
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3158b0] sm:text-sm">
              {displayName ? `Bienvenue ${displayName}` : 'Bienvenue'}
            </p>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-[1.08] text-[#102a74] sm:text-4xl lg:text-5xl">
              Choisissez votre administration
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-[#102a74]/80 sm:text-base">
              Sélectionnez l’administration avec laquelle vous souhaitez interagir. D’autres seront
              progressivement disponibles.
            </p>

            <form
              role="search"
              className="mx-auto mt-8 w-full max-w-xl"
              onSubmit={(event) => event.preventDefault()}
            >
              <SearchField query={query} onQueryChange={onQueryChange} />
            </form>
          </div>
        </div>

        <ExitCurve />
      </section>
    );
  }

  return (
    <section className="relative -mx-4 -mt-8 overflow-hidden md:-mx-8">
      {/* La photo est ancrée à droite : la colonne de texte reste sur le ciel,
          où le navy tient son contraste sans voile. */}
      <img
        src="/herosec2.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 size-full object-cover object-right"
      />

      {/* Retour, posé sur le bandeau juste sous la barre de navigation.
          `pointer-events-none` sur la bande, rendus au seul bouton : la zone
          vide à sa droite ne doit rien intercepter. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
        <div className="pl-4 pt-6 sm:pl-6">
          <CitizenBackButton fallbackTo={ROUTES.home} className="pointer-events-auto" />
        </div>
      </div>

      <div className="relative mx-auto flex min-h-[420px] max-w-7xl flex-col justify-center px-6 py-16 sm:px-10 md:min-h-[500px] md:py-20 lg:px-14">
        <div className="max-w-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#3158b0]">
            Bienvenue sur Administral
          </p>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-[1.08] text-[#102a74] sm:text-4xl lg:text-5xl">
            Cherchez une administration
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#102a74]/80 sm:text-base">
            Sélectionnez l’administration avec laquelle vous souhaitez interagir. D’autres seront
            progressivement disponibles.
          </p>

          <form
            role="search"
            className="mt-8 w-full max-w-xl"
            onSubmit={(event) => event.preventDefault()}
          >
            <SearchField query={query} onQueryChange={onQueryChange} />
          </form>
        </div>
      </div>

      <ExitCurve />
    </section>
  );
}
