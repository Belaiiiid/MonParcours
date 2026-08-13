import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * Design tokens extracted from /design-preference (système « République Assistée »).
 * See docs/design-analysis.md §3 — the token values are the source of truth.
 *
 * Colors are wired to CSS variables declared in src/index.css so that the
 * accessibility preferences (high contrast, etc.) can override them at runtime
 * without rebuilding the utility classes.
 */

/**
 * Un jeton de couleur qui accepte le modificateur d'opacité de Tailwind.
 *
 * Déclaré `'var(--x)'` en chaîne simple, un jeton **perd silencieusement** le
 * modificateur : `bg-on-surface/40` ne produit alors aucune règle, et l'élément
 * s'affiche sans fond du tout. Tailwind ne connaît que la chaîne `var(--x)`, pas
 * les canaux derrière, donc il ne sait pas y injecter un alpha.
 *
 * Le coût de cet oubli était réel et invisible en revue : le voile des boîtes de
 * dialogue (`bg-on-surface/40`) et les anneaux de focus des champs
 * (`ring-ai/20`, `ring-primary/20`) ne s'affichaient pas — 24 classes mortes au
 * total.
 *
 * La forme fonction laisse Tailwind demander la couleur avec ou sans alpha :
 * - sans modificateur, on rend `var(--x)` tel quel — la sortie CSS existante ne
 *   bouge pas d'un octet, ce qui est la propriété qu'on veut pour un correctif
 *   posé sur toute la palette ;
 * - avec modificateur, `color-mix()` applique l'alpha sans avoir à connaître les
 *   canaux, ce qui marche aussi bien pour un hex (`--primary`) que pour un
 *   `oklch()` (`--admtl-*`). Mélanger avec `transparent` en alpha prémultiplié
 *   ne fait que poser l'opacité : la teinte n'est pas assombrie.
 */
const colorToken =
  (variable: string) =>
  ({ opacityValue }: { opacityValue?: string | number } = {}) => {
    if (opacityValue === undefined) return `var(${variable})`;

    /*
     * `opacityValue` arrive sous trois formes selon l'appelant : un nombre
     * (le plugin de dégradés passe `0` pour sa borne transparente), un nombre
     * en chaîne (`'0.4'` pour un modificateur `/40`), ou — sans modificateur —
     * la variable d'opacité de l'utilitaire, `var(--tw-bg-opacity, 1)`.
     * D'où la normalisation avant tout test : `.includes()` sur le nombre brut
     * fait échouer le build entier au moment de la compilation du CSS.
     */
    const alpha = String(opacityValue);

    /*
     * Cas sans modificateur : on rend le jeton nu. La sortie CSS de toutes les
     * classes qui marchaient déjà reste identique, et `color-mix()` n'apparaît
     * que là où un alpha est réellement demandé — c'est ce qui rend ce
     * correctif sûr appliqué à la palette entière.
     */
    if (alpha.includes('var(--tw-')) return `var(${variable})`;

    return `color-mix(in srgb, var(${variable}) calc(${alpha} * 100%), transparent)`;
  };

/**
 * Le cast est délibéré. Tailwind accepte une fonction partout où il accepte une
 * couleur — c'est la manière documentée de brancher un jeton CSS sur le
 * modificateur d'opacité — mais ses propres types déclarent les feuilles de la
 * palette en `string`. Sans ce cast, la forme fonction ne compile pas, alors
 * qu'elle est exactement ce que le moteur attend à l'exécution.
 */
