import { Bell, HelpCircle, Menu, User } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { ROUTES } from '@/app/router/paths';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { AGENT_ROUTES } from '@/features/agent';
import { isAgentPath } from '@/features/agent/paths';
import { useChatbotUiStore } from '@/features/chatbot/store/chatbotUiStore';
import { getInitials } from '@/lib/utils';
import { useNotificationStore } from '@/store/notificationStore';
import { useSessionStore } from '@/store/sessionStore';
import { useUiStore } from '@/store/uiStore';

/** Sticky 64px application header. */
export function Header() {
  const openSidebar = useUiStore((state) => state.openSidebar);
  const displayName = useSessionStore((state) => state.displayName);
  const role = useSessionStore((state) => state.role);
  const logout = useSessionStore((state) => state.logout);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const refreshCount = useNotificationStore((state) => state.refreshCount);
  const openAssistant = useChatbotUiStore((state) => state.open);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Keep the badge honest across a reload: fetch the count once the shell mounts.
  useEffect(() => {
    void refreshCount();
  }, [refreshCount]);

  const handleLogout = () => {
    logout();
    // Not `ROUTES.login`: a citizen who signs out lands back among the public,
    // exactly like anyone else who has not signed in — the assistant first,
    // "Se connecter" second (see `HomeRoute`), never dropped straight on a form.
    navigate(ROUTES.home, { replace: true });
  };

  // Role-aware: an agent has no citizen profiling profile, so "Mon profil" must
  // land them on the back-office account page, never on the profiling form.
  // Accessibility preferences are a citizen-profile concern — not shown here for
  // agents, keeping their account view minimal (name / e-mail / role).
  const isAgent = role === 'agent';
  /* Le rôle affiché sous le nom. Rien pour le citoyen : sur son espace, « vous »
     est le seul rôle qui existe, l'écrire serait du remplissage. */
  const roleLabel = role === 'agent' ? 'Agent CAF' : role === 'admin' ? 'Administration' : null;
  const profileTo = isAgent ? AGENT_ROUTES.profile : ROUTES.profile;
  const notificationsTo = isAgent ? AGENT_ROUTES.notifications : ROUTES.portalNotifications;
  const settingsTo = isAgent ? AGENT_ROUTES.settings : ROUTES.settings;

  // Help opens the assistant: the citizen's floating panel, or the agent's own
  // Assistant IA page. Never a dead button.
  const handleHelp = () => {
    if (isAgent) {
      navigate(AGENT_ROUTES.assistant);
    } else {
      openAssistant();
    }
  };

  return (
    // Alignee sur `CitizenHeader` : pas de filet bas — sur le fond clair des
    // pages il se lit comme une ligne parasite au defilement — c'est l'ombre
    // douce et le flou d'arriere-plan qui detachent la barre.
    <header className="sticky top-0 z-30 flex h-header items-center gap-4 bg-background/90 px-margin-mobile shadow-soft backdrop-blur md:px-gutter">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={openSidebar}
        aria-label="Ouvrir le menu de navigation"
      >
        <Menu aria-hidden="true" />
      </Button>

      {/* Real logos, not decoration: Mistral (mistral.ai) and Talan
          (talan.com), matching the marks used on the France Travail page.

          Hidden in the back-office: there the two marks belong to the rail and
          the rail only, so they are stated once per screen instead of twice.
          France Travail shares this header and keeps them. */}
      {!isAgentPath(pathname) && (
        <div className="hidden items-center gap-4 sm:flex">
          <span className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
            <img src="/mistral-logo.svg" alt="" aria-hidden="true" className="h-3.5 w-auto" />
            Propulsé par Mistral
          </span>
          <span aria-hidden="true" className="h-4 w-px bg-border" />
          <span className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
            Partenaire
            <img src="/talan-logo.svg" alt="Talan" className="h-3.5 w-auto" />
          </span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} non lues`
              : 'Notifications'
          }
        >
          <Link to={notificationsTo}>
            <Bell aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute right-2.5 top-2.5 size-2 rounded-full border-2 border-surface bg-destructive"
              />
            )}
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Aide"
          onClick={handleHelp}
        >
          <HelpCircle aria-hidden="true" />
        </Button>

        <span aria-hidden="true" className="mx-2 hidden h-8 w-px bg-border/60 sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 rounded-full p-1 transition-colors hover:bg-brand-soft"
              aria-label={displayName ? `Mon espace — ${displayName}` : 'Mon espace'}
            >
              <span className="hidden text-right sm:block">
                {displayName ? (
                  <>
                    <span className="block text-label-md leading-none text-ink">
                      {displayName}
                    </span>
                    {/* Qui l'on est, pas seulement comment on s'appelle : deux
                        agents partagent la file, et l'écran ne dit nulle part
                        ailleurs sous quel rôle la session est ouverte. */}
                    {roleLabel && (
                      <span className="mt-1 block text-label-sm leading-none text-muted-foreground">
                        {roleLabel}
                      </span>
                    )}
                  </>
                ) : (
                  <Skeleton className="mb-1 h-3 w-24" />
                )}
              </span>
              {/* Pastille bleu pale bordee, accordee a la vue d'ensemble du
                  tableau de bord — meme famille de bleus que le panneau. */}
              <Avatar className="border border-[color:var(--agent-overview-border)]">
                <AvatarFallback className="bg-[color:var(--agent-overview-border)] font-semibold text-[color:var(--agent-overview-icon)]">
                  {displayName ? (
                    getInitials(displayName)
                  ) : (
                    <User className="size-4" aria-hidden="true" />
                  )}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-border/60 bg-card p-1.5 shadow-soft">
            <DropdownMenuLabel className="text-muted-foreground">Mon espace</DropdownMenuLabel>
            <DropdownMenuItem asChild className="focus:bg-brand-soft focus:text-brand">
              <Link to={profileTo}>Mon profil</Link>
            </DropdownMenuItem>
            {!isAgent && (
              <DropdownMenuItem asChild className="focus:bg-brand-soft focus:text-brand">
                <Link to={ROUTES.profileAccessibility}>Accessibilité</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild className="focus:bg-brand-soft focus:text-brand">
              <Link to={settingsTo}>Paramètres</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/60" />
            <DropdownMenuItem destructive onSelect={handleLogout}>
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
