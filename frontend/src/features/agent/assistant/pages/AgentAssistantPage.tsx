import { BookOpen, FileSearch, MessageSquare, Scale, ShieldCheck } from 'lucide-react';

import { AgentPage } from '@/features/agent/components';
import { ChatWindow } from '@/features/chatbot/components/ChatWindow';
import { useChatbot } from '@/features/chatbot/hooks/useChatbot';

/**
 * Amorces proposées sur un fil vide.
 *
 * Formulées comme les deux tâches pour lesquelles cet assistant existe —
 * recherche réglementaire et synthèse de dossier — plutôt qu'en questions
 * génériques : un agent arrive avec un dossier ouvert, pas avec une page
 * blanche.
 */
const STARTER_QUESTIONS = [
  'Rechercher un texte réglementaire',
  'Synthétiser un dossier en cours d’instruction',
  'Expliquer la motivation d’une décision',
];

/** Leurs pictogrammes, dans le même ordre — voir `ChatWindowProps.starterIcons`. */
const STARTER_ICONS = [Scale, FileSearch, BookOpen];

/**
 * Assistant du poste d'instruction.
 *
 * Même fenêtre que l'assistant citoyen — `ChatWindow` et `useChatbot`, sans
 * copie ni variante : une seule surface de conversation dans le produit, donc
 * un seul endroit où corriger un défaut de rendu, de clavier ou de lecture
 * d'écran.
 *
 * La page était jusqu'ici une maquette : un panneau d'accueil décoratif et un
 * composeur désactivé, faute de service conversationnel agent. Elle est
 * désormais branchée sur le même transport que le citoyen. Le corpus, le ton
 * et les droits restent une affaire de service : le jour où un client agent
 * dédié arrive, il se substitue à `useChatbot` ici et rien d'autre ne bouge.
 */
export default function AgentAssistantPage() {
  const controller = useChatbot();

  return (
    <AgentPage
      title="Assistant IA"
      description="Recherche réglementaire et synthèse de dossiers."
      // Plein écran, comme « Aide IA » côté citoyen : la page prend la hauteur
      // que lui laisse la coque et ne défile pas, seul le fil des messages le
      // fait.
      fill
    >
      {/* Même fenêtre que les autres assistants (`spotlight`), mais sur les
          surfaces du poste d'instruction : `.agent-assistant` redéclare les
          jetons `--chat-*` — cartes blanches, filets bleu pâle, envoi d'un
          seul bleu — sans qu'aucun composant soit dupliqué.

          `max-w-3xl` et non `4xl` : trois amorces et une barre de saisie sur
          896px s'étalaient en largeur d'affiche. La colonne se resserre, le
          panneau cesse d'être un décor et redevient un plan de travail. */}
      <div className="agent-assistant agent-assistant-backdrop -mx-margin-mobile flex min-h-0 flex-1 flex-col px-margin-mobile md:-mx-gutter md:px-gutter">
        <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col">
          <ChatWindow
            controller={controller}
            fill
            variant="spotlight"
            starterQuestions={STARTER_QUESTIONS}
            starterIcons={STARTER_ICONS}
            starterTitle="Comment puis-je vous aider ?"
            starterLead="Je peux rechercher une réglementation, synthétiser un dossier ou expliquer une décision."
            starterLayout="row"
            starterMascotSrc="/chat_bleu.gif"
            composerIcon={MessageSquare}
            disclaimerIcon={ShieldCheck}
            composerPlaceholder="Poser une question réglementaire ou demander une synthèse…"
          />
        </div>
      </div>
    </AgentPage>
  );
}
