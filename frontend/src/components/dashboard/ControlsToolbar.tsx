/**
 * SignBridge AI - Dashboard Configuration & Settings Toolbar
 */

import React from 'react';
import { Sliders, Volume2, Gauge, Clock } from 'lucide-react';
import { SpeechSettings } from '../../types';

interface ControlsToolbarProps {
  confidenceThreshold: number;
  onConfidenceChange: (val: number) => void;
  cooldownMs: number;
  onCooldownChange: (val: number) => void;
  speechSettings: SpeechSettings;
  availableVoices: SpeechSynthesisVoice[];
  onSpeechSettingsChange: (settings: Partial<SpeechSettings>) => void;
}

export const ControlsToolbar: React.FC<ControlsToolbarProps> = ({
  confidenceThreshold,
  onConfidenceChange,
  cooldownMs,
  onCooldownChange,
  speechSettings,
  availableVoices,
  onSpeechSettingsChange
}) => {
  return (
    <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Sliders size={18} color="var(--text-accent)" />
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Recognition & Speech Parameters</h3>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Confidence Threshold Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
              <Gauge size={14} />
              <span>Confidence Cutoff:</span>
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-accent)' }}>
              {Math.round(confidenceThreshold * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.50"
            max="0.95"
            step="0.05"
            value={confidenceThreshold}
            onChange={(e) => onConfidenceChange(parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
            aria-label="Confidence Threshold"
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Predictions below cutoff are marked as uncertain.
          </span>
        </div>

        {/* Gesture Cooldown Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
              <Clock size={14} />
              <span>Gesture Debounce:</span>
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-accent)' }}>
              {(cooldownMs / 1000).toFixed(1)}s
            </span>
          </div>
          <input
            type="range"
            min="500"
            max="2500"
            step="100"
            value={cooldownMs}
            onChange={(e) => onCooldownChange(parseInt(e.target.value, 10))}
            style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
            aria-label="Gesture Debounce Duration"
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Wait time before re-emitting the same held sign.
          </span>
        </div>

        {/* Voice Selector */}
        {availableVoices.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <Volume2 size={14} />
              <span>Voice Synthesis:</span>
            </span>
            <select
              value={speechSettings.voice?.name || ''}
              onChange={(e) => {
                const selected = availableVoices.find(v => v.name === e.target.value) || null;
                onSpeechSettingsChange({ voice: selected });
              }}
              style={{
                padding: '0.45rem 0.65rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
              aria-label="Select Text-to-Speech Voice"
            >
              {availableVoices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
