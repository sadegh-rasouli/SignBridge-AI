/**
 * SignBridge AI - Camera Container with Landmark Canvas & HUD
 */

import React from 'react';
import { Camera, CameraOff, FlipHorizontal, Eye, EyeOff, AlertTriangle, RefreshCw, Video } from 'lucide-react';
import { CameraState, GestureState } from '../../types';

interface CameraContainerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraState: CameraState;
  gestureState: GestureState;
  isHandDetected: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onToggleMirror: () => void;
  onToggleLandmarks: () => void;
  onSwitchDevice: (deviceId: string) => void;
}

export const CameraContainer: React.FC<CameraContainerProps> = ({
  videoRef,
  canvasRef,
  cameraState,
  gestureState,
  isHandDetected,
  onStartCamera,
  onStopCamera,
  onToggleMirror,
  onToggleLandmarks,
  onSwitchDevice
}) => {
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const isInsecureRemote = typeof window !== 'undefined' && !window.isSecureContext && !isLocalhost;

  return (
    <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* HTTPS Warning Ribbon if deployed on non-HTTPS host */}
      {isInsecureRemote && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: 'var(--radius-md)',
          color: '#FCD34D',
          fontSize: '0.85rem',
          lineHeight: 1.5
        }}>
          <AlertTriangle size={20} color="#F59E0B" style={{ flexShrink: 0 }} />
          <div>
            <strong>نیاز به پروتکل امن HTTPS:</strong> مرورگرها به دلایل امنیتی فقط روی اتصال <code>https://</code> یا <code>localhost</code> اجازه فعال‌سازی وب‌کم را می‌دهند. اگر روی هاست هستید، لطفاً گواهی SSL را فعال کنید یا با <code>https://</code> وارد شوید.
          </div>
        </div>
      )}

      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Video size={18} color="var(--text-accent)" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Live Camera Input</h2>
        </div>

        {/* Dynamic Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {cameraState.isActive && (
            <>
              <div className="badge badge-live">
                <span className="pulse-dot" />
                <span>{cameraState.fps} FPS</span>
              </div>

              <div className={`badge ${
                gestureState === 'COMMITTED' ? 'badge-live' :
                gestureState === 'DETECTING' ? 'badge-detecting' :
                gestureState === 'COOLDOWN' ? 'badge-idle' :
                isHandDetected ? 'badge-live' : 'badge-idle'
              }`}>
                <span>
                  {gestureState === 'COMMITTED' ? '● RECOGNIZED' :
                   gestureState === 'DETECTING' ? '● DETECTING...' :
                   gestureState === 'COOLDOWN' ? '● COOLDOWN' :
                   isHandDetected ? '● HAND TRACKED' : '○ WAITING FOR HAND'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Video Preview Container */}
      <div className="camera-wrapper">
        <video
          ref={videoRef}
          className={`camera-video ${cameraState.isMirror ? 'mirror' : ''}`}
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="camera-canvas" />

        {/* Fallback Screen when Camera is Off */}
        {!cameraState.isActive && !cameraState.error && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            backgroundColor: 'rgba(11, 15, 25, 0.92)',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Camera size={32} color="var(--accent-primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>Camera is Standby</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', lineHeight: 1.5 }}>
                Start your camera to begin real-time ASL hand landmark extraction and recognition.
              </p>
            </div>
            <button onClick={() => onStartCamera()} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              <Camera size={18} />
              <span>Enable Camera</span>
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              🔒 Privacy Guaranteed: Video frames are processed 100% locally on your device.
            </span>
          </div>
        )}

        {/* Error State Overlay */}
        {cameraState.error && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            backgroundColor: 'rgba(20, 10, 15, 0.96)',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={32} color="#EF4444" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#F87171', marginBottom: '0.5rem' }}>
                عدم امکان دسترسی به دوربین / Camera Access Error
              </h3>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.88rem',
                maxWidth: '460px',
                lineHeight: 1.6,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                {cameraState.error}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => onStartCamera()} className="btn btn-primary">
                <RefreshCw size={16} />
                <span>تلاش مجدد / Retry</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons & Device Select */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {cameraState.isActive ? (
            <button onClick={onStopCamera} className="btn btn-danger" style={{ fontSize: '0.85rem' }}>
              <CameraOff size={16} />
              <span>Stop Camera</span>
            </button>
          ) : (
            <button onClick={() => onStartCamera()} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              <Camera size={16} />
              <span>Start Camera</span>
            </button>
          )}

          <button
            onClick={onToggleMirror}
            className="btn btn-secondary"
            disabled={!cameraState.isActive}
            style={{ fontSize: '0.85rem' }}
            title="Mirror camera preview"
          >
            <FlipHorizontal size={16} />
            <span>{cameraState.isMirror ? 'Mirrored' : 'Normal'}</span>
          </button>

          <button
            onClick={onToggleLandmarks}
            className="btn btn-secondary"
            disabled={!cameraState.isActive}
            style={{ fontSize: '0.85rem' }}
            title="Show or hide 21 3D hand skeletal overlay"
          >
            {cameraState.showLandmarks ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>Skeleton {cameraState.showLandmarks ? 'On' : 'Off'}</span>
          </button>
        </div>

        {/* Device Switcher */}
        {cameraState.availableDevices.length > 1 && (
          <select
            value={cameraState.deviceId || ''}
            onChange={(e) => onSwitchDevice(e.target.value)}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.8rem',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)'
            }}
            aria-label="Select Camera Device"
          >
            {cameraState.availableDevices.map((device, idx) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};
