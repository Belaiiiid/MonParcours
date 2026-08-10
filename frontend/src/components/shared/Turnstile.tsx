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

async function fetchSiteKey(): Promise<string | null> {
  if (siteKeyCache !== undefined) return siteKeyCache;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/config`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { turnstileSiteKey?: string | null };
    siteKeyCache = data.turnstileSiteKey ?? null;
  } catch (err) {
    console.error('[Turnstile] Failed to fetch site key from backend:', err);
    siteKeyCache = null;
  }

  return siteKeyCache;
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

  // Stable callback refs so the widget doesn't re-render on every parent render.
  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const renderWidget = useCallback(
    (key: string) => {
      if (!containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current !== null) return; // already rendered

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: key,
        theme,
        size,
        callback: (token: string) => onVerifyRef.current(token),
        'expired-callback': () => onExpireRef.current?.(),
      });
    },
    [theme, size],
  );

  // Fetch site key on mount.
  useEffect(() => {
    let cancelled = false;

    fetchSiteKey().then((key) => {
      if (cancelled) return;
      setSiteKey(key);

      if (!key) {
        // No key configured → dev mode: auto-verify so the form is usable.
        console.warn(
          '[Turnstile] TURNSTILE_SITE_KEY not set on the backend — captcha widget will not render.',
        );
        onVerifyRef.current('dev-bypass-token');
      }
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
      .catch((err) => console.error('[Turnstile] Script load failed:', err));

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, renderWidget]);

  // Nothing to show while loading or when the key is absent.
  if (!siteKey) return null;

  return (
    <div className="flex justify-center">
      <div ref={containerRef} />
    </div>
  );
}
