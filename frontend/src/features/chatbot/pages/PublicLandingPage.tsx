import { useEffect, useRef, useState } from 'react';

import { CitizenFooter } from '@/components/layout/CitizenFooter';
import { cn } from '@/lib/utils';
import { SkipLink } from '@/components/layout/SkipLink';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ChatWindow } from '@/features/chatbot/components/ChatWindow';
import { FloatingActionBubbles } from '@/features/chatbot/components/FloatingActionBubbles';
import { useChatbot } from '@/features/chatbot/hooks/useChatbot';
import { useChatbotUiStore } from '@/features/chatbot/store/chatbotUiStore';
import { LandingAI } from '@/features/chatbot/components/landing/LandingAI';
import { LandingFeatures } from '@/features/chatbot/components/landing/LandingFeatures';
import { LandingHeader } from '@/features/chatbot/components/landing/LandingHeader';
import { LandingHero } from '@/features/chatbot/components/landing/LandingHero';
import { LandingInnovation } from '@/features/chatbot/components/landing/LandingInnovation';
import { LandingStatsMarquee } from '@/features/chatbot/components/landing/LandingStatsMarquee';
import { LandingServices } from '@/features/chatbot/components/landing/LandingServices';
import { LandingTrust } from '@/features/chatbot/components/landing/LandingTrust';
import { Reveal } from '@/features/chatbot/components/landing/Reveal';
import { VoiceAssistantProvider } from '@/features/voice/components/VoiceAssistantProvider';
import { VoiceAssistantPanel } from '@/features/voice/components/VoiceAssistantPanel';
import { VoiceOnboardingDialog } from '@/features/voice/components/VoiceOnboardingDialog';
import { VoiceStatusStrip } from '@/features/voice/components/VoiceStatusStrip';
import { VoicePageProvider, useVoicePage } from '@/features/voice/context/VoicePageContext';
import { useVoiceComposer } from '@/features/voice/hooks/useVoiceComposer';
import { useVoiceStore } from '@/features/voice/store/voiceStore';

type AssistMode = 'voice' | 'text';

/**
 * Public entry point (`/`) for a visitor with no session.
 *
 * The assistant first, an account second: a citizen unsure whether they are
 * even eligible should not have to register before finding out. It is the
 * same `useChatbot` + `ChatWindow` the authenticated `/chat` page uses — the
 * anonymous case was already supported server-side
 * (`get_current_user_optional`), so nothing new was needed there, only a
 * place to reach it before signing in.
 *
 * "Se connecter" is the only way further in from here; there is no session
 * to protect and nothing to fabricate for one that does not exist yet.
 *
 * Before the assistant opens, the page reads as a marketing/trust page —
 * hero, services, features, benefits — rather than an administrative portal,
 * and the citizen picks voice-or-text before starting rather than mid-
 * conversation.
 *
 * Voice works here exactly as it does for a signed-in citizen: the backend
 * voice endpoints (`app/modules/voice`) never required a session, so the only
 * thing missing was mounting `VoicePageProvider` + `VoiceAssistantProvider` on
 * this route too, instead of only inside `AppShell`.
 */
export default function PublicLandingPage() {
  return (
    <VoicePageProvider>
      <VoiceAssistantProvider>
        <LandingContent />
        <VoiceAssistantPanel />
      </VoiceAssistantProvider>
    </VoicePageProvider>
  );
}

