import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Un étage du dossier : le regroupement qui manquait à l'écran d'instruction.
 *
 * La page empilait ses panneaux à plat, si bien qu'un rapport produit par le
 * pipeline et une adresse déclarée par l'allocataire avaient exactement le même
 * poids visuel. C'est précisément la frontière que le produit affirme —
 * « l'humain décide, la machine instruit » (PRODUCT.md, principe n°2) — et elle
 * n'était visible nulle part.
 *
 * `machine` peint l'étage de la machine avec le marqueur déjà défini par la
 * charte : surface `accent-ai-surface`, filet gauche de 4px en bleu IA. Le
 * marqueur ne tient que par sa rareté (DESIGN.md, « La Règle du Bleu IA ») —
 * il y en a **un seul** sur la page, posé sur le groupe, jamais répété sur les
 * cartes qu'il contient.
 *
 * La bordure et le titre portent la hiérarchie autant que la teinte : sous la
 * préférence « contraste élevé », `--background` passe au blanc et le fond bleu
 * pâle disparaît presque, alors que `--border-subtle` fonce. Le groupe reste
 * lisible en niveaux de gris, comme l'exige la charte.
 */

export interface CaseSectionProps {
  title: string;
  /** Ce que l'étage contient, et d'où il vient. */
  description?: string;
  /** `machine` pour ce qu'un modèle a produit ; `evidence` pour le reste. */
  tone?: 'machine' | 'evidence';
  id: string;
  children: React.ReactNode;
}

export function CaseSection({
  title,
  description,
  tone = 'evidence',
  id,
  children,
}: CaseSectionProps) {
  const isMachine = tone === 'machine';

  return (
    <section
      aria-labelledby={id}
      className={cn(
        isMachine && 'rounded-xl border border-l-4 border-border border-l-ai bg-ai-surface p-4 sm:p-6',
      )}
    >
      <div className={cn('mb-4', description && 'mb-5')}>
        <h2
          id={id}
          className={cn('text-headline-md', isMachine ? 'text-ai' : 'text-on-surface')}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-1 max-w-prose text-body-sm text-on-surface-variant">{description}</p>
        )}
      </div>

      <div className="space-y-gutter">{children}</div>
    </section>
  );
}
