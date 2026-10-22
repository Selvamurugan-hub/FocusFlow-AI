// Web Speech API Types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export type SpeechAssistantState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface SpeechRecognitionHandlers {
  onResult: (transcript: string) => void;
  onError: (error: string) => void;
  onStateChange: (state: SpeechAssistantState) => void;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined';
}

export class SpeechManager {
  private recognition: any = null;
  private isListening = false;
  private voiceEnabled = true;

  constructor(private handlers: SpeechRecognitionHandlers) {
    this.initRecognition();
  }

  private initRecognition() {
    if (!isSpeechRecognitionSupported()) return;

    try {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.handlers.onStateChange('listening');
      };

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript || '';
        if (transcript.trim()) {
          this.handlers.onResult(transcript.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        let errMsg = 'Speech recognition error';
        if (event.error === 'not-allowed') {
          errMsg = 'Microphone permission denied. Please allow microphone access in your browser.';
        } else if (event.error === 'no-speech') {
          errMsg = 'No speech detected. Please try speaking again.';
        } else if (event.error === 'network') {
          errMsg = 'Network error during speech recognition.';
        }
        this.handlers.onError(errMsg);
        this.handlers.onStateChange('idle');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.handlers.onStateChange('idle');
      };
    } catch (err) {
      console.warn('[FocusFlow Speech] Recognition initialization error', err);
    }
  }

  public startListening(): boolean {
    if (!this.recognition) {
      this.handlers.onError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or text input.');
      return false;
    }

    try {
      if (this.isListening) {
        this.recognition.stop();
        this.isListening = false;
        this.handlers.onStateChange('idle');
        return false;
      }

      // Stop any active speech synthesis before listening
      if (isSpeechSynthesisSupported()) {
        window.speechSynthesis.cancel();
      }

      this.recognition.start();
      return true;
    } catch (err) {
      console.error('[FocusFlow Speech] Failed to start listening', err);
      this.handlers.onError('Could not start microphone. Click again or use text input.');
      this.handlers.onStateChange('idle');
      return false;
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore
      }
      this.isListening = false;
      this.handlers.onStateChange('idle');
    }
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
    if (!enabled && isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  public speak(text: string, onDone?: () => void) {
    if (!this.voiceEnabled || !isSpeechSynthesisSupported()) {
      if (onDone) onDone();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      // Clean markdown tags from speech text
      const cleanText = text
        .replace(/[*_#`~[\]]/g, '')
        .replace(/\((?:https?:\/\/[^\s)]+|file:\/\/[^\s)]+)\)/g, '')
        .trim();

      if (!cleanText) {
        if (onDone) onDone();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-US';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Prefer a natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => 
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Jenny')) &&
        v.lang.startsWith('en')
      );
      if (preferred) {
        utterance.voice = preferred;
      }

      this.handlers.onStateChange('speaking');

      utterance.onend = () => {
        this.handlers.onStateChange('idle');
        if (onDone) onDone();
      };

      utterance.onerror = () => {
        this.handlers.onStateChange('idle');
        if (onDone) onDone();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[FocusFlow Speech] Speech synthesis error', e);
      this.handlers.onStateChange('idle');
      if (onDone) onDone();
    }
  }
}
