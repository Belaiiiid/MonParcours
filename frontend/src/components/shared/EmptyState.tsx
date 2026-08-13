import type { LucideIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /**
   * `plain` — neutral placeholder (notification centre).
   * `suggestive` — dashed container inviting an action (dashboard).
   * `accent` — pastille bleu pâle, pictogramme au bleu d'action : un vide qui
   *   est une bonne nouvelle (file d'instruction à jour) plutôt qu'un manque.
   *   Le cercle gris bordé de `plain` annonce l'inverse.
   */
  variant?: 'plain' | 'suggestive' | 'accent';
  /**
   * `institutional` — titre, texte et pictogramme dans l'encre bleue des files
   * d'instruction (`--agent-field-ink`), plutot que le quasi-noir et le gris du
   * ton par defaut. Le vide y est un etat du travail, pas un incident : il se
   * dit dans la couleur de ce que le tableau aurait affiche.
   */
  tone?: 'default' | 'institutional';
  /**
   * `default` — page- or section-level placeholder.
   * `compact` — fits inside an existing card body without breaking its rhythm.
   */
  size?: 'default' | 'compact';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  variant = 'plain',
  tone = 'default',
  size = 'default',
  className,
}: EmptyStateProps) {
  const isCompact = size === 'compact';
  const institutional = tone === 'institutional';
  const ink = institutional ? 'text-[color:var(--agent-field-ink)]' : undefined;

  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        isCompact ? 'px-4 py-6' : 'px-6 py-12',
        variant === 'suggestive' && 'rounded-xl border border-dashed border-border bg-surface-low',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full',
          isCompact ? 'mb-3 size-11' : 'mb-5 size-16',
          variant === 'suggestive' && 'bg-surface-lowest text-primary shadow-soft',
          variant === 'accent' && 'bg-ai-container text-ai',
          variant === 'plain' && 'border border-border text-on-surface-variant',
          // Pose apres les variantes : c'est le ton qui tranche sur la couleur
          // du pictogramme, la variante ne decide plus que du fond.
          ink,
        )}
      >
        <Icon className={isCompact ? 'size-5' : 'size-7'} aria-hidden="true" />
      </div>
      <h3
        className={cn(
          isCompact ? 'text-label-md text-on-surface' : 'text-headline-md text-on-surface',
          ink,
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'mt-2 max-w-md text-on-surface-variant',
            isCompact ? 'text-body-sm' : 'text-body-md',
            ink,
          )}
        >
          {description}
        </p>
      )}
      {actions && (
        <div className={cn('flex flex-wrap justify-center gap-4', isCompact ? 'mt-4' : 'mt-6')}>
          {actions}
        </div>
      )}
    </div>
  );
}
