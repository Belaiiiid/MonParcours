import { FolderOpen, Inbox, Search, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { CitizenCard } from '@/components/citizen/CitizenCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AgentPage, AsyncBoundary, CaseQueueTable } from '@/features/agent/components';
import { useAgentCases, useAgentQueueStats } from '@/features/agent/hooks';
import { AGENT_ROUTES } from '@/features/agent/paths';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/store/sessionStore';

/**
 * Les trois compteurs se lisent d'un coup d'œil, côte à côte, séparés par un
 * simple filet : trois cartes posées sur le bandeau auraient fait des cartes
 * dans une carte, et un empilement vertical aurait rendu la comparaison
 * impossible. En dessous de 640px le filet passe à l'horizontale — trois
 * colonnes n'y laisseraient pas la place d'un nombre.
 */
const METRIC_ROW = [
  'grid gap-6 divide-y divide-[color:var(--agent-overview-divider)]',
  'sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-y-0',
].join(' ');

/** Une cellule de compteur : pastille, nombre, intitulé. */
const METRIC_CELL = 'flex items-center gap-5 pt-6 first:pt-0 sm:px-8 sm:py-0 sm:first:pl-0 sm:last:pr-0';

function Metric({ icon: Icon, value, label }: { icon: LucideIcon; value: number; label: string }) {
  return (
    <div className={METRIC_CELL}>
      {/* Pastille décorative : le pictogramme redit l'intitulé, il ne le
          remplace pas — d'où `aria-hidden` sur l'icône et rien de plus. */}
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[color:var(--agent-overview-tile)] text-[color:var(--agent-overview-icon)] shadow-[0_1px_2px_rgb(15_43_116/0.08)]"
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      {/* `flex-col-reverse` : le nombre se lit au-dessus de son intitulé, mais
          `dt` reste avant `dd` dans le DOM — c'est l'ordre qu'attend la liste de
          définitions, et celui que restitue un lecteur d'écran. */}
      <div className="flex min-w-0 flex-col-reverse">
        <dt className="mt-2 text-body-sm leading-snug text-[color:var(--agent-overview-ink-muted)]">{label}</dt>
        <dd className="font-sans text-[2rem] font-bold leading-none tabular-nums text-[color:var(--agent-overview-ink)]">
          {value}
        </dd>
      </div>
    </div>
  );
}

/**
 * Back-office landing screen: workload counters plus the head of the
 * instruction queue. The full queue, with filtering and pagination, lives in
 * the `cases` sub-domain.
 *
 * Data flow: this page → hooks → agentCaseService → data source. It performs no
 * fetching, no filtering and no arithmetic; the counters are aggregated by the
 * service and the rows arrive pre-sorted and pre-projected.
 *
 * Les trois compteurs ne sont plus trois cartes égales. Ils ne pèsent pas
 * pareil : « en attente » est la charge, « à vérifier aujourd'hui » en est le
 * sous-ensemble urgent, « allocataires suivis » n'est qu'un ordre de grandeur.
 * Trois tuiles identiques affirmaient le contraire — et laissaient la file
 * d'instruction, qui est la vraie valeur de l'écran, en second rideau.
 */
/**
 * Le titre de l'ecran s'adresse a la personne, pas au lieu.
 *
 * « Espace agent » redisait ce que le rail affiche deja en permanence sous la
 * marque. Une salutation datee dit quelque chose que rien d'autre a l'ecran ne
 * porte, et situe la journee de travail — c'est la premiere page ouverte le
 * matin, souvent laissee ouverte jusqu'au soir.
 *
 * Bascule a midi et a 18h. `Bonsoir` n'etait pas demande mais s'impose : sans
 * lui, une prise de poste de nuit serait accueillie par « Bon apres-midi ».
 */
function greeting(hour: number): string {
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function AgentDashboardPage() {
  const stats = useAgentQueueStats();
  const queue = useAgentCases();
  const displayName = useSessionStore((state) => state.displayName);

  /* Le nom arrive apres le premier rendu (`bootstrap`). Sans lui la salutation
     tient seule plutot que d'afficher un titre a trou puis de sauter. */
  const title = displayName ? `${greeting(new Date().getHours())} ${displayName}` : greeting(new Date().getHours());

  return (
    <AgentPage
      title={title}
      // L'onglet du navigateur garde un intitule stable : une salutation y
      // serait illisible dans une liste d'onglets, et changerait a midi.
      documentTitle="Espace agent"
      description="Supervision et instruction des dossiers."
      // La supervision tient dans l'écran : c'est la file d'instruction, en
      // bas, qui défile pour elle-même quand elle dépasse.
      fill
    >
      <p className="eyebrow mb-3 text-[color:var(--agent-overview-icon)]">Vue d’ensemble</p>

      {/* Bleu pâle, et non plus la surface navy inversée d'`AgentBanner` (qui
          sert toujours l'instruction et la décision) : le rail doit rester le
          seul bloc sombre de l'écran. Voir `--agent-overview-*`, où la
          hiérarchie de valeurs est décrite. */}
      <section
        aria-labelledby="agent-workload"
        className="mb-8 shrink-0 rounded-2xl border border-[color:var(--agent-overview-border)] bg-[color:var(--agent-overview-surface)] px-6 py-6 shadow-[var(--agent-card-shadow)] sm:px-10 sm:py-8"
      >
        <h2 id="agent-workload" className="sr-only">
          Charge d’instruction
        </h2>

        {/*
          Les trois états sont écrits ici plutôt que délégués à <AsyncBoundary />,
          dont le vide et l'erreur sont dessinés pour une carte blanche : sur ce
          bleu pâle la pastille `accent` se fondrait dans le fond.
        */}
        {stats.isLoading && (
          <div aria-busy="true" aria-live="polite" className={METRIC_ROW}>
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn(METRIC_CELL, 'gap-4')}>
                <Skeleton className="size-12 shrink-0 rounded-xl bg-[color:var(--agent-overview-divider)]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-8 w-16 bg-[color:var(--agent-overview-divider)]" />
                  <Skeleton className="h-4 w-28 bg-[color:var(--agent-overview-divider)]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {stats.error && (
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-body-md text-[color:var(--agent-overview-ink-muted)]">
              La charge d’instruction n’a pas pu être chargée.
            </p>
            <Button variant="outline" size="sm" onClick={stats.reload}>
              Réessayer
            </Button>
          </div>
        )}

        {stats.data && (
          <dl className={METRIC_ROW}>
            <Metric
              icon={FolderOpen}
              value={stats.data.pending}
              label={stats.data.pending === 1 ? 'Dossier en attente' : 'Dossiers en attente'}
            />
            <Metric icon={Search} value={stats.data.toReviewToday} label="À vérifier aujourd’hui" />
            <Metric
              icon={Users}
              value={stats.data.citizensTracked}
              label={
                stats.data.citizensTracked === 1 ? 'Allocataire suivi' : 'Allocataires suivis'
              }
            />
          </dl>
        )}
      </section>

      {/* L'intitulé sort de la carte, comme celui du bandeau juste au-dessus :
          deux sections de même rang s'annoncent de la même façon, et la carte
          n'a plus qu'une chose à porter — la file elle-même. Le bouton monte
          avec lui : il commande la section, pas la carte. */}
      <section aria-labelledby="agent-queue" className="flex min-h-0 flex-1 flex-col">
        <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
          <h2 className="eyebrow" id="agent-queue">
            File d’instruction
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link to={AGENT_ROUTES.cases}>Voir tous les dossiers</Link>
          </Button>
        </div>

        {/* `CitizenCard` : meme surface que les cartes du portail citoyen —
            bordure fine, angles de 16px. L'ombre est celle du back-office
            (`--agent-card-shadow`) : large et teintee du navy, la carte etant
            desormais posee sur un fond bleute et non sur du blanc. */}
        <CitizenCard className="flex min-h-0 flex-1 flex-col shadow-[var(--agent-card-shadow)]">
          {/* Le seul ascenseur de l'écran : la tête de file peut être plus
              longue que la place qui reste, le reste de la page non. */}
          <div className="min-h-0 flex-1 overflow-y-auto py-2">
            <AsyncBoundary
              resource={queue}
              fallback={
                <div className="space-y-2 px-6 py-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              }
              empty={{
                icon: Inbox,
                variant: 'accent',
                title: 'Aucun dossier à instruire',
                // Ce vide-là est une bonne nouvelle : le dire, plutôt que
                // constater « la file est vide » comme on constate une panne.
                description:
                  'Votre file est à jour. Aucun dossier ne nécessite votre attention pour le moment.',
                // La file complète reste à un clic : le poste de travail n'est
                // pas fini parce que la tête de file l'est.
                actions: (
                  <Button asChild>
                    <Link to={AGENT_ROUTES.cases}>Voir les dossiers</Link>
                  </Button>
                ),
              }}
            >
              {(cases) => (
                <CaseQueueTable caption="Dossiers en attente d’instruction" cases={cases} />
              )}
            </AsyncBoundary>
          </div>
        </CitizenCard>
      </section>
    </AgentPage>
  );
}
