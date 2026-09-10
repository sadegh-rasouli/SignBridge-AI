/**
 * SignBridge AI - Speech Synthesis (TTS) Hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SpeechSettings } from '../types';

export function useTextToSpeech() {
  const [settings, setSettings] = useState<SpeechSettings>({
    rate: 1.0,
    pitch: 1.0,
    voice: null,
    autoSpeak: false
  });

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load browser speech synthesis voices
  const populateVoices = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      setAvailableVoices(voices);

      // Prefer high-quality English voice by default
      const defaultVoice =
        voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium'))) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0];

      setSettings(prev => ({
        ...prev,
        voice: prev.voice || defaultVoice || null
      }));
    }
  }, []);

  useEffect(() => {
    populateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
  }, [populateVoices]);

  // Speak text
  const speak = useCallback((text: string) => {
    if (!text || !text.trim() || !isSupported) return;

    // Stop current speech if running
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    if (settings.voice) {
      utterance.voice = settings.voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis Error:', e);
      setIsSpeaking(false);
    };

    activeUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, settings]);

  // Stop speech
  const stop = useCallback(() => {
    if (isSupported && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  // Update Settings
  const updateSettings = useCallback((newSettings: Partial<SpeechSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
    settings,
    availableVoices,
    isSpeaking,
    isSupported,
    speak,
    stop,
    updateSettings
  };
}
