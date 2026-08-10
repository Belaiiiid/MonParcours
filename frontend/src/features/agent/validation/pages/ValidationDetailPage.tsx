import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AgentPage, AsyncBoundary } from '@/features/agent/components';
import {
  CaseDecisionBanner,
  CaseDocumentsCard,
  CaseFraudCard,
  CaseSection,
  CoherenceReportCard,
  CompletenessReportCard,
} from '@/features/agent/cases/components';
import { DecisionOutcomeCard, DecisionPanel } from '@/features/agent/validation/components';
import { useAgentCase, useCaseDecision } from '@/features/agent/hooks';
import { AGENT_ROUTES } from '@/features/agent/paths';

/**
 * The decision screen: accept or reject, with the case evidence in view.
 *
 * Deux colonnes 2/3 – 1/3, la disposition que la charte réserve aux écrans de
 * suivi (DESIGN.md, « Layout ») : les preuves à gauche, la décision à droite.
 *
 * C'est un correctif d'usage autant qu'une mise en scène. Empilés, les deux
 * boutons qui closent le dossier arrivaient sous les rapports, les pièces et
 * l'analyse d'authenticité — donc hors écran, et l'agent devait remonter pour
 * agir. Le rail les garde à portée pendant toute la lecture.
 *
 * La colonne de droite n'est collante que tant que la décision n'est pas prise :
 * `DecisionOutcomeCard` est haute (message transmis + éléments justificatifs) et
 * un bloc collant plus haut que la fenêtre rendrait son bas inatteignable. Une
 * fois la décision rendue il n'y a plus rien à faire, donc plus rien à suivre.
 */
export default function ValidationDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const resource = useAgentCase(caseId);
  const controller = useCaseDecision(caseId);

  return (
    <AgentPage
      title="Décision"
      // La référence n'est pas répétée ici : le bandeau la porte.
      documentTitle="Décision — Espace agent"
      actions={
        <Button variant="outline" asChild>
          <Link to={AGENT_ROUTES.validation}>
            <ArrowLeft aria-hidden="true" />
            Retour à la file
          </Link>
        </Button>
      }
    >
      <AsyncBoundary
        resource={resource}
        isEmpty={() => false}
        fallback={
          <div className="space-y-gutter">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        }
      >
        {(caseRecord) => {
          /*
           * A decision taken just now, or one already recorded on the case from
           * an earlier visit — the screen must not look undecided just because
           * this mount has no local state yet.
           */
          const decision = controller.decision ?? caseRecord.decision;

          return (
            <div className="space-y-8">
              {/* Le même bandeau que l'écran d'instruction : un agent qui passe
                  du dossier à sa décision doit retrouver la même tête. */}
              <CaseDecisionBanner caseRecord={caseRecord} />

              <div className="grid gap-gutter lg:grid-cols-3">
                <div className="space-y-8 lg:col-span-2">
                  <CaseSection
                    id="validation-machine"
                    tone="machine"
                    title="Ce que la machine a instruit"
                    description="Les analyses sur lesquelles la décision doit s’appuyer. Elles ne décident pas — vous décidez."
                  >
                    <CompletenessReportCard
                      report={caseRecord.completenessReport}
                      headingLevel="h3"
                    />
                    <CoherenceReportCard report={caseRecord.coherenceReport} headingLevel="h3" />
                    <CaseFraudCard documents={caseRecord.documents} headingLevel="h3" />
                  </CaseSection>

                  {/* Les pièces sont ouvrables ici avant tout : c'est l'écran où
                      la décision se signe, et l'agent doit pouvoir relire une
                      pièce sans quitter la page. */}
                  <CaseSection id="validation-evidence" title="Les pièces du dossier">
                    <CaseDocumentsCard
                      documents={caseRecord.documents}
                      caseId={caseRecord.id}
                      headingLevel="h3"
                    />
                  </CaseSection>
                </div>

                <div
                  className={cn(
                    'lg:col-span-1',
                    // 96px = header collant (64px) + 32px de respiration.
                    !decision && 'lg:sticky lg:top-24 lg:self-start',
                  )}
                >
                  {decision ? (
                    <DecisionOutcomeCard decision={decision} />
                  ) : (
                    <DecisionPanel controller={controller} />
                  )}
                </div>
              </div>
            </div>
          );
        }}
      </AsyncBoundary>
    </AgentPage>
  );
}
