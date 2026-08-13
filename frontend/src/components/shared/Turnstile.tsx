import { useEffect, useRef, useCallback, useState } from 'react';

import { API_BASE_URL } from '@/services/apiClient';

/**
 * Cloudflare Turnstile widget — drop-in captcha for auth forms.
 *
 * The site key is fetched from `GET /api/auth/config` at mount time so the
 * frontend needs no `.env` file of its own — all configuration lives in
 * `backend/.env`. When the backend returns `null` (key not configured),
 * the widget is hidden and a dev-bypass token is emitted so the submit
 * button is never blocked during local development.
 */

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileProps {
  /** Called with the Turnstile token once the challenge is solved. */
  onVerify: (token: string) => void;
  /** Called when a previously solved challenge expires. */
  onExpire?: () => void;
  /** Visual theme — follows the OS preference if omitted. */
  theme?: 'light' | 'dark' | 'auto';
  /** Widget size. */
  size?: 'normal' | 'compact';
}

/* ------------------------------------------------------------------ */
/* Script loader — shared across all instances                        */
/* ------------------------------------------------------------------ */

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (window.turnstile) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Turnstile script'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/* ------------------------------------------------------------------ */
/* Site-key fetcher — cached, fetched once per app session            */
/* ------------------------------------------------------------------ */

let siteKeyCache: string | null | undefined = undefined; // undefined = not yet fetched

/**
 * Résultat de la lecture de configuration.
 *
 * `unreachable` est distinct de `key: null` : le second est un choix de
 * l'environnement (pas de captcha en développement), le premier une panne. Les
 * confondre — ce que faisait ce module — donnait un formulaire sans widget et
 * un jeton de contournement qu'un backend correctement configuré rejette,
 * c'est-à-dire une connexion impossible sans rien à l'écran pour l'expliquer.
 */
type SiteKeyResult = { status: 'ok'; key: string } | { status: 'disabled' } | { status: 'unreachable' };

async function fetchSiteKey(): Promise<SiteKeyResult> {
  if (siteKeyCache !== undefined) {
    return siteKeyCache === null ? { status: 'disabled' } : { status: 'ok', key: siteKeyCache };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/config`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { turnstileSiteKey?: string | null };
    siteKeyCache = data.turnstileSiteKey ?? null;
  } catch (err) {
    // Pas de mise en cache : la prochaine tentative doit repartir du réseau,
    // sinon une coupure d'une seconde condamne l'onglet jusqu'au rechargement.
    console.error(
      `[Turnstile] Configuration illisible sur ${API_BASE_URL}/auth/config — le backend est-il démarré ?`,
      err,
    );
    return { status: 'unreachable' };
  }

  return siteKeyCache === null ? { status: 'disabled' } : { status: 'ok', key: siteKeyCache };
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export default function Turnstile({
  onVerify,
  onExpire,
  theme = 'light',
  size = 'normal',
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [siteKey, setSiteKey] = useState<string | null | undefined>(siteKeyCache);
  /** Panne : configuration injoignable, script bloqué, ou widget refusé par Cloudflare. */
  const [failure, setFailure] = useState<string | null>(null);

  // Stable callback refs so the widget doesn't re-render on every parent render.
  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const renderWidget = useCallback(
    (key: string) => {
      if (!containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current !== null) return; // already rendered

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: key,
          theme,
          size,
          callback: (token: string) => onVerifyRef.current(token),
          'expired-callback': () => onExpireRef.current?.(),
          // Sans ce rappel, Cloudflare refusait le widget sans un mot : clé
          // inconnue du domaine (code 110200, le cas d'un `localhost` absent de
          // la liste d'hôtes de la console Cloudflare), clé mal formée, ou
          // requête bloquée. L'écran restait vide et le bouton grisé.
          'error-callback': (code?: string) => {
            console.error(
              `[Turnstile] Cloudflare a refusé le widget (code ${code ?? 'inconnu'}). ` +
                'Vérifiez que le domaine courant figure dans les hôtes autorisés de la clé.',
            );
            setFailure(`Le captcha n’a pas pu se charger (code ${code ?? 'inconnu'}).`);
          },
        });
      } catch (err) {
        console.error('[Turnstile] window.turnstile.render a échoué :', err);
        setFailure('Le captcha n’a pas pu s’afficher.');
      }
    },
    [theme, size],
  );

  // Fetch site key on mount.
  useEffect(() => {
    let cancelled = false;

    fetchSiteKey().then((result) => {
      if (cancelled) return;

      if (result.status === 'ok') {
        setSiteKey(result.key);
        return;
      }

      if (result.status === 'disabled') {
        // Aucune clé côté backend : développement assumé, le formulaire doit
        // rester utilisable. Le backend saute la vérification symétriquement
        // (`verify_turnstile` sort quand `TURNSTILE_SECRET_KEY` est absent).
        console.warn(
          '[Turnstile] TURNSTILE_SITE_KEY absent du backend — captcha désactivé.',
        );
        setSiteKey(null);
        onVerifyRef.current('dev-bypass-token');
        return;
      }

      // Injoignable : surtout pas de jeton de contournement, que le backend
      // rejetterait s'il est, lui, configuré. On le dit à l'écran.
      setSiteKey(null);
      setFailure('Le service de vérification est injoignable. Réessayez dans un instant.');
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Render widget once siteKey is loaded and the container div is mounted in the DOM.
  useEffect(() => {
    if (!siteKey) return;

    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (!cancelled) renderWidget(siteKey);
      })
      .catch((err) => {
        console.error(
          '[Turnstile] Le script Cloudflare n’a pas pu être chargé ' +
            '(challenges.cloudflare.com bloqué par un proxy, un pare-feu ou une extension ?) :',
          err,
        );
        if (!cancelled) setFailure('Le captcha n’a pas pu être chargé.');
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, renderWidget]);

  // Une panne se dit : sans cela, le bouton d'envoi reste grisé face à un
  // espace vide, et rien à l'écran n'indique quoi faire.
  if (failure) {
    return (
      <p role="alert" className="text-center text-body-sm text-destructive">
        {failure}
      </p>
    );
  }

  // Rien à montrer pendant le chargement, ni quand le captcha est désactivé.
  if (!siteKey) return null;

  return (
    <div className="flex justify-center">
      <div ref={containerRef} />
    </div>
  );
}