const token = colorToken as unknown as (variable: string) => string;
const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: {
          DEFAULT: token('--primary'),
          foreground: token('--on-primary'),
          container: token('--primary-container'),
          fixed: token('--primary-fixed'),
          'fixed-dim': token('--primary-fixed-dim'),
          'on-fixed': token('--on-primary-fixed'),
        },
        secondary: {
          DEFAULT: token('--secondary'),
          foreground: token('--on-secondary'),
          fixed: token('--secondary-fixed'),
          'fixed-dim': token('--secondary-fixed-dim'),
          'on-fixed': token('--on-secondary-fixed'),
        },
        // AI accent — the #003593 / #f0f4ff pairing used by recommendation cards
        ai: {
          DEFAULT: token('--accent-ai'),
          surface: token('--accent-ai-surface'),
          // Un cran plus soutenu que `surface`, qui est presque blanc : la
          // teinte des pastilles qui doivent se voir posées *sur* une carte.
          container: token('--accent-ai-container'),
        },

        // Surfaces (tonal layering)
        background: token('--background'),
        surface: {
          DEFAULT: token('--surface'),
          lowest: token('--surface-container-lowest'),
          low: token('--surface-container-low'),
          container: token('--surface-container'),
          high: token('--surface-container-high'),
          highest: token('--surface-container-highest'),
          inverse: token('--inverse-surface'),
        },

        // Text
        'on-surface': {
          DEFAULT: token('--on-surface'),
          variant: token('--on-surface-variant'),
        },
        muted: {
          DEFAULT: token('--surface-container-low'),
          foreground: token('--text-muted'),
        },

        // Borders
        border: {
          DEFAULT: token('--border-subtle'),
          strong: token('--outline-variant'),
        },
        outline: {
          DEFAULT: token('--outline'),
          variant: token('--outline-variant'),
        },
        ring: token('--primary'),

        // Status
        success: {
          DEFAULT: token('--success'),
          surface: token('--success-surface'),
          foreground: token('--on-success'),
        },
        warning: {
          DEFAULT: token('--warning'),
          surface: token('--warning-surface'),
          foreground: token('--on-warning'),
        },
        destructive: {
          DEFAULT: token('--error'),
          surface: token('--error-surface'),
          foreground: token('--on-error'),
          strong: token('--status-error'),
        },

        // République Française identity (tricolore)
        rf: {
          blue: '#000091',
          white: '#ffffff',
          red: '#e1000f',
        },

        // Administral design system — citizen-facing interfaces only (scoped
        // under `.citizen-scope`, see src/index.css). New tokens, so they are
        // safe to declare globally: nothing outside that scope ever uses them.
        brand: {
          DEFAULT: token('--admtl-brand'),
          soft: token('--admtl-brand-soft'),
        },
        // Bleu d'action du portail citoyen (titres de page, boutons d'appel à
        // l'action). Un jeton plutôt qu'un `bg-[#102a74]` répété : la teinte
        // apparaît déjà à la connexion et sur le dépôt de dossier.
        action: {
          DEFAULT: token('--admtl-action'),
        },
        // Aplat rouge de la deconnexion — voir `--admtl-signout`.
        signout: token('--admtl-signout'),
        marianne: {
          DEFAULT: token('--admtl-marianne'),
          foreground: token('--admtl-marianne-foreground'),
        },
        ink: token('--admtl-ink'),
        foreground: token('--admtl-foreground'),
        card: {
          DEFAULT: token('--admtl-card'),
          foreground: token('--admtl-card-foreground'),
          // Translucide — pour une carte posée sur une photo. Voir index.css.
          veil: token('--admtl-card-veil'),
        },
        'chart-2': token('--admtl-chart-2'),
        'chart-3': token('--admtl-chart-3'),

        // Third-party brand identity — see `--brand-whatsapp` in index.css.
        whatsapp: token('--brand-whatsapp'),
      },

      fontFamily: {
        // Both driven by CSS variables so `.citizen-scope` (src/index.css) can
        // swap in DM Sans / Plus Jakarta Sans for the Administral redesign
        // without touching `font-sans` / `font-display` anywhere else.
        sans: ['var(--font-sans)', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['var(--font-display)', 'Manrope', 'Inter', 'system-ui', 'sans-serif'],      },

      // Typographic scale from DESIGN.md — size / line-height / weight / tracking
      fontSize: {
        display: ['36px', { lineHeight: '44px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': [
          '28px',
          { lineHeight: '36px', letterSpacing: '-0.01em', fontWeight: '600' },
        ],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'headline-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '600' }],
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },

      // 8px base grid
      spacing: {
        gutter: '24px',
        'margin-mobile': '16px',
        'margin-desktop': '32px',
        sidebar: '256px',
        header: '64px',
      },

      maxWidth: {
        container: '1200px',
        form: '800px',
        prose: '720px',
      },

      screens: {
        /*
         * Height-based, not width-based: `short:` compacts a layout that must
         * fit the viewport without scrolling (the sign-in card) on a laptop or
         * a browser with a lot of chrome. Everything it touches only loses
         * whitespace, never content — a citizen who zooms in still gets a
         * scrollbar rather than a clipped form.
         */
        short: { raw: '(max-height: 820px)' },
        /* Second tier for a 1366×768 laptop, where browser chrome and the
         * taskbar leave roughly 600px. Declared after `short` so its rules are
         * emitted later and win where both apply. */
        shorter: { raw: '(max-height: 680px)' },
      },

      borderRadius: {
        // Named explicitly to resolve the DESIGN.md / tailwind-config ambiguity.
        //
        // Variable-driven so a scope can retune the whole scale at once — the
        // agent back-office squares everything off (`.agent-scope`, index.css).
        // Fallbacks are the charter values (§6.1), so every other area is
        // unaffected. `rounded-full` is Tailwind's own and stays round.
        sm: 'var(--radius-sm, 4px)', // checkboxes, tags
        DEFAULT: 'var(--radius-md, 8px)', // buttons, inputs
        md: 'var(--radius-md, 8px)',
        lg: 'var(--radius-lg, 8px)',
        xl: 'var(--radius-xl, 12px)', // cards
        '2xl': 'var(--radius-2xl, 16px)', // large outer containers
      },

      boxShadow: {
        // The single soft technical shadow — no other elevation exists.
        soft: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'soft-hover': '0 4px 12px rgb(0 0 0 / 0.05)',
      },

      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // Sweeping bar used by the landing "Génération en cours…" panel.
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(300%)' },
        },
        /*
         * Continuous horizontal ticker. The track renders its items twice, so
         * translating by exactly -50% lands on the start of the second copy —
         * which is pixel-identical to the start of the first, hence seamless.
         */
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'accordion-up': 'accordion-up 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [animate],
};

export default config;
