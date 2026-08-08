import { Landmark } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { SERVICES } from '@/app/config/services';
import { AdministrationCard } from '@/components/citizen/ServiceCard';
import { AdministrationsHero } from '@/features/portal/components/AdministrationsHero';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useVoicePage } from '@/features/voice/context/VoicePageContext';
import type { VoicePageAction } from '@/features/voice/types';

/**
 * "Administrations" — the first choice a citizen makes, and now the first
 * screen after sign-in: the voice choice is offered by a dialog on the landing
 * page, not by an interstitial standing between a citizen and their dossier.
 * CAF and France Travail are wired to real backends; the rest render as
 * locked tiles rather than pretending to be usable.
 */
export default function AdministrationsPage() {
  useDocumentTitle('Administrations');
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  /* La recherche du bandeau filtre la grille : nom, intitulé complet et
     organisme, ce sous quoi une administration est cherchée. */
  const visibleServices = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return SERVICES;
    return SERVICES.filter((service) =>
      [service.name, service.fullName, service.administration]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [query]);

  const availableServices = SERVICES.filter((service) => service.status === 'available');
  const availableActions: VoicePageAction[] = availableServices.map((service) => ({
    id: `select_${service.id}`,
    label: service.name,
    description: `Choisir l’administration ${service.name}`,
    intent: { type: 'click_action', actionId: `select_${service.id}` },
  }));

  useVoicePage({
    readableText: `Page des administrations. Choisissez une administration pour accéder à ses services. Disponibles pour le moment : ${availableServices.map((s) => s.name).join(', ')}. Les autres arriveront bientôt.`,
    actions: availableActions,
    actionCallbacks: Object.fromEntries(
      availableServices.map((service) => [`select_${service.id}`, () => navigate(service.basePath)]),
    ),
  });

  return (
    <>
      <AdministrationsHero query={query} onQueryChange={setQuery} />

      {/* `pb-20` : la grille ne touche plus le pied de page, elle a la place de
          se terminer avant que le bandeau bleu commence. */}
      <div className="mx-auto mt-12 max-w-7xl pb-20">
        <h2 className="mb-8 flex items-center gap-3 font-display text-xl font-extrabold text-ink">
          <Landmark className="size-6 text-brand" aria-hidden="true" />
          Toutes les administrations
        </h2>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleServices.map((service) => (
            <li key={service.id}>
              <AdministrationCard service={service} size="compact" />
            </li>
          ))}
        </ul>

        {visibleServices.length === 0 && (
          <p className="rounded-xl border border-dashed border-brand/30 bg-brand-soft/40 px-6 py-10 text-center text-sm text-muted-foreground">
            Aucune administration ne correspond à « {query.trim()} ».
          </p>
        )}
      </div>
    </>
  );
}
