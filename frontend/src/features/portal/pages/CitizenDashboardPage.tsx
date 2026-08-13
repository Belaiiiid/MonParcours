import { ArrowLeft, Banknote, Building2, Home, LogIn, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { CAF_SERVICES, type CafServiceId } from '@/app/config/cafServices';
import { ROUTES } from '@/app/router/paths';
import { ServiceCard } from '@/components/citizen/ServiceCard';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useVoicePage } from '@/features/voice/context/VoicePageContext';
import type { VoicePageAction } from '@/features/voice/types';
import { useSessionStore } from '@/store/sessionStore';

/** One recognisable icon per CAF service, rather than a single generic mark repeated on every card. */
const CAF_SERVICE_ICONS: Record<CafServiceId, LucideIcon> = {
  apl: Home,
  af: Users,
  alf: Building2,
  'prime-activite': Banknote,
};

/**
 * Toutes les pastilles au bleu de marque : une couleur par service donnait à
 * lire une catégorie qui n'existe pas — ce sont quatre aides de la même caisse,
 * pas quatre familles de services.
 */
const CAF_SERVICE_BADGE = 'bg-brand';

/**
 * "Mes services" — CAF's own services, reached once CAF has been chosen on
 * `/administrations`. No profile gate here any more: the questions to ask
 * depend on *which* service is opened, so profiling now happens per service,
 * on entering it (see `RequireApplProfile`), not once globally before this
 * hub even shows.
 *
 * Only `apl` is wired to a real backend; the rest render as locked tiles
 * rather than pretending to be functional. Reachable without an account
 * (see `ROUTES.administrations`) — opening APL à l'Aide while unauthenticated
 * sends the citizen to the public chatbot (`ROUTES.home`) instead of the real
 * dossier, exactly like following any other link into the citizen area would.
 */
export default function CitizenDashboardPage() {
  useDocumentTitle('Mes services');
  const { isAuthenticated } = useSessionStore();
  const navigate = useNavigate();

  const aplAction: VoicePageAction = {
    id: 'select_apl',
    label: 'APL à l’Aide',
    description: 'Ouvrir le service APL à l’Aide',
    intent: { type: 'click_action', actionId: 'select_apl' },
  };

  useVoicePage({
    readableText:
      'Page des services CAF. Seule l’APL à l’Aide est disponible pour le moment, les autres services arriveront bientôt.',
    actions: [aplAction],
    actionCallbacks: {
      select_apl: () => navigate(isAuthenticated ? ROUTES.dossier : ROUTES.home),
    },
  });

  return (
    /* Le hero se veut bord à bord : ces marges négatives annulent le
       rembourrage de `main` (`px-4 md:px-8`, `py-8`) sans toucher à la coque,
       qui sert toutes les autres pages. */
    <div className="-mx-4 -mt-8 md:-mx-8">
      {/* Bandeau de passage : il dit qu'on vient de quitter Administral pour
          entrer chez la CAF. `/portal` s'ouvre aussi depuis un signet, où
          « Mes services » seul ne dit pas les services de qui. */}
      <section className="relative flex min-h-[450px] items-center overflow-hidden bg-[linear-gradient(120deg,#14265e,#1e3a8a)] px-4 py-16 text-white md:px-8 lg:min-h-[520px]">
        {/* L'illustration occupe la moitié droite et déborde en haut et à
            droite. Deux masques dégradés la font naître du fond plutôt que
            d'y être posée : elle s'efface vers la gauche, sous le texte, et
            vers le bas, où commence le panneau blanc. Masquée sous 768px, où
            elle passerait derrière le titre. */}
        <img
          src="/caf_back.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-16 hidden h-[calc(100%+8rem)] w-[58%] object-cover opacity-80 [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent_0%,black_55%),linear-gradient(to_top,transparent_0%,black_38%)] md:block"
        />
        <div className="relative mx-auto w-full max-w-7xl">
          {/* Un lien vers `/administrations`, et non le retour d'historique de
              `CitizenBackButton` : la CAF se quitte toujours par la liste des
              administrations, d'où qu'on soit venu — depuis un service CAF, un
              signet ou l'assistant, « revenir » veut dire remonter d'un cran
              dans le portail, pas défaire le dernier pas. */}
          <Link
            to={ROUTES.administrations}
            aria-label="Retour aux administrations"
            className="mb-8 inline-flex size-10 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-sm transition-colors hover:border-white/50 hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#14265e]"
          >
            <ArrowLeft className="size-[18px]" aria-hidden="true" />
          </Link>

          <p className="eyebrow text-[#a8c0f0]">Administration CAF</p>
          <h1 className="mt-4 max-w-2xl font-display text-[2.25rem] font-extrabold leading-[1.15] sm:text-[2.5rem]">
            Vous accédez aux services de la Caisse d’Allocations Familiales
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85">
            Aides au logement, à la famille et à la solidarité — via Administral
          </p>
        </div>
      </section>

      {/* Le contenu vit dans son propre panneau, détaché du hero : la
          respiration entre les deux dit que la bannière est finie de lire. */}
      <div className="relative mt-12 rounded-[24px] bg-white px-4 pb-28 pt-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          {!isAuthenticated && (
            // Anonymous visitors get the one thing that unlocks the rest, instead of
            // shortcuts to pages that would bounce them straight to the sign-in form.
            <div className="mb-14 flex flex-col gap-4 rounded-sm border border-border/60 bg-brand-soft p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-lg font-extrabold text-ink">
                  Connectez-vous pour déposer un dossier
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Vous pouvez parcourir les services librement. La simulation, le dépôt de pièces et
                  le suivi demandent un espace personnel.
                </p>
              </div>
              <Link
                to={ROUTES.login}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-sm bg-brand px-6 py-3 text-label-md text-white shadow-soft transition-colors duration-200 hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <LogIn className="size-4" aria-hidden="true" />
                Se connecter
              </Link>
            </div>
          )}

          <section>
            {/* Même gabarit que « Services principaux » sur l'accueil : eyebrow,
                titre centré en grand, puis une ligne d'explication. */}
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <p className="eyebrow text-base">Services CAF</p>
              <h2 className="mt-4 text-4xl font-extrabold leading-tight text-ink">
                Les aides de la Caisse d’Allocations Familiales
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Chaque service a ses propres conditions et ses propres pièces justificatives. Ouvrez
                celui qui vous concerne : l’assistant vous guide ensuite pas à pas.
              </p>
            </div>

            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {CAF_SERVICES.map((service) => (
                <li key={service.id}>
                  <ServiceCard
                    size="compact"
                    name={service.name}
                    fullName={service.fullName}
                    description={service.description}
                    // APL is the one live service; without a session it leads to the
                    // public assistant rather than a dossier the visitor cannot open.
                    to={service.id === 'apl' && !isAuthenticated ? ROUTES.home : service.basePath}
                    available={service.status === 'available'}
                    icon={CAF_SERVICE_ICONS[service.id]}
                    badgeClassName={CAF_SERVICE_BADGE}
                    imageUrl={service.photoUrl}
                    ctaLabel="Ouvrir le service"
                  />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
