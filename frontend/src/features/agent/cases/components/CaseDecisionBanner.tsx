import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { Case } from '@/types';
import { AgentBanner } from '@/features/agent/components/AgentBanner';
import { CaseStatusBadge } from '@/features/agent/components/CaseStatusBadge';
import {
  REPORT_OUTCOME_LABEL,
  SCORE_BAND_LABEL,
  SCORE_BAND_TONE,
  citizenFullName,
} from '@/features/agent/lib/casePresentation';

/**
 * L'en-tête du dossier : qui, quoi, et où en est l'instruction.
 *
 * Surface inversée navy — le seul élément de la page peint dans la voix de
 * l'institution (DESIGN.md, « Navy Profond : surfaces inversées »). Elle existe
 * parce que la page empilait neuf cartes identiques : rien n'y disait par où
 * commencer ni si le dossier était mûr pour une décision.
 *
 * Projection pure de l'objet `Case` déjà chargé par la page — aucun appel
 * supplémentaire, aucune dérivation. Chaque étape non encore franchie rend un
 * tiret annoncé, jamais une valeur plausible.
 */

/** Un tiret neutre pour une étape que le pipeline n'a pas encore franchie. */
function NotRun({ label }: { label: string }) {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">{label}</span>
    </>
  );
}

function Checkpoint({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-label-sm uppercase tracking-wider text-primary-fixed-dim">{label}</dt>
      <dd className="mt-1.5 flex flex-wrap items-center gap-2 text-body-md text-primary-foreground">
        {children}
      </dd>
    </div>
  );
}

export interface CaseDecisionBannerProps {
  caseRecord: Case;
  /** Ancre du `aria-labelledby` de la section. */
  id?: string;
}

export function CaseDecisionBanner({
  caseRecord,
  id = 'case-synthese',
}: CaseDecisionBannerProps) {
  const { score, completenessReport: completeness, coherenceReport: coherence } = caseRecord;

  return (
    <AgentBanner aria-labelledby={id}>
      <div className="flex flex-wrap items-start justify-between gap-x-gutter gap-y-6">
        <div className="min-w-0">
          <h2 id={id} className="text-headline-lg text-primary-foreground">
            {caseRecord.applicationNumber}
          </h2>
          <p className="mt-1 text-body-md text-primary-fixed-dim">
            {citizenFullName(caseRecord.citizen)} · {caseRecord.service.label} · déposé le{' '}
            {formatDate(caseRecord.submittedAt)}
          </p>
        </div>

        {/*
         * Le score et sa provenance sont inséparables : « la preuve avant
         * l'affirmation » (PRODUCT.md) interdit d'afficher le nombre sans dire
         * quel modèle l'a produit ni quand.
         */}
        <div className="sm:text-right">
          <p className="text-label-sm uppercase tracking-wider text-primary-fixed-dim">
            Score d’éligibilité
          </p>
          {score ? (
            <>
              <p className="mt-1 flex flex-wrap items-baseline gap-3 sm:justify-end">
                <span className="text-display tabular-nums text-primary-foreground">
                  {score.value}
                  <span className="text-headline-md text-primary-fixed-dim">/100</span>
                </span>
                <Badge tone={SCORE_BAND_TONE[score.band]}>{SCORE_BAND_LABEL[score.band]}</Badge>
              </p>
              <p className="mt-1 text-body-sm text-primary-fixed-dim">
                Calculé le {formatDate(score.computedAt)} · modèle {score.model}
              </p>
            </>
          ) : (
            <p className="mt-1 text-body-md text-primary-fixed-dim">
              <NotRun label="Score non calculé" />
            </p>
          )}
        </div>
      </div>

      {/*
       * L'état d'avancement de l'instruction, en une ligne : c'est la question
       * qu'un agent se pose en ouvrant le dossier — puis-je décider ?
       */}
      <dl className="mt-6 grid grid-cols-2 gap-x-gutter gap-y-4 border-t border-t-[color:var(--agent-subtle-on-primary)] pt-6 sm:grid-cols-4">
        <Checkpoint label="Statut">
          <CaseStatusBadge status={caseRecord.status} />
        </Checkpoint>

        <Checkpoint label="Pièces">
          {caseRecord.documents.length}
          <span className="sr-only">
            {caseRecord.documents.length > 1 ? ' pièces déposées' : ' pièce déposée'}
          </span>
        </Checkpoint>

        <Checkpoint label="Complétude">
          {completeness ? (
            <>
              <span className="tabular-nums">{completeness.completionRate} %</span>
              <span className="text-primary-fixed-dim">
                {REPORT_OUTCOME_LABEL[completeness.outcome]}
              </span>
            </>
          ) : (
            <NotRun label="Contrôle de complétude non effectué" />
          )}
        </Checkpoint>

        <Checkpoint label="Cohérence">
          {coherence ? (
            <>
              {typeof coherence.coherenceScore === 'number' && (
                <span className="tabular-nums">{coherence.coherenceScore} / 100</span>
              )}
              <span className="text-primary-fixed-dim">
                {REPORT_OUTCOME_LABEL[coherence.outcome]}
              </span>
            </>
          ) : (
            <NotRun label="Contrôle de cohérence non effectué" />
          )}
        </Checkpoint>
      </dl>
    </AgentBanner>
  );
}
