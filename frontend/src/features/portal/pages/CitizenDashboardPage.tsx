import { Banknote, Building2, Home, LogIn, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { CAF_SERVICES, type CafServiceId } from '@/app/config/cafServices';
import { getService } from '@/app/config/services';
import { ROUTES } from '@/app/router/paths';
import { CitizenPageHeader } from '@/components/citizen/CitizenPageHeader';
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
  const { displayName, isAuthenticated } = useSessionStore();
  const navigate = useNavigate();
  const caf = getService('caf');

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
    <div className="mx-auto max-w-7xl">
      <CitizenPageHeader
        backTo={ROUTES.administrations}
        eyebrow="Administration CAF"
        title="Mes services"
        description={
          displayName
            ? `Bienvenue ${displayName}, choisissez le service que vous souhaitez utiliser.`
            : 'Choisissez le service que vous souhaitez utiliser.'
        }
      />

      {/* Bandeau de passage : il dit qu'on vient de quitter Administral pour
          entrer chez la CAF. `/portal` s'ouvre aussi depuis un signet, où
          « Mes services » seul ne dit pas les services de qui. */}
      {caf && (
        <div className="relative mb-10 flex items-center gap-4 overflow-hidden rounded-[14px] bg-[linear-gradient(120deg,#14265e,#1e3a8a)] p-5 text-white">
          {/* Cercle décoratif, débordant du coin haut-droit. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-white/10"
          />

          <span className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-white font-display text-sm font-extrabold text-[#1e3a8a] shadow-soft">
            CAF
          </span>

          <div className="relative min-w-0">
            <p className="text-base font-bold leading-snug">
              Vous accédez aux services de la Caisse d’Allocations Familiales
            </p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-white/85">
              Aides au logement, à la famille et à la solidarité — via Administral
            </p>
          </div>

          {/* Masquée sous 640px : la ligne y passerait sous le texte et ferait
              grandir le bandeau pour une mention accessoire. */}
          <span className="relative ml-auto hidden shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white sm:inline-flex">
            🔒 Connexion sécurisée
          </span>
        </div>
      )}

      {!isAuthenticated && (
        // Anonymous visitors get the one thing that unlocks the rest, instead of
        // shortcuts to pages that would bounce them straight to the sign-in form.
        <div className="mb-14 flex flex-col gap-4 rounded-sm border border-border/60 bg-brand-soft p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-extrabold text-ink">
              Connectez-vous pour déposer un dossier
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Vous pouvez parcourir les services librement. La simulation, le dépôt de pièces et le
              suivi demandent un espace personnel.
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

      {/* Les services sur leur propre fond : la bande les détache de l'accès
          rapide au-dessus, qui n'est pas de la même nature. */}
      <section className="rounded-2xl bg-[#f6fbff] p-6 sm:p-8">
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
  );
}
