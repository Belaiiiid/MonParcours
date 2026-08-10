import { Clock, MessageSquare, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { EmptyState } from '@/components/shared';
import { cn } from '@/lib/utils';
import type { ChatbotMessage } from '@/features/chatbot/types/chatbot';

/**
 * "Historique des conversations" for the merged chatbot widget.
 *
 * The backend keeps one continuous, session-less thread per citizen
 * (`chatbot_messages`, ordered only by `created_at` — see
 * `app/modules/chatbot/history.py`), not separate conversations. Rather than
 * fabricate a conversation/session concept the API does not have, this groups
 * the *real* persisted messages by calendar day: each day the citizen actually
 * talked to the assistant becomes one entry, titled from their first question
 * that day. Clicking an entry resumes the single thread scrolled back to that
 * day — an honest reflection of the real data model, not an invented one.
 */

export interface ConversationDayGroup {
  key: string;
  label: string;
  title: string;
  messageCount: number;
  /** id of the first message of the day — the scroll anchor to resume on. */
  firstMessageId: string;
  /**
   * La journée au format `AAAA-MM-JJ`, tel que l'attend l'API de suppression.
   * `key` ne peut pas servir : son mois est celui de `getMonth()`, compté à
   * partir de zéro, et sans zéro de tête.
   */
  isoDay: string;
}

function dateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function labelFor(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dateKey(iso) === dateKey(today.toISOString())) return "Aujourd'hui";
  if (dateKey(iso) === dateKey(yesterday.toISOString())) return 'Hier';

  const formatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** `AAAA-MM-JJ` en heure locale — `toISOString()` decalerait la journee. */
function isoDay(iso: string): string {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function truncate(text: string, max = 64): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max).trimEnd()}…` : trimmed;
}

/** Groups a thread by calendar day, most recent day first. */
export function groupByDay(messages: ChatbotMessage[]): ConversationDayGroup[] {
  const groups = new Map<string, ChatbotMessage[]>();

  for (const message of messages) {
    const key = dateKey(message.createdAt);
    const bucket = groups.get(key);
    if (bucket) bucket.push(message);
    else groups.set(key, [message]);
  }

  return Array.from(groups.entries())
    .map(([key, groupMessages]) => {
      const firstUser = groupMessages.find((m) => m.role === 'user');
      return {
        key,
        label: labelFor(groupMessages[0].createdAt),
        title: firstUser ? truncate(firstUser.content) : 'Conversation',
        messageCount: groupMessages.length,
        firstMessageId: groupMessages[0].id,
        isoDay: isoDay(groupMessages[0].createdAt),
      };
    })
    .reverse();
}

export interface ConversationHistoryProps {
  messages: ChatbotMessage[];
  onResume: (firstMessageId: string) => void;
  /**
   * Efface la journée (`AAAA-MM-JJ`). Absent : aucune corbeille n'est
   * proposée — un hôte dont le fil n'est pas persisté n'a rien à supprimer.
   */
  onDelete?: (isoDay: string) => Promise<void> | void;
}

export function ConversationHistory({ messages, onResume, onDelete }: ConversationHistoryProps) {
  const groups = groupByDay(messages);
  /* Confirmation en place plutot qu'une boite de dialogue : la suppression est
     definitive, elle ne doit pas partir sur un clic isole, mais elle ne merite
     pas non plus d'interrompre la lecture de l'historique. */
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const remove = async (day: string) => {
    setBusy(day);
    try {
      await onDelete?.(day);
    } finally {
      setBusy(null);
      setConfirming(null);
    }
  };

  if (groups.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <EmptyState
          icon={Clock}
          title="Aucun historique"
          description="Vos échanges avec l’assistant apparaîtront ici, classés par jour."
          size="compact"
        />
      </div>
    );
  }

  return (
    <ul className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-2" aria-label="Historique des conversations">
      {groups.map((group) => (
        /* `group` : la corbeille n'apparait qu'au survol ou au clavier, pour ne
           pas border chaque ligne d'une icone de destruction en permanence. */
        <li key={group.key} className="group/entry relative">
          <button
            type="button"
            onClick={() => onResume(group.firstMessageId)}
            className={cn(
              'flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors',
              'hover:bg-surface-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai',
              // Place reservee a la corbeille : le titre ne doit pas passer
              // dessous quand elle apparait.
              onDelete && 'pr-11',
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-label-sm font-medium text-on-surface">{group.label}</span>
              <span className="flex items-center gap-1 text-body-sm text-on-surface-variant">
                <MessageSquare className="size-3.5" aria-hidden="true" />
                {group.messageCount}
              </span>
            </span>
            <span className="truncate text-body-sm text-on-surface-variant">{group.title}</span>
          </button>

          {onDelete &&
            (confirming === group.isoDay ? (
              /* Deux boutons explicites plutot qu'un `confirm()` : la phrase dit
                 ce qui part et ce que ca coute, et « Annuler » est atteignable
                 au clavier comme le reste de la liste. */
              <div className="mt-1 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2">
                <p className="flex-1 text-body-sm text-on-surface">
                  Effacer les échanges du {group.label.toLowerCase()} ? C’est définitif.
                </p>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="rounded-md px-2 py-1 text-label-sm text-on-surface-variant transition-colors hover:bg-surface-high"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => void remove(group.isoDay)}
                  disabled={busy === group.isoDay}
                  className="rounded-md bg-destructive px-2 py-1 text-label-sm text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {busy === group.isoDay ? 'Suppression…' : 'Effacer'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(group.isoDay)}
                aria-label={`Effacer les échanges du ${group.label.toLowerCase()}`}
                className={cn(
                  'absolute right-2 top-2 flex size-8 items-center justify-center rounded-md text-on-surface-variant opacity-0 transition-[opacity,color] hover:bg-destructive/10 hover:text-destructive',
                  'group-hover/entry:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai',
                )}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            ))}
        </li>
      ))}
    </ul>
  );
}
