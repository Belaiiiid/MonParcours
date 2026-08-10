import { createPortal } from 'react-dom';

import { BubbleButton } from '@/features/chatbot/components/FloatingActionBubbles';
import { useChatbotUiStore } from '@/features/chatbot/store/chatbotUiStore';

/**
 * Le lanceur de l'assistant, en bas à droite des écrans d'instruction.
 *
 * Exactement la bulle de l'accueil public — même `BubbleButton`, donc même
 * diamètre, même mascotte Mistral, même infobulle et même grossissement au
 * survol. Seul le contexte change : `FloatingActionBubbles` empile trois
 * bulles, dont WhatsApp et l'assistant vocal, sans objet depuis un poste
 * d'instruction. Ne reste que celle qui ouvre l'assistant.
 *
 * `FloatingChatbot` ne rend que le panneau ; c'est ce bouton qui le bascule,
 * via le même `chatbotUiStore`. Masqué pendant que le panneau est ouvert :
 * celui-ci a son propre bouton de fermeture, et la bulle se retrouverait
 * juste derrière lui.
 */
export function AgentAssistantBubble() {
  const isOpen = useChatbotUiStore((state) => state.isOpen);
  const toggle = useChatbotUiStore((state) => state.toggle);

  if (isOpen) return null;

  /*
   * Montee sur `document.body`, pas dans la coque.
   *
   * `AppShell` enferme le back-office dans un conteneur en `h-[100dvh]
   * overflow-hidden` — l'ecran ne defile pas. Un `position: fixed` s'en
   * echappe tant qu'aucun ancetre ne cree de bloc conteneur, mais la
   * moindre `transform`, `filter` ou `backdrop-filter` ajoutee un jour a
   * l'un d'eux rognerait la bulle sans prevenir, et le defaut serait
   * invisible a la relecture. Le portail retire la question.
   */
  return createPortal(
    <div className="fixed bottom-6 right-6 z-50">
      <BubbleButton
        id="assistant-launcher-bubble"
        label="Parler à l’assistant"
        iconSrc="/logos/mistral.gif"
        onClick={toggle}
        size="size-16"
        className="border border-border bg-white"
      />
    </div>,
    document.body,
  );
}
