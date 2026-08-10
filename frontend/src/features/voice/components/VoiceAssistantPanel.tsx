import { Mic, Square, X } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { VoiceStatusStrip } from '@/features/voice/components/VoiceStatusStrip';
import { useVoiceAssistant } from '@/features/voice/components/VoiceAssistantProvider';
import { useVoiceUiStore } from '@/features/voice/store/voiceUiStore';

/**
 * Standalone floating voice assistant panel (restored).
 * Uses the existing voice provider stack; no chat widget changes.
 */
export function VoiceAssistantPanel({ className }: { className?: string }) {
  const { isOpen, close } = useVoiceUiStore();
  const {
    status,
    transcript,
    error,
    startPushToTalk,
    stopPushToTalk,
    stopSpeaking,
  } = useVoiceAssistant();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        // Stop any ongoing capture/tts when closing
        stopPushToTalk();
        stopSpeaking();
        close();
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true } as any);
  }, [isOpen, close, stopPushToTalk, stopSpeaking]);

  if (!isOpen) return null;

  const handleClose = () => {
    stopPushToTalk();
    stopSpeaking();
    close();
  };

  const isListening = status === 'listening';
  const isSpeaking = status === 'speaking';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Assistant vocal"
      className={cn(
        'fixed bottom-5 right-5 z-50 w-[min(92vw,360px)] rounded-2xl border border-border/60 bg-surface-lowest shadow-soft',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-2">
        <p className="font-display text-label-md text-on-surface">Assistant vocal</p>
        <Button variant="ghost" size="icon" aria-label="Fermer" onClick={handleClose}>
          <X aria-hidden="true" />
        </Button>
      </div>

      <div className="px-4 py-3">
        <VoiceStatusStrip status={status} transcript={transcript} error={error} onStopSpeaking={stopSpeaking} />

        {transcript && (
          <p className="mt-2 rounded-md bg-surface-low p-2 text-body-sm text-on-surface-variant">
            « {transcript} »
          </p>
        )}

        {error && (
          <p role="alert" className="mt-2 text-body-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-3 flex gap-2">
          {isListening ? (
            <Button onClick={stopPushToTalk} className="gap-2">
              <Square className="size-4" aria-hidden="true" />
              Arrêter
            </Button>
          ) : (
            <Button onClick={() => startPushToTalk()} className="gap-2">
              <Mic className="size-4" aria-hidden="true" />
              Parler
            </Button>
          )}
          {isSpeaking && (
            <Button variant="outline" onClick={stopSpeaking} className="gap-2">
              <Square className="size-4" aria-hidden="true" />
              Stop voix
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
