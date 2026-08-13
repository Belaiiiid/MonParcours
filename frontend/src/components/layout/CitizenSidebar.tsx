import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import {
  isNavItemActive,
  resolveAdministration,
  resolveNavSections,
  SIGN_OUT_ITEM,
  type NavItem,
} from '@/app/config/navigation';
import { ROUTES } from '@/app/router/paths';
import logo from '@/assets/administral-logo.png';
import { PartnerLogo } from '@/components/layout/PartnerLogo';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/store/sessionStore';

function CitizenSidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const isActive = isNavItemActive(item, pathname);

  return (
    <li>
      <NavLink
        to={item.to}
        onClick={onNavigate}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-label-md transition-colors',
          isActive
            ? 'bg-brand-soft text-brand'
            : 'text-foreground/70 hover:bg-brand-soft/60 hover:text-brand',
        )}
      >
        <item.icon className="size-5 shrink-0" aria-hidden="true" />
        <span>{item.label}</span>
      </NavLink>
    </li>
  );
}

/**
 * Administral-styled navigation rail — citizen area only.
 *
 * Structural twin of `components/layout/Sidebar`, restyled with the
 * Administral tokens. Kept separate so the agent back-office rail (which
 * reuses `Sidebar`) is never affected by this redesign.
 */
export function CitizenSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const { primary, secondary, cta } = resolveNavSections(pathname);
  const administration = resolveAdministration(pathname);
  const navigate = useNavigate();
  const logout = useSessionStore((state) => state.logout);

  /* Ferme la session puis ramène à l'accueil public. `replace` : l'espace
     citoyen quitté ne doit pas rester dans l'historique du navigateur. */
  const handleSignOut = () => {
    onNavigate?.();
    logout();
    navigate(ROUTES.home, { replace: true });
  };

  return (
    <div className="flex h-full flex-col border-r border-border/60 bg-surface px-4 py-6">
      {/* Cliquable : sur desktop la sidebar est le seul endroit où la marque
          apparaît (le logo du header est masqué en `lg:`), et un logo de
          portail qui ne ramène pas à l'accueil se cherche longtemps. */}
      <Link
        to={ROUTES.home}
        onClick={onNavigate}
        className="mb-6 ml-2 flex items-center gap-3 rounded-lg px-2 py-1 transition-colors duration-200 ease-standard hover:bg-brand-soft"
      >
        <img src={logo} alt="" aria-hidden="true" className="size-11 shrink-0 object-contain" />
        <span className="leading-tight">
          <span className="block font-display text-lg font-extrabold tracking-tight text-ink">
            ADMINISTRAL
          </span>
          {/* Le rail nomme l'espace, pas la marque : « République 5.0 » est la
              signature des en-têtes, où la même barre coiffe l'accueil public
              et l'espace connecté. Ici il n'y a qu'un espace possible, et le
              rail sert à s'y repérer. */}
          <span className="mt-0.5 block text-sm leading-tight text-muted-foreground">
            Espace Citoyen
          </span>
        </span>
      </Link>

      {/* Indicateur d'administration : la marque au-dessus est celle du portail,
          identique partout. Sans ce repère, rien dans le rail ne dit chez quelle
          administration on se trouve — deux d'entre elles proposent des entrées
          de même forme (« Envoyer un dossier », « Rechercher »). Absent hors de
          tout espace : la liste des administrations n'en désigne aucune. */}
      {administration && (
        <div className="mb-9 ml-2 flex items-center gap-2.5 px-2">
          <img
            src={administration.logoUrl}
            alt=""
            aria-hidden="true"
            /* La marque CAF est un carré plein : à taille égale elle pèse
               visuellement bien plus que le logo France Travail, qui est un
               lettrage large et aéré. Elle est donc rendue un cran plus petit
               pour que les deux repères aient le même poids optique. */
            className={cn(
              'shrink-0 object-contain',
              administration.id === 'caf' ? 'size-8' : 'size-10',
            )}
          />
          {/* Bleu de marque, pas `text-ink` : le repère doit se lire comme une
              information distincte du bloc marque juste au-dessus. */}
          <span className="truncate text-label-md font-semibold text-brand">
            {administration.name}
          </span>
        </div>
      )}

      <nav aria-label="Navigation principale" className="flex-1">
        <ul className="flex flex-col gap-1">
          {primary.map((item) => (
            <CitizenSidebarLink key={item.id} item={item} onNavigate={onNavigate} />
          ))}
        </ul>
      </nav>

      {cta && (
        <NavLink
          to={cta.to}
          onClick={onNavigate}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-marianne px-4 py-3 text-label-md text-marianne-foreground transition-opacity hover:opacity-90"
        >
          <cta.icon className="size-4" aria-hidden="true" />
          {cta.label}
        </NavLink>
      )}

      <div className="mt-4 border-t border-border/60 pt-3">
        <ul className="flex flex-col gap-1">
          {secondary.map((item) => (
            <CitizenSidebarLink key={item.id} item={item} onNavigate={onNavigate} />
          ))}
          <li>
            {/* Un bouton, pas un lien : se déconnecter est une action sur la
                session, pas une destination. L'entrée pointait sur `/login`
                sans jamais fermer la session — la personne y arrivait encore
                connectée, et revenir en arrière la ramenait dans son espace. */}
            <button
              type="button"
              onClick={handleSignOut}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-label-md text-destructive transition-colors hover:bg-destructive/10"
            >
              <SIGN_OUT_ITEM.icon className="size-5 shrink-0" aria-hidden="true" />
              {SIGN_OUT_ITEM.label}
            </button>
          </li>
        </ul>
      </div>

      {/* Mention partenaire, en pied de rail : le bloc « Propulsé par » occupait
          la hauteur d'une entrée de menu en haut de la barre. Réduit à la seule
          marque Talan, en petit format, il tient sous les liens de compte sans
          leur disputer de place. */}
      <PartnerLogo
        src="/logos/talan.png"
        alt="Talan"
        fallbackLabel="Talan"
        className="ml-14 mt-3 h-7 self-start opacity-70"
      />
    </div>
  );
}
