import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AgentPage, AsyncBoundary } from '@/features/agent/components';
import {
  CaseAssessmentCard,
  CaseAuditCard,
  CaseDecisionBanner,
  CaseDocumentsCard,
  CaseFraudCard,
  CaseFraudDetectionCard,
  CaseProfileCard,
  CaseSection,
  CoherenceReportCard,
  CompletenessReportCard,
} from '@/features/agent/cases/components';
import { useAgentCase } from '@/features/agent/hooks';
import { AGENT_ROUTES } from '@/features/agent/paths';

/**
 * A single case under instruction.
 *
 * Reads one `Case` through `useAgentCase` — future `GET /agent/cases/{id}` —
 * and displays it. The page is a pure projection of the object: the score, both
 * report verdicts and the status are all rendered as received. No document is
 * analysed, no right is evaluated and no score is recomputed here; all of that
 * happened in the pipeline before the case existed as a stored record.
 *
 * L'écran est ordonné en trois étages, et l'ordre est le raisonnement de
 * l'agent : le bandeau dit *quel dossier et où en est l'instruction*, l'étage
 * bleu dit *ce que la machine a produit*, l'étage neutre dit *ce que
 * l'allocataire a déposé et ce que le système a tracé*. Empilés à plat, ces
 * panneaux avaient tous le même poids et un rapport d'analyse se lisait comme
 * une adresse postale.
 */
export default function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const resource = useAgentCase(caseId);

  return (
    <AgentPage
      title="Dossier"
      // La référence n'est plus répétée ici : le bandeau la porte, à la taille
      // qu'elle mérite. Deux fois le même numéro en tête d'écran ne hiérarchise
      // rien.
      documentTitle="Dossier — Espace agent"
      actions={
        <Button variant="outline" asChild>
          <Link to={AGENT_ROUTES.cases}>
            <ArrowLeft aria-hidden="true" />
            Retour à la liste
          </Link>
        </Button>
      }
    >
      <AsyncBoundary
        resource={resource}
        // A single case is never "empty" — it either resolves or errors.
        isEmpty={() => false}
        fallback={
          <div className="space-y-gutter">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        }
      >
        {(caseRecord) => (
          <div className="space-y-8">
            <CaseDecisionBanner caseRecord={caseRecord} />

            {/*
              L'étage de la machine, marqué une fois pour toutes par le filet
              bleu IA. Le regroupement fait le travail que six cartes blanches
              ne faisaient pas : il dit d'où vient ce qu'on lit, et que rien
              là-dedans ne décide.
            */}
            <CaseSection
              id="case-machine"
              tone="machine"
              title="Ce que la machine a instruit"
              description="Analyses produites par le pipeline avant votre lecture — complétude, cohérence, authenticité des pièces. Elles préparent la décision, elles ne la prennent pas."
            >
              {/* The unified assessment, read first: it synthesises the four
                  analyses below into one decision-support score. */}
              <CaseAssessmentCard caseId={caseRecord.id} headingLevel="h3" />

              <div className="grid gap-gutter lg:grid-cols-2">
                <CompletenessReportCard
                  report={caseRecord.completenessReport}
                  headingLevel="h3"
                />
                <CoherenceReportCard report={caseRecord.coherenceReport} headingLevel="h3" />
              </div>

              <CaseFraudCard documents={caseRecord.documents} headingLevel="h3" />

              {/* Section statique — ne consomme pas `caseRecord`, voir le
                  composant. À retirer ou brancher quand l'agent C4 est appelé
                  depuis cet écran. */}
              <CaseFraudDetectionCard headingLevel="h3" />
            </CaseSection>

            <CaseSection id="case-evidence" title="Le dossier et sa trace">
              <CaseProfileCard
                citizen={caseRecord.citizen}
                profile={caseRecord.profile}
                headingLevel="h3"
              />

              <CaseDocumentsCard
                documents={caseRecord.documents}
                caseId={caseRecord.id}
                headingLevel="h3"
              />

              <CaseAuditCard
                applicationNumber={caseRecord.applicationNumber}
                headingLevel="h3"
              />
            </CaseSection>
          </div>
        )}
      </AsyncBoundary>
    </AgentPage>
  );
}
