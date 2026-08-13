import * as React from 'react';

import { CitizenPageHeader } from '@/components/citizen/CitizenPageHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';

export interface AgentPageProps {
  title: string;
  description?: string;
  /** Appended to the title in the browser tab. Defaults to `title`. */
  documentTitle?: string;
  actions?: React.ReactNode;
  /**
   * L'ecran tient dans la hauteur disponible et ne defile pas : le contenu
   * recoit la place restante, a lui de gerer son propre debordement.
   *
   * Opt-in. La coque du back-office ne laisse rien defiler au niveau du
   * document (voir `AppShell`) ; sans ce drapeau, une page se donne un
   * ascenseur interne plutot que d'etre rognee.
   */
  fill?: boolean;
  children: React.ReactNode;
}

/**
 * Layout composition for every Agent Portal page.
 *
 * Deliberately thin: it is not a second application shell. <AppShell /> still
 * provides the rail, header and footer — this only applies the page container
 * and the <h1> block, so the two never drift between agent screens.
 */
export function AgentPage({
  title,
  description,
  documentTitle,
  actions,
  fill = false,
  children,
}: AgentPageProps) {
  useDocumentTitle(documentTitle ?? title);

  return (
    <div
      className={cn(
        'mx-auto max-w-container',
        // `min-h-0` : sans lui, un enfant en `flex-1` refuse de retrecir sous
        // la hauteur de son contenu et deborde au lieu de defiler.
        fill ? 'flex h-full min-h-0 flex-col' : 'h-full overflow-y-auto',
      )}
    >
      {/* `CitizenPageHeader` plutot que `PageHeader` : le back-office reprend
          le gabarit de titre du portail citoyen — surtitre, titre en bleu
          d'action, description en gris. Le composant ne depend d'aucun jeton
          confine a `.citizen-scope`, il se rend donc a l'identique ici. */}
      <CitizenPageHeader
        title={title}
        description={description}
        actions={actions}
        // Meme recette que « Coach CV » : police sans, taille display, #102a74.
        titleClassName="font-sans text-[#102a74] sm:text-display"
      />
      {children}
    </div>
  );
}
