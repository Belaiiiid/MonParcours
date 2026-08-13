import {
  ChevronRight,
  Clock,
  FileText,
  Home,
  Mic,
  Paperclip,
  Send,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { AssistantMascot, AssistantMascotGlyph } from '@/features/chatbot/components/AssistantMascot';
import { MessageBubble } from '@/features/chatbot/components/MessageBubble';
import type { ChatbotController } from '@/features/chatbot/hooks/useChatbot';

/**
 * The conversation surface: thread, pending indicator and composer.
 *
 * Presentation only. It holds the draft the citizen is typing — genuinely local
 * UI state — and nothing else; the thread, the pending flag and the send action
 * all arrive from `useChatbot`. The service behind it could be swapped for any
 * other and nothing in this file would change.
 */

/**
 * Openers offered on an empty thread, when the caller doesn't supply its own
 * (see `ChatWindowProps.starterQuestions`) — the APL assistant's defaults.
 *
 * Questions about the *rules*, not about the citizen's own file: at this point
 * the assistant has no context, and an opener it cannot answer well is a bad
 * first impression of it.
 */
const DEFAULT_STARTER_QUESTIONS = [
  'Quels documents pour l’APL ?',
  'Que signifie justificatif de ressources ?',
  'Comment se déroule l’instruction d’un dossier ?',
];

/**
 * Pictogramme de chaque amorce, en variante `spotlight` — index par index,
 * pour que l'appelant n'ait pas à fournir ses questions *et* ses icônes.
 * Au-delà de la liste, l'amorce s'affiche sans pastille plutôt qu'avec un
 * pictogramme pris au hasard.
 */
const DEFAULT_STARTER_ICONS: LucideIcon[] = [Home, FileText, Clock];

/** Variante d'apparence — voir `ChatWindowProps.variant`. */
export type ChatWindowVariant = 'default' | 'spotlight';

/**
 * Disposition d'une amorce en variante `spotlight`.
 *
 * `stack` — pictogramme au-dessus de l'intitulé, carte centrée : trois tuiles
 * de même poids, pour un accueil où elles sont le sujet de l'écran.
 * `row` — pictogramme à gauche, intitulé, chevron à droite : une ligne d'action
 * plus compacte, pour un poste de travail où la barre de saisie prime.
 */
export type StarterLayout = 'stack' | 'row';

export interface ChatWindowProps {
  controller: ChatbotController;
  /** Overrides the empty-thread openers — a different assistant (e.g. the CV
   *  coach) needs prompts relevant to *its* domain, not APL's. */
  starterQuestions?: string[];
  /**
   * Mic button in the composer, next to Send — omitted wherever no voice
   * pipeline is mounted (e.g. outside `VoiceAssistantProvider`). Voice is
   * just another way to produce the message this window already sends;
   * this component stays presentation-only and owns none of the recording
   * state itself.
   */
  onVoiceInput?: () => void;
  isRecording?: boolean;
  /**
   * Fenêtre de chat plein écran : la fenêtre prend toute la hauteur qu'on lui
   * donne, seul le fil des messages défile, et le composeur reste ancré en bas.
   *
   * Opt-in, parce que les trois autres hôtes (panneau flottant, landing
   * publique, coach CV) posent cette fenêtre dans une page qui défile
   * normalement : leur imposer une hauteur pleine la couperait.
   */
  fill?: boolean;
  /**
   * Active la pièce jointe : bouton trombone dans la barre de saisie, et dépôt
   * d'un fichier n'importe où sur la fenêtre. Absent = pas de trombone et le
   * glisser-déposer reste inerte — les assistants qui n'attendent aucun fichier
   * ne doivent pas laisser croire le contraire.
   *
   * Le fichier part tel quel : c'est à l'hôte de décider ce qu'il en fait et
   * comment le tour correspondant apparaît dans le fil.
   */
  onAttachFile?: (file: File) => void;
  /** Texte de l'état vide, sous « Aucune conversation ». */
  emptyHint?: string;
  /**
   * `spotlight` : la fenêtre est le sujet de la page qui l'accueille, pas un
   * panneau posé dedans. Le fil vide laisse la place au titre de la page — ni
   * mascotte ni « Aucune conversation », seulement les amorces, en cartes —
   * et le composeur devient une pilule posée sur le fond, ancrée en bas.
   *
   * Opt-in : les hôtes qui encadrent déjà la fenêtre (panneau flottant, coach
   * CV, page `/chat`) gardent l'état vide explicite, qui y nomme ce qu'on
   * regarde.
   */
  variant?: ChatWindowVariant;
  /**
   * Pictogrammes des amorces, en variante `spotlight` — index par index, dans
   * l'ordre de `starterQuestions`.
   *
   * Un assistant qui remplace les amorces par les siennes doit pouvoir
   * remplacer les images qui vont avec : une maison et une horloge, choisies
   * pour l'APL, ne disent rien d'une recherche reglementaire.
   */
  starterIcons?: LucideIcon[];
  /**
   * Invitation posée au-dessus des amorces, en variante `spotlight`.
   *
   * Optionnelle : l'accueil public pose déjà la sienne dans le titre de la
   * page, et la répéter ici ferait deux fois la même question. Un poste de
   * travail, lui, garde son titre d'écran (« Assistant IA ») et a besoin de
   * cette seconde ligne pour dire ce que la fenêtre attend.
   */
  starterTitle?: string;
  /** Sous-titre de `starterTitle` — ce que l'assistant sait faire. Ignoré sans lui. */
  starterLead?: string;
  /** Disposition des amorces en `spotlight` — voir {@link StarterLayout}. */
  starterLayout?: StarterLayout;
  /**
   * Mascotte posée au-dessus de `starterTitle`, à la place de la pastille par
   * défaut. Ignorée sans lui.
   */
  starterMascotSrc?: string;
  /**
   * Pictogramme posé à gauche du champ de saisie, et second pictogramme devant
   * l'avertissement. Purement indicatifs : ils nomment la nature de la barre
   * (on parle) et celle de la mention (une réserve), là où un poste de travail
   * empile plusieurs zones de saisie sur un même écran.
   */
  composerIcon?: LucideIcon;
  disclaimerIcon?: LucideIcon;
  /** Posé sur la <section> — l'hôte décide du fond et des marges de la fenêtre. */
  className?: string;
  /** Placeholder de la barre de saisie. */
  composerPlaceholder?: string;
  /**
   * Amorce supplémentaire dans l'état vide, qui ouvre le sélecteur de fichier
   * au lieu d'envoyer un message. Ignorée sans `onAttachFile`.
   */
  attachSuggestion?: string;
}

/**
 * Une amorce en carte, variante `spotlight`.
 *
 * Verre dépoli plutôt qu'aplat : la carte laisse transparaître le dégradé de
 * la page, qui serait sinon masqué par trois rectangles blancs au centre de
 * l'écran. Le survol la soulève de 2px — le seul retour visuel dont a besoin
 * une cible qui envoie sa question au clic.
 */
function StarterCard({
  icon: Icon,
  label,
  onClick,
  layout = 'stack',
}: {
  icon?: LucideIcon;
  label: string;
  onClick: () => void;
  layout?: StarterLayout;
}) {
  const isRow = layout === 'row';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-full w-full backdrop-blur-[6px]',
        isRow ? 'items-center gap-3 p-3 text-left' : 'flex-col items-center gap-3 p-4 text-center',
        'rounded-[var(--chat-card-radius)] border border-[color:var(--chat-card-border)] bg-[var(--chat-card-bg)] shadow-[var(--chat-card-shadow)]',
        'transition-[transform,box-shadow,background-color,border-color] duration-200 ease-standard',
        'hover:-translate-y-0.5 hover:border-[color:var(--chat-card-border-hover)] hover:bg-[var(--chat-card-bg-hover)] hover:shadow-[var(--chat-card-shadow-hover)]',
      )}
    >
      {Icon && (
        <span
          aria-hidden="true"
          className={cn(
            'flex shrink-0 items-center justify-center rounded-lg bg-[color:var(--chat-card-icon-bg)] text-[color:var(--chat-card-icon-fg)]',
            isRow ? 'size-10' : 'size-8',
          )}
        >
          <Icon className={isRow ? 'size-5' : 'size-[18px]'} strokeWidth={1.75} />
        </span>
      )}
      <span
        className={cn(
          'font-medium leading-snug text-ink',
          isRow ? 'flex-1 text-body-md' : 'text-body-sm',
        )}
      >
        {label}
      </span>
      {/* Le chevron dit que l'amorce part au clic, là où la carte empilée le dit
          par sa forme de tuile. Décoratif : l'intitulé porte déjà l'action. */}
      {isRow && (
        <ChevronRight
          className="size-4 shrink-0 text-on-surface-variant/60"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

/** Formats acceptés par la pièce jointe — CV en PDF ou en photo. */
const ATTACHMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

export function ChatWindow({
  controller,
  starterQuestions = DEFAULT_STARTER_QUESTIONS,
  onVoiceInput,
  isRecording = false,
  fill = false,
  onAttachFile,
  emptyHint = 'Posez une question pour démarrer un échange avec l’assistant.',
  variant = 'default',
  starterIcons = DEFAULT_STARTER_ICONS,
  starterTitle,
  starterLead,
  starterLayout = 'stack',
  starterMascotSrc,
  composerIcon: ComposerIcon,
  disclaimerIcon: DisclaimerIcon,
  className,
  composerPlaceholder = 'Posez votre question ici…',
  attachSuggestion,
}: ChatWindowProps) {
  const { messages, isSending, error, send, selectOption } = controller;
  const isSpotlight = variant === 'spotlight';
  const [draft, setDraft] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep the latest turn in view as the conversation grows. En mode plein
  // écran on pousse directement le conteneur en bas de sa hauteur de défilement
  // — c'est lui le seul élément qui défile, viser le repère de fin reviendrait
  // au même en moins direct.
  useEffect(() => {
    if (fill && threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
      return;
    }
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length, isSending, fill]);

  const submit = (question: string) => {
    send(question);
    setDraft('');
  };

  const attach = (files: FileList | null) => {
    const file = files?.[0];
    if (file && onAttachFile && !isSending) onAttachFile(file);
  };

  return (
    <section
      className={cn(
        'relative flex flex-col lg:col-span-2',
        // `min-h-0` : sans lui, un enfant en `flex-1` refuse de rétrécir sous
        // la hauteur de son contenu et le fil déborderait au lieu de défiler.
        fill && 'h-full min-h-0',
        // La fenêtre prend toute la hauteur que l'hôte lui laisse, pour que le
        // composeur en `mt-auto` tombe en bas de l'écran sur un fil vide.
        isSpotlight && 'min-h-0 flex-1',
        className,
      )}
      aria-label="Conversation avec l’assistant"
      onDragOver={
        onAttachFile
          ? (event) => {
              event.preventDefault();
              setIsDragOver(true);
            }
          : undefined
      }
      onDragLeave={onAttachFile ? () => setIsDragOver(false) : undefined}
      onDrop={
        onAttachFile
          ? (event) => {
              event.preventDefault();
              setIsDragOver(false);
              attach(event.dataTransfer.files);
            }
          : undefined
      }
    >
      <h1 className="sr-only">Assistant</h1>

      {/* Surlignage de dépôt : un voile par-dessus la fenêtre pendant le survol,
          `pointer-events-none` pour ne pas intercepter le `drop` lui-même. */}
      {isDragOver && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 rounded-xl border-2 border-dashed border-primary bg-primary-fixed/30"
        />
      )}

      <div
        ref={threadRef}
        className={cn('flex flex-col', fill && 'min-h-0 flex-1 overflow-y-auto pr-1')}
      >
      {messages.length > 0 ? (
        <ul className="flex flex-1 flex-col gap-6" aria-live="polite" aria-busy={isSending}>
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              onSuggestionSelect={submit}
              // Seuls les choix du dernier tour restent cliquables : une question
              // de clarification déjà dépassée n'attend plus de réponse.
              onOptionSelect={
                index === messages.length - 1 && !isSending ? selectOption : undefined
              }
            />
          ))}

          {isSending && (
            <li className="flex gap-3">
              <AssistantMascot />
              <p className="self-center text-body-sm italic text-on-surface-variant">
                L’assistant rédige une réponse…
              </p>
            </li>
          )}
        </ul>
      ) : (
        <div
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-6',
            // Le bloc d'accueil remonte : centre dans la hauteur, il tombait
            // trop bas sur un grand ecran, loin du titre de la page qui
            // l'annonce. Le rembourrage bas reduit la zone de centrage, donc
            // deplace le contenu vers le haut sans le decoller du composeur.
            starterTitle && 'pb-24 sm:pb-32',
          )}
        >
          {/* État vide écrit ici plutôt qu'avec `EmptyState` : la mascotte y
              est le sujet, pas un pictogramme dans une pastille de 64 px —
              ce composant partagé contraint la taille de son icône.

              En `spotlight`, ni mascotte ni « Aucune conversation » : la page
              hôte pose déjà sa propre question en titre, et nommer le vide
              juste en dessous ne dit rien de plus que les amorces. */}
          {!isSpotlight && (
            <div className="flex flex-col items-center px-6 text-center">
              <AssistantMascotGlyph className="-mb-1 w-36 max-w-full" />
              <h3 className="text-headline-md text-on-surface">Aucune conversation</h3>
              <p className="mt-2 max-w-md text-body-md text-on-surface-variant">{emptyHint}</p>
            </div>
          )}

          {isSpotlight && starterTitle && (
            /* L'invitation, en toutes lettres : sur un poste de travail, c'est
               elle qui dit ce que la fenêtre attend — une mascotte, à cette
               place, ne disait rien que les amorces ne disent déjà. */
            <div className="max-w-2xl px-4 text-center">
              {/* Ouverture : elle signe la surface comme une surface
                  d'assistant, ce que le titre seul ne fait pas sur un écran de
                  back-office où tout se ressemble. Décorative — la mascotte
                  quand l'hôte en fournit une, sinon une pastille. */}
              {starterMascotSrc ? (
                <img
                  src={starterMascotSrc}
                  alt=""
                  aria-hidden="true"
                  className="mx-auto mb-5 h-20 w-auto object-contain"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-[color:var(--chat-card-icon-bg)] text-[color:var(--chat-card-icon-fg)]"
                >
                  <Sparkles className="size-6" strokeWidth={1.75} />
                </span>
              )}
              <h2 className="font-sans text-headline-lg-mobile font-bold leading-tight text-[color:var(--chat-title-ink)] sm:text-headline-lg">
                {starterTitle}
              </h2>
              {starterLead && (
                <p className="mx-auto mt-3 max-w-xl text-body-lg leading-relaxed text-on-surface-variant">
                  {starterLead}
                </p>
              )}
            </div>
          )}

          <ul
            className={cn(
              isSpotlight
                ? 'grid w-full max-w-[760px] gap-3 px-2 sm:grid-cols-3'
                : 'flex flex-wrap justify-center gap-2',
            )}
          >
            {starterQuestions.map((question, index) =>
              isSpotlight ? (
                <li key={question}>
                  <StarterCard
                    icon={starterIcons[index]}
                    label={question}
                    layout={starterLayout}
                    onClick={() => submit(question)}
                  />
                </li>
              ) : (
                <li key={question}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => submit(question)}
                  >
                    {question}
                  </Button>
                </li>
              ),
            )}

            {/* Amorce qui ouvre le sélecteur au lieu d'envoyer du texte : le
                dépôt est une façon de commencer comme une autre, il a donc sa
                place dans la même rangée. */}
            {onAttachFile && attachSuggestion && (
              <li>
                {isSpotlight ? (
                  <StarterCard
                    icon={Paperclip}
                    label={attachSuggestion}
                    onClick={() => fileInputRef.current?.click()}
                  />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip aria-hidden="true" />
                    {attachSuggestion}
                  </Button>
                )}
              </li>
            )}
          </ul>
        </div>
      )}

      <div ref={threadEndRef} />
      </div>

      {error && (
        <Alert tone="error" className="mt-6">
          <AlertDescription>
            La réponse n’a pas pu être obtenue : {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Composer — ancré en bas : hauteur propre, jamais dans la zone qui
          défile. Hors mode plein écran il reste `sticky`, la page hôte étant
          elle-même le conteneur de défilement. */}
      <div
        className={cn(
          'mt-8 pt-4',
          fill ? 'shrink-0' : 'sticky bottom-0',
          // Fond opaque réservé au composeur `sticky` : là, le fil défile
          // dessous et le masque est ce qui l'empêche de transparaître. En
          // `fill` la barre est hors de la zone qui défile, et ce même fond ne
          // faisait plus qu'un rectangle blanc posé sur le dégradé de l'hôte.
          // `mt-auto` : sur un fil vide la barre tombe en bas de l'écran au
          // lieu de suivre les cartes.
          isSpotlight ? 'mt-auto' : fill ? undefined : 'bg-background',
        )}
      >
        <form
          className={cn(
            'flex items-end gap-2 p-2',
            isSpotlight
              ? // Bordure transparente au repos plutôt qu'absente : elle occupe
                // déjà sa place, donc le passage au bleu pendant la saisie ne
                // décale rien. C'est la pilule entière qui prend le focus, pas
                // le champ à l'intérieur.
                'rounded-[var(--chat-composer-radius)] border border-[color:var(--chat-composer-border)] bg-[color:var(--chat-composer-bg)] p-2.5 pl-5 shadow-[var(--chat-composer-shadow)] transition-colors focus-within:border-[color:var(--chat-composer-border-focus)]'
              : 'rounded-xl border border-border bg-surface-lowest',
          )}
          onSubmit={(event) => {
            event.preventDefault();
            submit(draft);
          }}
        >
          <label htmlFor="chat-input" className="sr-only">
            Votre message
          </label>

          {ComposerIcon && (
            <ComposerIcon
              aria-hidden="true"
              className="mb-2.5 size-5 shrink-0 text-on-surface-variant/70"
              strokeWidth={1.75}
            />
          )}
          <Textarea
            id="chat-input"
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            // Enter sends; Shift+Enter breaks the line, as in every chat UI.
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submit(draft);
              }
            }}
            placeholder={composerPlaceholder}
            className={cn(
              'min-h-11 resize-none border-0 focus-visible:ring-0',
              isSpotlight &&
                'bg-transparent focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-none',
            )}
          />

          {onAttachFile && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={ATTACHMENT_ACCEPT}
                className="sr-only"
                onChange={(event) => {
                  attach(event.target.files);
                  // Remis à zéro : sans ça, renvoyer deux fois le même fichier
                  // ne déclenche pas de second `change`.
                  event.target.value = '';
                }}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Joindre un fichier — PDF, JPG ou PNG"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
              >
                <Paperclip aria-hidden="true" />
              </Button>
            </>
          )}

          {onVoiceInput &&
            (isSpotlight ? (
              <button
                type="button"
                aria-label={isRecording ? 'Arrêter l’enregistrement et envoyer' : 'Poser la question à l’oral'}
                aria-pressed={isRecording}
                onClick={onVoiceInput}
                disabled={isSending}
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40',
                  // L'enregistrement en cours est le seul état qui doit sauter
                  // aux yeux : ailleurs le micro reste une option discrète.
                  isRecording
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-[color:var(--chat-card-icon-bg)] text-[color:var(--chat-card-icon-fg)] hover:brightness-95',
                )}
              >
                <Mic className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            ) : (
              <Button
                type="button"
                size="icon"
                variant={isRecording ? 'destructive' : 'outline'}
                aria-label={isRecording ? 'Arrêter l’enregistrement et envoyer' : 'Poser la question à l’oral'}
                aria-pressed={isRecording}
                onClick={onVoiceInput}
                disabled={isSending}
              >
                <Mic aria-hidden="true" />
              </Button>
            ))}

          {isSpotlight ? (
            <button
              type="submit"
              aria-label="Envoyer le message"
              disabled={isSending || draft.trim().length === 0}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--chat-send-bg)] text-white shadow-[var(--chat-send-shadow)] transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Send className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          ) : (
            <Button
              type="submit"
              size="icon"
              aria-label="Envoyer le message"
              disabled={isSending || draft.trim().length === 0}
            >
              <Send aria-hidden="true" />
            </Button>
          )}
        </form>

        <p className="mt-3 flex items-center justify-center gap-2 text-center text-[length:var(--chat-disclaimer-size)] leading-snug text-on-surface-variant">
          {DisclaimerIcon && (
            <DisclaimerIcon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          )}
          L’assistant peut faire des erreurs. Vérifiez les informations importantes.
        </p>
      </div>
    </section>
  );
}
