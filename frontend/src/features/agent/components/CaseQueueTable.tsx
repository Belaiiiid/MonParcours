import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import type { CaseSummary } from '@/types';
import { AGENT_ROUTES } from '@/features/agent/paths';
import { citizenFullName } from '@/features/agent/lib/casePresentation';
import { CaseScore } from '@/features/agent/components/CaseScore';
import { CaseStatusBadge } from '@/features/agent/components/CaseStatusBadge';

export interface CaseQueueTableProps {
  cases: CaseSummary[];
  /** Accessible <caption>, describing what this particular queue contains. */
  caption: string;
  /** Adds the "Attente" column. Off on the dashboard, where space is tighter. */
  showWaitingDays?: boolean;
  /**
   * Where a row leads. Defaults to the case file; the validation queue points
   * at the decision screen instead. A prop rather than a second table, because
   * the columns and their semantics are identical — only the destination differs.
   */
  detailPath?: (id: string) => string;
  /** Row action wording. Defaults to « Voir ». */
  actionLabel?: string;
}

/**
 * The instruction queue, rendered from already-processed `CaseSummary` rows.
 *
 * Pure presentation: every cell prints a field that arrived on the model. There
 * is no sorting, no filtering and no derivation here — ordering and
 * `waitingDays` are computed by the backend behind `GET /agent/cases`, so this
 * table only prints what the endpoint already ordered and derived.
 *
 * Shared by the dashboard and the full case list, hence its home in the
 * agent-level `components/` folder rather than a sub-domain.
 */
export function CaseQueueTable({
  cases,
  caption,
  showWaitingDays = false,
  detailPath = AGENT_ROUTES.caseDetail,
  actionLabel = 'Voir',
}: CaseQueueTableProps) {
  return (
    <Table>
      <caption className="sr-only">{caption}</caption>
      <TableHeader>
        <TableRow>
          <TableHead className="text-[color:var(--agent-field-ink)]">Référence</TableHead>
          <TableHead className="text-[color:var(--agent-field-ink)]">Allocataire</TableHead>
          <TableHead className="text-[color:var(--agent-field-ink)]">Déposé le</TableHead>
          {showWaitingDays && <TableHead className="text-[color:var(--agent-field-ink)]">Attente</TableHead>}
          <TableHead className="text-[color:var(--agent-field-ink)]">Score</TableHead>
          <TableHead className="text-[color:var(--agent-field-ink)]">Statut</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cases.map((item) => (
          <TableRow key={item.id}>
            {/* Une seule encre pour les quatre colonnes de donnees : elles se
                lisent ligne par ligne, pas colonne par colonne. Voir
                `--agent-field-ink`. */}
            <TableCell className="text-label-md text-[color:var(--agent-field-ink)]">
              {item.applicationNumber}
            </TableCell>
            <TableCell className="text-[color:var(--agent-field-ink)]">
              {citizenFullName(item.citizen)}
            </TableCell>
            <TableCell className="text-[color:var(--agent-field-ink)]">
              {formatDate(item.submittedAt)}
            </TableCell>
            {showWaitingDays && (
              <TableCell className="text-[color:var(--agent-field-ink)]">
                {item.waitingDays} jours
              </TableCell>
            )}
            <TableCell>
              <CaseScore score={item.score} />
            </TableCell>
            <TableCell>
              <CaseStatusBadge status={item.status} />
            </TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm" asChild>
                <Link to={detailPath(item.id)}>
                  {actionLabel}
                  <span className="sr-only"> le dossier {item.applicationNumber}</span>
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