function LandingContent() {
  useDocumentTitle('MonParcours — Assistant');
  const controller = useChatbot();
  const enableVoiceMode = useVoiceStore((state) => state.enableVoiceMode);
  const disableVoiceMode = useVoiceStore((state) => state.disableVoiceMode);

  const [started, setStarted] = useState(false);
  /** Fil encore vide : rien n'a été demandé, la page n'affiche que ses amorces. */
  const isEmptyThread = controller.messages.length === 0;
  const [assistMode, setAssistMode] = useState<AssistMode>('text');

  const {
    status: voiceStatus,
    transcript,
    error: voiceError,
    isRecording,
    toggleRecording,
    speakText,
    stopSpeaking,
  } = useVoiceComposer(controller.send);

  // A citizen who picked "Assistant vocal + texte" was promised replies read
  // aloud too — not just a working mic. Text-only visitors get silence.
  const readRepliesAloud = assistMode === 'voice';
  const lastSpokenIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!readRepliesAloud) return;
    const lastMessage = controller.messages[controller.messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return;
    if (lastSpokenIdRef.current === lastMessage.id) return;
    lastSpokenIdRef.current = lastMessage.id;
    speakText(lastMessage.content);
  }, [controller.messages, readRepliesAloud, speakText]);

  // A visitor who used voice mode earlier in this browser tab must still
  // explicitly choose it again here — `modeVocal` persists in sessionStorage,
  // so without this reset the assistant would start listening on arrival,
  // before "Commencer ma démarche" was ever clicked on this page.
  useEffect(() => {
    disableVoiceMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useVoicePage({
    readableText:
      "Vous êtes sur la page d'accueil de MonParcours. Choisissez d'être accompagné à l'oral ou par écrit, puis commencez votre démarche pour estimer votre aide au logement.",
    actions: [],
  });

  const handleStart = (mode: AssistMode) => {
    setAssistMode(mode);
    if (mode === 'voice') {
      enableVoiceMode();
    } else {
      disableVoiceMode();
    }
    setStarted(true);
  };

  /**
   * Leaves the embedded assistant and puts the landing page back.
   *
   * `/` renders the assistant in place instead of navigating, so browser Back
   * would leave the site entirely rather than close it — this is the only way
   * out, and without it a visitor who clicked the Mistral bubble was stuck.
   */
  const handleClose = () => {
    disableVoiceMode();
    stopSpeaking();
    setStarted(false);
  };

  // ── Consume queued questions from the voice assistant ─────────────
  const pendingQuestion = useChatbotUiStore((s) => s.pendingQuestion);
  const consumePendingQuestion = useChatbotUiStore((s) => s.consumePendingQuestion);

  useEffect(() => {
    if (pendingQuestion === null) return;
    const q = consumePendingQuestion();
    if (!q) return;
    // Ouvrir l'assistant en même temps qu'on lui parle : cette page n'a pas de
    // panneau flottant, la question partirait sinon derrière la page vitrine,
    // sans que rien à l'écran ne bouge. Vaut pour les boutons « assistant » des
    // cartes de service comme pour les questions posées à la voix.
    setStarted(true);
    controller.send(q);
  }, [pendingQuestion, consumePendingQuestion, controller]);

  return (
    <div className="citizen-scope flex min-h-screen flex-col bg-background font-sans">
      <SkipLink />
      <VoiceOnboardingDialog />
      <LandingHeader onBrandClick={started ? handleClose : undefined} />

      <main
        id="main-content"
        tabIndex={-1}
        className={cn('flex flex-1 flex-col focus:outline-none', started && 'assistant-backdrop')}
      >
        {started ? (
          /* `flex-1` en cascade jusqu'au composeur : la colonne occupe toute la
             hauteur laissée par l'en-tête, donc la barre de saisie tombe en bas
             de l'écran même quand rien n'a encore été demandé. */
          <div className="mx-auto flex w-full max-w-container flex-1 flex-col px-margin-mobile py-8 md:px-gutter">
            {/* Sur un fil vide, cette cale prend la moitié du vide restant —
                l'autre moitié revient au `flex-1` de la fenêtre de chat. Titre
                et amorces tombent donc au milieu de l'écran plutôt que collés
                sous l'en-tête. Dès le premier message, la cale disparaît et le
                fil reprend toute la hauteur, en partant du haut. */}
            {isEmptyThread && <div className="flex-1" aria-hidden="true" />}

            {/* Accroche d'ouverture, retirée dès la première question : elle
                invite à parler, et une fois la conversation lancée elle ne fait
                plus que voler de la hauteur au fil. `ChatWindow` porte son
                propre `h1` (lecteurs d'écran), la page ne reste donc jamais
                sans titre. Ni « Retour à l'accueil » ni croix de fermeture : la
                marque, en haut de barre, est la seule sortie. */}
            {isEmptyThread && (
              <div className="mb-6 text-center">
                {/* Décoratif : l'animation occupe la place que tenait la
                  mascotte dans l'état vide, mais au-dessus du titre, où elle
                  accompagne la question au lieu de la répéter. */}
              <img
                src="/chat_bleu.gif"
                alt=""
                aria-hidden="true"
                className="mx-auto mb-2 h-24 w-auto object-contain"
              />

              <h1 className="font-display text-headline-lg-mobile text-ink">
                  Comment pouvons-nous vous aider ?
                </h1>
                <p className="mx-auto mt-2 max-w-form text-muted-foreground">
                  Posez vos questions sur votre éligibilité, une démarche ou un document — sans
                  avoir besoin de créer de compte.
                </p>
              </div>
            )}
            <VoiceStatusStrip
              status={voiceStatus}
              transcript={transcript}
              error={voiceError}
              onStopSpeaking={stopSpeaking}
            />
            <ChatWindow
              controller={controller}
              variant="spotlight"
              onVoiceInput={toggleRecording}
              isRecording={isRecording}
            />
          </div>
        ) : (
          <>
            <LandingHero onStart={() => handleStart('text')} />
            <LandingStatsMarquee />
            <Reveal>
              <LandingServices />
            </Reveal>
            <Reveal>
              <LandingFeatures
                onStartChat={() => handleStart('text')}
                onStartVoice={() => handleStart('voice')}
              />
            </Reveal>
            <Reveal>
              <LandingInnovation />
            </Reveal>
            <Reveal>
              <LandingAI />
            </Reveal>
            <Reveal>
              <LandingTrust />
            </Reveal>
          </>
        )}
      </main>

      {/* Page d'accueil seulement : sous l'assistant, le pied de page annonçait
          une fin de page là où la conversation continue, et poussait la zone de
          saisie hors de l'écran à chaque nouveau message. */}
      {!started && <CitizenFooter />}

      {/* Hidden once the embedded assistant is showing: the Mistral bubble
          would then just re-trigger what is already on screen. */}
      <FloatingActionBubbles hidden={started} onAssistantClick={() => handleStart('text')} />
    </div>
  );
}
