import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * La surface inversée du poste d'instruction : « voici où ça en est ».
 *
 * Un seul objet de ce type par écran, toujours en tête — la charge du jour sur
 * la supervision, l'état du dossier sur l'instruction et sur la décision. Le
 * navy est la voix de l'institution et la charte le réserve aux surfaces
 * inversées (DESIGN.md, « Navy Profond ») ; en multiplier les occurrences sur
 * une même page lui retirerait le sens qu'il porte ici.
 *
 * Extrait parce que trois écrans le posaient : la spécification de la surface
 * (fond, encre, gouttières, angle) vit à un seul endroit, sinon les trois
 * dérivent au premier ajustement.
 */
export type AgentBannerProps = React.HTMLAttributes<HTMLElement>;

export function AgentBanner({ className, ...props }: AgentBannerProps) {
  return (
    <section
      className={cn(
        'rounded-xl bg-primary px-6 py-6 text-primary-foreground sm:px-8',
        className,
      )}
      {...props}
    />
  );
}
