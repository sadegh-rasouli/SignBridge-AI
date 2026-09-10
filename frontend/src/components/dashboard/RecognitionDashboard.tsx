/**
 * SignBridge AI - Main Recognition Dashboard Component
 * Enhanced with Gesture Synthesizer Quick-Bar, Keyboard Shortcuts, and Auditory Feedback.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { CameraContainer } from './CameraContainer';
import { LivePredictionCard } from './LivePredictionCard';
import { SentenceBuilderPanel } from './SentenceBuilderPanel';
import { ControlsToolbar } from './ControlsToolbar';

import { useCamera } from '../../hooks/useCamera';
import { useMediaPipeHands } from '../../hooks/useMediaPipeHands';
import { useTemporalSmoothing } from '../../hooks/useTemporalSmoothing';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { soundEffects } from '../../services/soundEffects';
import { SIMULATED_POSES } from '../../services/gestureSimulator';
import { LandmarkPoint } from '../../types';
import { Sparkles, Keyboard, Volume2, VolumeX } from 'lucide-react';

export const RecognitionDashboard: React.FC = () => {
  // Sentence state
  const [tokens, setTokens] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.75);
  const [cooldownMs, setCooldownMs] = useState<number>(1000);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);

  // Text-To-Speech hook
  const {
    settings: speechSettings,
    availableVoices,
    isSpeaking,
    speak,
    stop: stopSpeak,
    updateSettings: updateSpeechSettings
  } = useTextToSpeech();

  // Handle Token Emission from Temporal State Machine
  const handleTokenEmitted = useCallback((token: string, _confidence: number) => {
    if (isPaused) return;

    // Play subtle auditory confirmation chime for accessibility
    soundEffects.playTokenCommittedTone();

    setTokens(prev => {
      const next = [...prev, token];
      return next;
    });
  }, [isPaused]);

  // Temporal Smoothing Hook
  const {
    currentPrediction,
    gestureState,
    processFrameLandmarks,
    resetBuffer
  } = useTemporalSmoothing(handleTokenEmitted, {
    confidenceThreshold,
    cooldownMs,
    windowSize: 8,
    consistencyRatio: 0.75
  });

  // Camera Lifecycle Hook
  const {
    videoRef,
    cameraState,
    startCamera,
    stopCamera,
    toggleMirror,
    toggleLandmarks,
    switchDevice,
    tickFrame
  } = useCamera();

  // MediaPipe Hands Extraction Hook
  const handleLandmarksDetected = useCallback((landmarks: LandmarkPoint[] | null) => {
    if (!isPaused && !simulationActive) {
      processFrameLandmarks(landmarks);
    }
  }, [isPaused, processFrameLandmarks, simulationActive]);

  const { canvasRef, isHandDetected } = useMediaPipeHands(
    videoRef,
    cameraState.isActive,
    cameraState.showLandmarks,
    cameraState.isMirror,
    tickFrame,
    handleLandmarksDetected
  );

  // Format tokens into natural English sentence
  const formattedSentence = React.useMemo(() => {
    if (tokens.length === 0) return '';
    const words = tokens.map((tok, i) => {
      const lower = tok.toLowerCase().replace(/_/g, ' ');
      if (i === 0) return lower.charAt(0).toUpperCase() + lower.slice(1);
      return lower;
    });
    return words.join(' ') + '.';
  }, [tokens]);

  // Sentence manipulation handlers
  const handleSpeak = useCallback(() => {
    if (formattedSentence) {
      speak(formattedSentence);
    }
  }, [formattedSentence, speak]);

  const handleUndo = useCallback(() => {
    soundEffects.playActionTone();
    setTokens(prev => prev.slice(0, -1));
  }, []);

  const handleDeleteLastWord = useCallback(() => {
    soundEffects.playActionTone();
    setTokens(prev => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    soundEffects.playActionTone();
    setTokens([]);
    resetBuffer();
    stopSpeak();
  }, [resetBuffer, stopSpeak]);

  const handleTogglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const handleToggleAudioMute = () => {
    setIsAudioMuted(prev => {
      const next = !prev;
      soundEffects.setMuted(next);
      return next;
    });
  };

  // Simulate an anatomical ASL gesture instantly
  const handleSimulateGesture = (signKey: string) => {
    const landmarks = SIMULATED_POSES[signKey];
    if (!landmarks) return;

    setSimulationActive(true);
    // Feed 10 consecutive frames into the sliding window to trigger state machine consensus
    for (let i = 0; i < 9; i++) {
      processFrameLandmarks(landmarks);
    }
    setTimeout(() => {
      setSimulationActive(false);
    }, 400);
  };

  // Keyboard Shortcuts for Accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleSpeak();
      } else if (e.key === 'u' || e.key === 'U') {
        handleUndo();
      } else if (e.key === 'c' || e.key === 'C') {
        handleClear();
      } else if (e.key === 'p' || e.key === 'P') {
        handleTogglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear, handleSpeak, handleTogglePause, handleUndo]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Quick Gesture Simulator Bar (Demo Mode for Reviewers & Users without Camera) */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} color="var(--accent-secondary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Quick Gesture Simulator (Instant Landmark Testing):
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {Object.keys(SIMULATED_POSES).map((signKey) => (
            <button
              key={signKey}
              onClick={() => handleSimulateGesture(signKey)}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}
              title={`Simulate 3D landmark pattern for ${signKey}`}
            >
              +{signKey}
            </button>
          ))}
        </div>
      </div>

      {/* Top Main Grid */}
      <div className="dashboard-grid">
        {/* Left Column: Camera View */}
        <CameraContainer
          videoRef={videoRef}
          canvasRef={canvasRef}
          cameraState={cameraState}
          gestureState={gestureState}
          isHandDetected={isHandDetected}
          onStartCamera={startCamera}
          onStopCamera={stopCamera}
          onToggleMirror={toggleMirror}
          onToggleLandmarks={toggleLandmarks}
          onSwitchDevice={switchDevice}
        />

        {/* Right Column: HUD Prediction & Sentence Builder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <LivePredictionCard
            prediction={currentPrediction}
            gestureState={gestureState}
            confidenceThreshold={confidenceThreshold}
          />

          <SentenceBuilderPanel
            tokens={tokens}
            formattedSentence={formattedSentence}
            isSpeaking={isSpeaking}
            isPaused={isPaused}
            onSpeak={handleSpeak}
            onStopSpeak={stopSpeak}
            onUndo={handleUndo}
            onDeleteLastWord={handleDeleteLastWord}
            onClear={handleClear}
            onTogglePause={handleTogglePause}
          />
        </div>
      </div>

      {/* Accessibility Shortcuts & Sound Info Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '0.75rem 1.25rem',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
            <Keyboard size={15} />
            <strong>Keyboard Shortcuts:</strong>
          </span>
          <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: '4px' }}>Space</kbd> Speak</span>
          <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: '4px' }}>U</kbd> Undo</span>
          <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: '4px' }}>C</kbd> Clear</span>
          <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: '4px' }}>P</kbd> Pause</span>
        </div>

        <button
          onClick={handleToggleAudioMute}
          className="btn btn-secondary"
          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
          title="Toggle audio feedback chimes"
        >
          {isAudioMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          <span>Audio Cues: {isAudioMuted ? 'Off' : 'On'}</span>
        </button>
      </div>

      {/* Bottom Parameter Controls Toolbar */}
      <ControlsToolbar
        confidenceThreshold={confidenceThreshold}
        onConfidenceChange={setConfidenceThreshold}
        cooldownMs={cooldownMs}
        onCooldownChange={setCooldownMs}
        speechSettings={speechSettings}
        availableVoices={availableVoices}
        onSpeechSettingsChange={updateSpeechSettings}
      />
    </div>
  );
};
