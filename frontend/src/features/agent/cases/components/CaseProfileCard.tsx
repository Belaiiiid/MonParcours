import { DataRow, SectionHeader } from '@/components/shared';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatDate, formatEuros } from '@/lib/utils';
import type { CaseCitizen, CaseProfileSnapshot } from '@/types';
import {
  HOUSEHOLD_STATUS_LABEL,
  OCCUPANCY_STATUS_LABEL,
  citizenFullName,
} from '@/features/agent/lib/casePresentation';

export interface CaseProfileCardProps {
  citizen: CaseCitizen;
  profile: CaseProfileSnapshot;
  /**
   * Drops to `h3` when the card sits inside a titled group, so the outline
   * stays nested rather than flattening two levels onto `h2`. The three inner
   * sub-headings follow one level below.
   */
  headingLevel?: 'h2' | 'h3';
}

/**
 * Applicant identity and declared situation, as frozen at submission.
 *
 * Renders the snapshot on the case, not the citizen's live profile — an agent
 * must instruct against what was declared at the time, and a later profile edit
 * must not retroactively change what they are reviewing.
 *
 * The NIR arrives already masked from the backend; the frontend never holds the
 * full number, so there is nothing to redact here.
 */
export function CaseProfileCard({
  citizen,
  profile,
  headingLevel = 'h2',
}: CaseProfileCardProps) {
  const { household, housing } = profile;
  const SubHeading = headingLevel === 'h3' ? 'h4' : 'h3';

  return (
    <Card>
      <CardHeader>
        <SectionHeader title="Allocataire et situation déclarée" as={headingLevel} />
      </CardHeader>
      <CardContent className="grid gap-gutter md:grid-cols-2">
        <div>
          <SubHeading className="section-title mb-2">Identité</SubHeading>
          <DataRow label="Nom" value={citizenFullName(citizen)} />
          <DataRow label="Date de naissance" value={formatDate(citizen.birthDate)} />
          <DataRow label="Numéro de sécurité sociale" value={citizen.maskedSocialSecurityNumber} />
          <DataRow label="Courriel" value={citizen.email} />
        </div>

        <div>
          <SubHeading className="section-title mb-2">Foyer</SubHeading>
          <DataRow
            label="Situation familiale"
            value={HOUSEHOLD_STATUS_LABEL[household.maritalStatus]}
          />
          <DataRow label="Enfants à charge" value={household.dependentChildren} />
          <DataRow label="Adultes rattachés" value={household.attachedAdults} />
          <DataRow label="Revenu annuel déclaré" value={formatEuros(profile.annualIncome)} />
        </div>

        <div className="md:col-span-2">
          <SubHeading className="section-title mb-2">Logement</SubHeading>
          <div className="grid gap-x-gutter md:grid-cols-2">
            <DataRow
              label="Statut d’occupation"
              value={OCCUPANCY_STATUS_LABEL[housing.occupancyStatus]}
            />
            <DataRow label="Surface habitable" value={`${housing.livingAreaSqm} m²`} />
            <DataRow
              label="Loyer hors charges"
              value={formatEuros(housing.monthlyRentExcludingCharges)}
            />
            <DataRow
              label="Adresse"
              value={`${housing.address}, ${housing.postalCode} ${housing.city}`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
