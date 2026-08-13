import { X } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import {
  isNavItemActive,
  resolveNavSections,
  SIGN_OUT_ITEM,
  type NavItem,
} from '@/app/config/navigation';
import { ROUTES } from '@/app/router/paths';
import logo from '@/assets/administral-logo.png';
import { Button } from '@/components/ui/button';
import { AGENT_ROUTES, isAgentPath } from '@/features/agent/paths';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/uiStore';
import { useSessionStore } from '@/store/sessionStore';

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  // NavLink's own isActive is prefix-based; our rail needs the custom rules
  // declared alongside each item (see app/config/navigation.ts).
  const isActive = isNavItemActive(item, pathname);

  return (
    <li>
      <NavLink
        to={item.to}
        onClick={onNavigate}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-label-md transition-colors',
          // Sur le panneau navy, l'état actif se dit par un voile blanc et non
          // par une teinte : `brand-soft` est un bleu très clair prévu pour un
          // fond blanc, il ferait ici une pastille lumineuse hors gamme.
          // Libellés en blanc plein, actif comme inactif : c'est le voile et la
          // graisse qui marquent l'entrée courante, pas un blanc affaibli.
          isActive ? 'bg-white/15 font-semibold text-white' : 'text-white hover:bg-white/10',
        )}
      >
        <item.icon className="size-5 shrink-0" aria-hidden="true" />
        <span>{item.label}</span>
      </NavLink>
    </li>
  );
}

/**
 * Fixed 256px rail on desktop; slide-over drawer below `lg`.
 * The drawer variant is rendered by <AppShell /> inside a focus-trapping overlay.
 */
export function Sidebar({ inDrawer = false }: { inDrawer?: boolean }) {
  const closeSidebar = useUiStore((state) => state.closeSidebar);
  const onNavigate = inDrawer ? closeSidebar : undefined;
  const { pathname } = useLocation();
  const userRole = useSessionStore((state) => state.user?.role);
  // Citizen rail or back-office rail, decided by the route (app/config/navigation.ts).
  const { primary, secondary, cta } = resolveNavSections(pathname);

  return (
    <div className="flex h-full flex-col border-r border-white/10 bg-action px-4 py-6 text-white">
      <div className="mb-6 flex items-start justify-between gap-2">
        {/* Même bloc de marque que le rail citoyen, jusqu'au lien : un logo de
            portail qui ne ramène pas à l'accueil se cherche longtemps. Seule
            la deuxième ligne change — c'est elle qui nomme l'espace. */}
        <Link
          // Depuis le back-office, la marque ramene a la supervision et non a
          // l'accueil public : un agent n'a acces qu'a son espace, le lien y
          // menait donc a une page dont il serait aussitot renvoye.
          to={isAgentPath(pathname) ? AGENT_ROUTES.root : ROUTES.home}
          onClick={onNavigate}
          className="ml-2 flex items-center gap-3 rounded-lg px-2 py-1 transition-colors duration-200 ease-standard hover:bg-white/10"
        >
          <img src={logo} alt="" aria-hidden="true" className="size-11 shrink-0 object-contain" />
          <span className="leading-tight">
            <span className="block font-display text-lg font-extrabold tracking-tight text-white">
              ADMINISTRAL
            </span>
            <span className="mt-0.5 block text-sm leading-tight text-white/70">
              {isAgentPath(pathname) ? 'Espace Agent CAF' : 'Service Public'}
            </span>
          </span>
        </Link>
        {inDrawer && (
          <Button variant="ghost" size="icon" onClick={closeSidebar} aria-label="Fermer le menu">
            <X aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* `mt-6` : les entrees collaient au bloc de marque, qui se lit alors
          comme le premier element de la liste. */}
      <nav aria-label="Navigation principale" className="mt-12 flex-1">
        <ul className="flex flex-col gap-1">
          {primary
            .filter((item) => !item.adminOnly || userRole === 'ADMIN')
            .map((item) => (
              <SidebarLink key={item.id} item={item} onNavigate={onNavigate} />
            ))}
        </ul>
      </nav>

      {cta && (
        <NavLink
          to={cta.to}
          onClick={onNavigate}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-3 text-label-md font-semibold text-action transition-opacity hover:opacity-90"
        >
          <cta.icon className="size-4" aria-hidden="true" />
          {cta.label}
        </NavLink>
      )}

      {/* `mb-8` : le bloc collait au bas du rail, ou il se lisait comme une
          barre de statut plutot que comme la fin du menu. */}
      <div className="mb-8 mt-4 border-t border-white/15 pt-3">
        <ul className="flex flex-col gap-1">
          {secondary
            .filter((item) => !item.adminOnly || userRole === 'ADMIN')
            .map((item) => (
              <SidebarLink key={item.id} item={item} onNavigate={onNavigate} />
            ))}
          <li>
            <NavLink
              to={SIGN_OUT_ITEM.to}
              onClick={onNavigate}
              className="mt-1 flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-label-md font-semibold text-signout transition-colors hover:bg-white/10"
            >
              <SIGN_OUT_ITEM.icon className="size-5 shrink-0" aria-hidden="true" />
              {SIGN_OUT_ITEM.label}
            </NavLink>
          </li>
        </ul>
      </div>

    </div>
  );
}
