import { Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

import { SectionHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AgentBanner, AgentPage, AsyncBoundary, CaseQueueTable } from '@/features/agent/components';
import { useAgentCases, useAgentQueueStats } from '@/features/agent/hooks';
import { AGENT_ROUTES } from '@/features/agent/paths';

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
export default function AgentDashboardPage() {
  const stats = useAgentQueueStats();
  const queue = useAgentCases();

  return (
    <AgentPage title="Espace agent" description="Supervision et instruction des dossiers.">
      <AgentBanner className="mb-8" aria-labelledby="agent-workload">
        <h2 id="agent-workload" className="sr-only">
          Charge d’instruction
        </h2>

        {/*
          Les trois états sont écrits ici plutôt que délégués à <AsyncBoundary />,
          qui rend son erreur dans un <EmptyState /> encré en `text-on-surface` :
          du quasi-noir sur ce navy, soit 1,2:1. Le même parti que
          <CaseAssessmentCard /> et <CaseAuditCard />, pour la même raison — un
          panneau dont le fond n'est pas clair porte ses propres états.
        */}
        {stats.isLoading && (
          <div aria-busy="true" aria-live="polite" className="space-y-3">
            <Skeleton className="h-11 w-56 bg-[color:var(--agent-subtle-on-primary)]" />
            <Skeleton className="h-5 w-72 bg-[color:var(--agent-subtle-on-primary)]" />
          </div>
        )}

        {stats.error && (
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-body-md text-primary-fixed-dim">
              La charge d’instruction n’a pas pu être chargée.
            </p>
            <Button variant="outline" size="sm" onClick={stats.reload}>
              Réessayer
            </Button>
          </div>
        )}

        {stats.data && (
          <>
            <p className="text-display tabular-nums text-primary-foreground">
              {stats.data.pending}{' '}
              <span className="text-headline-md">
                {stats.data.pending === 1 ? 'dossier en attente' : 'dossiers en attente'}
              </span>
            </p>
            <p className="mt-2 text-body-md text-primary-fixed-dim">
              dont{' '}
              <span className="tabular-nums text-primary-foreground">
                {stats.data.toReviewToday}
              </span>{' '}
              à vérifier aujourd’hui ·{' '}
              <span className="tabular-nums text-primary-foreground">
                {stats.data.citizensTracked}
              </span>{' '}
              {stats.data.citizensTracked === 1 ? 'allocataire suivi' : 'allocataires suivis'}
            </p>
          </>
        )}
      </AgentBanner>

      <Card>
        <CardHeader>
          <SectionHeader
            title="File d’instruction"
            as="h2"
            action={
              <Button variant="outline" size="sm" asChild>
                <Link to={AGENT_ROUTES.cases}>Voir tous les dossiers</Link>
              </Button>
            }
          />
        </CardHeader>

        <CardContent className="px-0">
          <AsyncBoundary
            resource={queue}
            fallback={
              <div className="space-y-2 px-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            }
            empty={{
              icon: Inbox,
              title: 'Aucun dossier à instruire',
              description: 'La file d’instruction est vide.',
            }}
          >
            {(cases) => (
              <CaseQueueTable caption="Dossiers en attente d’instruction" cases={cases} />
            )}
          </AsyncBoundary>
        </CardContent>
      </Card>
    </AgentPage>
  );
}
