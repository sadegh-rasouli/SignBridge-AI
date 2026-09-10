/**
 * SignBridge AI - Real-Time Sign Prediction HUD Card
 */

import React from 'react';
import { Activity, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PredictionResult, GestureState } from '../../types';

interface LivePredictionCardProps {
  prediction: PredictionResult;
  gestureState: GestureState;
  confidenceThreshold: number;
}

export const LivePredictionCard: React.FC<LivePredictionCardProps> = ({
  prediction,
  gestureState,
  confidenceThreshold
}) => {
  const isConfident = prediction.isConfident;
  const isNoHand = prediction.sign === 'NO_HAND' || prediction.sign === 'IDLE';
  const confidencePercent = Math.round(prediction.confidence * 100);

  return (
    <div className="glass-card prediction-banner" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Glow highlight background based on confidence */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        background: isConfident ? 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)' :
                    isNoHand ? 'transparent' : 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} color="var(--text-accent)" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Real-Time Inference</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="badge badge-idle" style={{ fontSize: '0.7rem' }}>
            State: {gestureState}
          </span>
          <span style={{
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)'
          }}>
            Cutoff: {Math.round(confidenceThreshold * 100)}%
          </span>
        </div>
      </div>

      {/* Primary Detected Sign Banner */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Detected ASL Sign
          </span>
          {isConfident && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--success)', fontSize: '0.85rem' }}>
              <CheckCircle2 size={16} />
              <span>Confirmed ({confidencePercent}%)</span>
            </div>
          )}
        </div>

        <div className="predicted-sign-display" style={{
          color: isNoHand ? 'var(--text-muted)' : isConfident ? '#FFFFFF' : '#FBBF24'
        }}>
          {isNoHand ? 'Waiting for Hand...' :
           isConfident ? prediction.sign :
           `${prediction.rawPrediction} (?)`}
        </div>

        {/* Confidence Track */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            <span>Model Confidence</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{confidencePercent}%</span>
          </div>
          <div className="confidence-bar-track">
            <div
              className="confidence-bar-fill"
              style={{
                width: `${confidencePercent}%`,
                background: isConfident ? 'linear-gradient(90deg, #10B981 0%, #06B6D4 100%)' :
                            'linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)'
              }}
            />
          </div>
        </div>

        {/* Low Confidence Warning Notice */}
        {!isConfident && !isNoHand && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            color: '#FDE047',
            marginTop: '0.25rem'
          }}>
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>
              Uncertain gesture ({confidencePercent}% &lt; {Math.round(confidenceThreshold * 100)}% threshold). Hold hand steadily.
            </span>
          </div>
        )}
      </div>

      {/* Top-K Probability Breakdown */}
      {prediction.topPredictions.length > 0 && !isNoHand && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Top Predictions Distribution:
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {prediction.topPredictions.map((pred, idx) => (
              <div
                key={pred.sign}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '110px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    #{idx + 1}
                  </span>
                  <span style={{ fontWeight: 600, color: idx === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {pred.sign}
                  </span>
                </div>

                <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.round(pred.confidence * 100)}%`,
                      backgroundColor: idx === 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <span style={{ width: '45px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {Math.round(pred.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
