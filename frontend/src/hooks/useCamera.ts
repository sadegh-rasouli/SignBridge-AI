/**
 * SignBridge AI - Camera Lifecycle Hook
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { CameraState } from '../types';

export function useCamera() {
  const [cameraState, setCameraState] = useState<CameraState>({
    isActive: false,
    isMirror: true,
    showLandmarks: true,
    deviceId: null,
    availableDevices: [],
    fps: 0,
    error: null
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(performance.now());

  // Enumerate video input devices
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput' && d.deviceId);
      setCameraState(prev => ({
        ...prev,
        availableDevices: videoDevices,
        deviceId: prev.deviceId && videoDevices.some(d => d.deviceId === prev.deviceId)
          ? prev.deviceId
          : (videoDevices[0]?.deviceId ?? null)
      }));
    } catch (err) {
      console.warn('Device enumeration failed:', err);
    }
  }, []);

  // Start Camera Stream with Multi-Stage Progressive Fallback
  const startCamera = useCallback(async (selectedDeviceId?: string) => {
    try {
      setCameraState(prev => ({ ...prev, error: null }));

      // 1. Verify Secure Context (HTTPS or localhost)
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!window.isSecureContext && !isLocalhost) {
        throw new Error(
          'HTTPS_REQUIRED: دسترسی به دوربین نیازمند پروتکل امن HTTPS است. لطفاً سایت را با https:// باز کنید یا گواهی SSL هاست را فعال نمایید.'
        );
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'MEDIA_DEVICES_UNSUPPORTED: مرورگر شما از دسترسی به دوربین پشتیبانی نمی‌کند یا دسترسی به دلیل ناامن بودن پروتکل (HTTP) غیرفعال شده است.'
        );
      }

      // Stop existing tracks if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const validDeviceId = (typeof selectedDeviceId === 'string' && selectedDeviceId.trim() !== '') ? selectedDeviceId.trim() : undefined;

      // Progressive Constraint Candidates (from highest quality to most compatible fallback)
      const constraintCandidates: MediaStreamConstraints[] = [
        // 1. Preferred HD 720p with ideal deviceId (never use 'exact' to avoid OverconstrainedError)
        {
          audio: false,
          video: {
            ...(validDeviceId ? { deviceId: { ideal: validDeviceId } } : {}),
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        },
        // 2. HD 720p without facingMode constraint (many Windows/USB/Virtual webcams fail on facingMode)
        {
          audio: false,
          video: {
            ...(validDeviceId ? { deviceId: { ideal: validDeviceId } } : {}),
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        },
        // 3. Standard 640x480 resolution
        {
          audio: false,
          video: {
            ...(validDeviceId ? { deviceId: { ideal: validDeviceId } } : {}),
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        },
        // 4. Any camera with the requested deviceId
        ...(validDeviceId ? [{
          audio: false,
          video: { deviceId: { ideal: validDeviceId } }
        }] : []),
        // 5. Ultimate fallback: completely unrestricted video stream (works on all webcams/browsers)
        {
          audio: false,
          video: true
        }
      ];

      let stream: MediaStream | null = null;
      let lastError: any = null;

      for (const constraints of constraintCandidates) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (candidateErr: any) {
          lastError = candidateErr;
          console.warn('Camera constraint candidate failed, falling back:', constraints, candidateErr);
          // If permission was denied by user, stop immediately
          if (candidateErr.name === 'NotAllowedError' || candidateErr.name === 'PermissionDeniedError') {
            throw candidateErr;
          }
        }
      }

      if (!stream) {
        throw lastError || new Error('امکان اتصال به دوربین با هیچ‌یک از تنظیمات وجود نداشت.');
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video playback was delayed or requires user gesture:', playErr);
        }
      }

      // Read active track settings to determine active device ID
      const activeTrack = stream.getVideoTracks()[0];
      const activeDeviceId = activeTrack?.getSettings()?.deviceId || validDeviceId || null;

      setCameraState(prev => ({
        ...prev,
        isActive: true,
        deviceId: activeDeviceId || prev.deviceId,
        error: null
      }));

      await refreshDevices();
    } catch (err: any) {
      let errorMessage = 'Failed to access camera.';
      if (err.message && err.message.startsWith('HTTPS_REQUIRED:')) {
        errorMessage = 'مرورگرها به دلایل امنیتی دسترسی به دوربین را روی HTTP مسدود می‌کنند. لطفاً آدرس را با https:// باز کنید یا SSL هاست را فعال کنید.';
      } else if (err.message && err.message.startsWith('MEDIA_DEVICES_UNSUPPORTED:')) {
        errorMessage = 'دسترسی به دوربین در این محیط مجاز نیست. لطفاً از اتصال امن HTTPS استفاده کنید.';
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'دسترسی به دوربین توسط مرورگر رد شد. لطفاً روی آیکون قفل/تنظیمات کنار آدرس‌بار کلیک کرده و اجازه دسترسی (Camera: Allow) را فعال کنید.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'هیچ دوربینی روی سیستم یا دستگاه شما یافت نشد.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'دوربین در حال حاضر توسط برنامه دیگری (مثل تلگرام، زوم یا مرورگر دیگر) در حال استفاده است.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'رزولوشن یا تنظیمات دوربین توسط دستگاه پشتیبانی نمی‌شود.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setCameraState(prev => ({
        ...prev,
        isActive: false,
        error: errorMessage
      }));
    }
  }, [refreshDevices]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState(prev => ({
      ...prev,
      isActive: false,
      fps: 0
    }));
  }, []);

  // Toggle Camera Mirror
  const toggleMirror = useCallback(() => {
    setCameraState(prev => ({ ...prev, isMirror: !prev.isMirror }));
  }, []);

  // Toggle Landmark Visual Overlay
  const toggleLandmarks = useCallback(() => {
    setCameraState(prev => ({ ...prev, showLandmarks: !prev.showLandmarks }));
  }, []);

  // Change Device
  const switchDevice = useCallback((deviceId: string) => {
    startCamera(deviceId);
  }, [startCamera]);

  // Record a processed frame for FPS calculation
  const tickFrame = useCallback(() => {
    frameCountRef.current++;
    const now = performance.now();
    const elapsed = now - lastFpsUpdateRef.current;
    if (elapsed >= 1000) {
      const calculatedFps = Math.round((frameCountRef.current * 1000) / elapsed);
      setCameraState(prev => ({ ...prev, fps: calculatedFps }));
      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;
    }
  }, []);

  useEffect(() => {
    refreshDevices();
    return () => {
      stopCamera();
    };
  }, [refreshDevices, stopCamera]);

  return {
    videoRef,
    cameraState,
    startCamera,
    stopCamera,
    toggleMirror,
    toggleLandmarks,
    switchDevice,
    tickFrame
  };
}
