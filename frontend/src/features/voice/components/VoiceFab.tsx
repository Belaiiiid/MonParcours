import { Mic } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { ROUTES } from '@/app/router/paths';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useChatbotUiStore } from '@/features/chatbot/store/chatbotUiStore';
import { useVoiceUiStore } from '@/features/voice/store/voiceUiStore';

/**
 * Floating mic button to toggle the standalone voice panel.
 * Hidden when the chat widget is open, on /chat route, or when the panel is open.
 */
export function VoiceFab({ className }: { className?: string }) {
  const location = useLocation();
  const chatOpen = useChatbotUiStore((s) => s.isOpen);
  const { isOpen, toggle } = useVoiceUiStore();

  const isChatRoute = location.pathname === ROUTES.chat;
  const hidden = chatOpen || isChatRoute || isOpen;

  if (hidden) return null;

  return (
    <div className={cn('fixed bottom-5 right-5 z-50', className)}>
      <Button size="icon" aria-label="Ouvrir l’assistant vocal" onClick={toggle} className="shadow-soft">
        <Mic aria-hidden="true" />
      </Button>
    </div>
  );
}
