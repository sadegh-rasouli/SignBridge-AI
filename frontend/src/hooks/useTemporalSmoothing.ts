/**
 * SignBridge AI - Temporal Smoothing & Gesture State Machine Hook
 * Prevents frame flicker, averages probabilities across sliding window,
 * and eliminates duplicate token repeats while holding a sign.
 */

import { useState, useRef, useCallback } from 'react';
import { LandmarkPoint, PredictionResult, GestureState } from '../types';
import { ClientModelEngine } from '../services/clientModelEngine';

interface TemporalSmoothingOptions {
  windowSize?: number;         // Number of frames in sliding buffer (default: 8)
  confidenceThreshold?: number; // Minimum confidence to accept token (default: 0.75)
  consistencyRatio?: number;    // % of frames in buffer required to agree (default: 0.75)
  cooldownMs?: number;          // Debounce delay before allowing same token again (default: 1000ms)
}

export function useTemporalSmoothing(
  onTokenEmitted: (token: string, confidence: number) => void,
  options: TemporalSmoothingOptions = {}
) {
  const {
    windowSize = 8,
    confidenceThreshold = 0.75,
    consistencyRatio = 0.75,
    cooldownMs = 1000
  } = options;

  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult>({
    sign: 'IDLE',
    rawPrediction: 'IDLE',
    confidence: 0,
    isConfident: false,
    topPredictions: []
  });

  const [gestureState, setGestureState] = useState<GestureState>('IDLE');

  const slidingWindowRef = useRef<PredictionResult[]>([]);
  const lastEmittedTokenRef = useRef<string | null>(null);
  const lastEmitTimeRef = useRef<number>(0);
  const stateRef = useRef<GestureState>('IDLE');

  const processFrameLandmarks = useCallback((landmarks: LandmarkPoint[] | null) => {
    const engine = ClientModelEngine.getInstance();

    if (!landmarks || landmarks.length !== 21) {
      // Hand lost or absent
      slidingWindowRef.current = [];
      stateRef.current = 'IDLE';
      setGestureState('IDLE');
      setCurrentPrediction({
        sign: 'NO_HAND',
        rawPrediction: 'NO_HAND',
        confidence: 0,
        isConfident: false,
        topPredictions: []
      });
      return;
    }

    // Run high-speed client-side neural prediction
    const prediction = engine.predict(landmarks, confidenceThreshold);
    setCurrentPrediction(prediction);

    // Push into sliding window buffer
    const windowBuffer = slidingWindowRef.current;
    windowBuffer.push(prediction);
    if (windowBuffer.length > windowSize) {
      windowBuffer.shift();
    }

    // Check if buffer is sufficiently full
    if (windowBuffer.length < Math.floor(windowSize * 0.75)) {
      return;
    }

    // Count frequency of confident predictions in sliding window
    const counts: Record<string, { count: number; totalConf: number }> = {};
    let validFrames = 0;

    for (const item of windowBuffer) {
      if (item.isConfident && item.sign !== 'UNCERTAIN' && item.sign !== 'NEUTRAL') {
        validFrames++;
        if (!counts[item.sign]) {
          counts[item.sign] = { count: 0, totalConf: 0 };
        }
        counts[item.sign].count++;
        counts[item.sign].totalConf += item.confidence;
      }
    }

    if (validFrames === 0) {
      stateRef.current = 'IDLE';
      setGestureState('IDLE');
      return;
    }

    // Find dominant class in window
    let dominantSign = '';
    let maxCount = 0;
    let avgConfidence = 0;

    for (const [sign, data] of Object.entries(counts)) {
      if (data.count > maxCount) {
        maxCount = data.count;
        dominantSign = sign;
        avgConfidence = data.totalConf / data.count;
      }
    }

    const requiredAgreement = Math.ceil(windowBuffer.length * consistencyRatio);
    const now = performance.now();

    // Check if gesture reached consensus in buffer
    if (dominantSign && maxCount >= requiredAgreement && avgConfidence >= confidenceThreshold) {
      const isSameAsLastEmitted = dominantSign === lastEmittedTokenRef.current;
      const cooldownElapsed = (now - lastEmitTimeRef.current) >= cooldownMs;

      if (!isSameAsLastEmitted || cooldownElapsed) {
        // COMMIT NEW TOKEN
        stateRef.current = 'COMMITTED';
        setGestureState('COMMITTED');

        lastEmittedTokenRef.current = dominantSign;
        lastEmitTimeRef.current = now;

        onTokenEmitted(dominantSign, Number(avgConfidence.toFixed(3)));

        // Transition to Cooldown
        setTimeout(() => {
          if (stateRef.current === 'COMMITTED') {
            stateRef.current = 'COOLDOWN';
            setGestureState('COOLDOWN');
          }
        }, 300);
      } else {
        // In cooldown while holding same gesture
        stateRef.current = 'COOLDOWN';
        setGestureState('COOLDOWN');
      }
    } else {
      stateRef.current = 'DETECTING';
      setGestureState('DETECTING');
    }
  }, [confidenceThreshold, consistencyRatio, cooldownMs, onTokenEmitted, windowSize]);

  const resetBuffer = useCallback(() => {
    slidingWindowRef.current = [];
    lastEmittedTokenRef.current = null;
    lastEmitTimeRef.current = 0;
    stateRef.current = 'IDLE';
    setGestureState('IDLE');
  }, []);

  return {
    currentPrediction,
    gestureState,
    processFrameLandmarks,
    resetBuffer
  };
}
