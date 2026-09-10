/**
 * SignBridge AI - MediaPipe Hands Landmark Extraction & Canvas Renderer Hook
 */

import { useEffect, useRef, useState } from 'react';
import { LandmarkPoint } from '../types';

// Declare MediaPipe globals loaded from CDN in index.html
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

// 21 Hand Landmark skeletal bone connections
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],        // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],        // Index
  [0, 9], [9, 10], [10, 11], [11, 12],   // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17]              // Palm base
];

export function useMediaPipeHands(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isCameraActive: boolean,
  showLandmarks: boolean,
  isMirror: boolean,
  onFrameTick: () => void,
  onLandmarksDetected: (landmarks: LandmarkPoint[] | null) => void
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handsInstanceRef = useRef<any>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isHandDetected, setIsHandDetected] = useState(false);

  // Initialize MediaPipe Hands
  useEffect(() => {
    let checkInterval: any = null;

    const initMediaPipe = () => {
      if (typeof window.Hands === 'undefined') return;

      try {
        const hands = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.65,
          minTrackingConfidence: 0.60
        });

        hands.onResults((results: any) => {
          onFrameTick();

          const canvas = canvasRef.current;
          const video = videoRef.current;
          if (!canvas || !video) return;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Match canvas dimensions to video aspect
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const rawLms = results.multiHandLandmarks[0];
            const landmarks: LandmarkPoint[] = rawLms.map((lm: any) => ({
              x: lm.x,
              y: lm.y,
              z: lm.z
            }));

            setIsHandDetected(true);
            onLandmarksDetected(landmarks);

            // Draw landmark skeleton if enabled
            if (showLandmarks) {
              drawSkeleton(ctx, rawLms, canvas.width, canvas.height, isMirror);
            }
          } else {
            setIsHandDetected(false);
            onLandmarksDetected(null);
          }
        });

        handsInstanceRef.current = hands;
        setIsReady(true);
        if (checkInterval) clearInterval(checkInterval);
      } catch (e) {
        console.warn('MediaPipe initialization warning:', e);
      }
    };

    if (typeof window.Hands !== 'undefined') {
      initMediaPipe();
    } else {
      checkInterval = setInterval(() => {
        if (typeof window.Hands !== 'undefined') {
          initMediaPipe();
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (handsInstanceRef.current) {
        handsInstanceRef.current.close();
      }
    };
  }, [onFrameTick, onLandmarksDetected, showLandmarks, isMirror, videoRef]);

  // Frame processing loop
  useEffect(() => {
    let isActiveLoop = true;

    const processFrame = async () => {
      if (!isActiveLoop) return;

      const video = videoRef.current;
      const hands = handsInstanceRef.current;

      if (isCameraActive && video && video.readyState >= 2 && hands) {
        try {
          await hands.send({ image: video });
        } catch (err) {
          // Frame drop protection
        }
      }

      if (isCameraActive) {
        animationFrameIdRef.current = requestAnimationFrame(processFrame);
      }
    };

    if (isCameraActive && isReady) {
      animationFrameIdRef.current = requestAnimationFrame(processFrame);
    }

    return () => {
      isActiveLoop = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isCameraActive, isReady, videoRef]);

  // Visual skeleton drawing function
  const drawSkeleton = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number,
    mirror: boolean
  ) => {
    ctx.save();
    if (mirror) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // 1. Draw Bones / Connections
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#6366F1'; // Indigo connection line
    ctx.shadowColor = '#4F46E5';
    ctx.shadowBlur = 8;

    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];
      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    }

    // 2. Draw Landmark Joints
    const fingertipIndices = new Set([4, 8, 12, 16, 20]);

    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      const cx = lm.x * width;
      const cy = lm.y * height;
      const isTip = fingertipIndices.has(i);

      ctx.beginPath();
      ctx.arc(cx, cy, isTip ? 6 : 4, 0, 2 * Math.PI);

      if (isTip) {
        ctx.fillStyle = '#10B981'; // Emerald fingertip
        ctx.shadowColor = '#10B981';
      } else if (i === 0) {
        ctx.fillStyle = '#F59E0B'; // Amber wrist root
        ctx.shadowColor = '#F59E0B';
      } else {
        ctx.fillStyle = '#38BDF8'; // Sky blue joints
        ctx.shadowColor = '#38BDF8';
      }

      ctx.shadowBlur = 10;
      ctx.fill();

      // Joint white center dot
      ctx.beginPath();
      ctx.arc(cx, cy, isTip ? 2.5 : 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }

    ctx.restore();
  };

  return {
    canvasRef,
    isReady,
    isHandDetected
  };
}
