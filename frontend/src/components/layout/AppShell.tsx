import { Outlet, useLocation } from 'react-router-dom';

import { Header } from '@/components/layout/Header';
import { SkipLink } from '@/components/layout/SkipLink';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AgentAssistantBubble } from '@/features/agent/components';
import { AGENT_ROUTES, isAgentPath } from '@/features/agent/paths';
import { FloatingActionBubbles } from '@/features/chatbot/components/FloatingActionBubbles';
import { FloatingChatbot } from '@/features/chatbot/components/FloatingChatbot';
import { VoicePageProvider } from '@/features/voice/context/VoicePageContext';
import { VoiceAssistantProvider } from '@/features/voice/components/VoiceAssistantProvider';
import { VoiceAssistantPanel } from '@/features/voice/components/VoiceAssistantPanel';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/store/sessionStore';
import { useUiStore } from '@/store/uiStore';

/**
 * The authenticated application shell.
 *
 * Desktop  (≥1024px): fixed 256px rail + offset content column.
 * Tablet / mobile:    rail becomes a focus-trapped drawer (Radix Dialog).
 *
 * `hideSidebar` drops the desktop rail — for the services hub, reached before
 * a citizen has picked a service, where a sidebar would have nothing of its
 * own to navigate (it would just show whichever service's rail happened to be
 * last). The mobile drawer stays available either way: on a small screen the
 * rail is never persistent regardless, so there is nothing to hide there.
 *
 * `hideHeader` drops the top bar (notifications, account menu) — for the
 * administrations list and the CAF services hub, reached before any account
 * is required: there is no session-specific state to show there yet, and the
 * page is reachable by a visitor with no account at all.
 */
export function AppShell({
  hideSidebar = false,
  hideHeader = false,
}: { hideSidebar?: boolean; hideHeader?: boolean } = {}) {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const closeSidebar = useUiStore((state) => state.closeSidebar);
  // The assistant is a citizen feature only — the agent portal shares this shell
  // but has its own Assistant IA page, so the launcher is never mounted there.
  const role = useSessionStore((state) => state.role);

  /*
   * `useLocation`, et non le `window.location` global.
   *
   * Le fichier lisait `location.pathname` sans jamais importer le hook :
   * TypeScript acceptait la globale du navigateur, dont `pathname` est bien
   * une chaine, et rien ne signalait l'erreur. Mais cette valeur ne participe
   * pas au rendu de React Router — la coque ne se recalculait donc pas quand
   * la route changeait, et tout ce qui en depend restait fige sur l'etat du
   * chargement initial.
   */
  const location = useLocation();
  const isAgent = isAgentPath(location.pathname);

  /*
   * Les trois ecrans de travail ou une question peut surgir sans qu'on veuille
   * quitter ce qu'on regarde : la charge du jour, la file, la validation. La
   * page « Assistant IA » en est exclue — la bulle y ouvrirait un second
   * exemplaire de la fenetre deja au centre de l'ecran. Les ecrans de
   * reglages et de profil aussi : on n'y instruit rien.
   */
  const showAssistantBubble =
    isAgent &&
    // `root` en egalite stricte : c'est le prefixe de tout le portail, et un
    // `startsWith` y aurait ramene la bulle sur « Assistant IA » — un lanceur
    // pour ouvrir un second exemplaire de la fenetre deja au centre de l'ecran.
    (location.pathname === AGENT_ROUTES.root ||
      [AGENT_ROUTES.cases, AGENT_ROUTES.validation].some(
        (base) => location.pathname === base || location.pathname.startsWith(`${base}/`),
      ));

  return (
    <VoicePageProvider>
      <VoiceAssistantProvider>
        {/*
          No scope class: the agent back-office and France Travail both wear
          the institutional theme — navy, Inter / Manrope, the standard radius
          scale. See docs/design-system.md §1, which names this shell as the
          institutional side of the platform.
        */}
        {/* Squared corners for the back-office only; France Travail shares
            this shell and keeps the charter's rounded scale. */}
        <div
          className={cn(
            'bg-background',
            // Le back-office tient dans l'ecran : c'est un plan de travail, pas
            // un document. Le document cesse donc de defiler, et chaque page
            // gere son propre debordement — meme parti que `CitizenAppShell`
            // sur les routes de conversation.
            isAgent ? 'agent-scope h-[100dvh] overflow-hidden' : 'min-h-screen',
          )}
        >
          <SkipLink />

      {/* Desktop rail */}
      {!hideSidebar && (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-sidebar lg:block">
          <Sidebar />
        </aside>
      )}

      {/* Mobile drawer */}
      <Dialog open={isSidebarOpen} onOpenChange={(open) => !open && closeSidebar()}>
        <DialogContent
          className="left-0 top-0 h-full w-[280px] max-w-[85vw] translate-x-0 translate-y-0 rounded-none border-0 p-0 lg:hidden"
          aria-label="Menu de navigation"
        >
          <Sidebar inDrawer />
        </DialogContent>
      </Dialog>

      <div
        className={cn(
          'flex flex-col',
          isAgent ? 'h-full min-h-0' : 'min-h-screen',
          !hideSidebar && 'lg:pl-sidebar',
        )}
      >
        {!hideHeader && <Header />}
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'flex-1 px-margin-mobile py-8 focus:outline-none md:px-gutter',
            // Rien ne defile a ce niveau : c'est `AgentPage` qui decide, ecran
            // par ecran, si son contenu tient tel quel (`fill`) ou s'il se
            // donne son propre ascenseur.
            isAgent && 'min-h-0 overflow-hidden',
          )}
        >
          <Outlet />
        </main>
        {/* Pas de pied de page institutionnel ici : cette coque ne sert plus
            que le back-office (cf. `app/router`, unique point de montage), et
            un poste d'instruction est un plan de travail — la rangée de liens
            partenaires et la barre légale n'y sont que du décor. Même règle que
            côté citoyen connecté, où `CitizenFooter` se retire de lui-même.

            Le composant `Footer` reste : `FocusLayout` s'en sert encore. */}
      </div>

      {role === 'citizen' && (
        <>
          <FloatingChatbot />
          <FloatingActionBubbles />
        </>
      )}
      {/* Le back-office a son propre lanceur : `FloatingActionBubbles`, qui
          porte celui du citoyen, propose aussi WhatsApp et l'assistant vocal —
          sans objet depuis un poste d'instruction. `FloatingChatbot` ne rend
          que le panneau, il lui faut donc un bouton pour l'ouvrir. */}
      {showAssistantBubble && (
        <>
          <FloatingChatbot />
          <AgentAssistantBubble />
        </>
      )}
      {/* Standalone voice UI (citizen only) */}
      {role === 'citizen' && (
        <VoiceAssistantPanel />
      )}
    </div>
      </VoiceAssistantProvider>
    </VoicePageProvider>
  );
}
