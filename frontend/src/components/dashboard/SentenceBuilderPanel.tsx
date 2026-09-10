/**
 * SignBridge AI - Live Sentence Builder & Speech Panel
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, RotateCcw, Trash2, Copy, Check, Pause, Play, MessageSquare } from 'lucide-react';

interface SentenceBuilderPanelProps {
  tokens: string[];
  formattedSentence: string;
  isSpeaking: boolean;
  isPaused: boolean;
  onSpeak: () => void;
  onStopSpeak: () => void;
  onUndo: () => void;
  onDeleteLastWord: () => void;
  onClear: () => void;
  onTogglePause: () => void;
}

export const SentenceBuilderPanel: React.FC<SentenceBuilderPanelProps> = ({
  tokens,
  formattedSentence,
  isSpeaking,
  isPaused,
  onSpeak,
  onStopSpeak,
  onUndo,
  onDeleteLastWord,
  onClear,
  onTogglePause
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!formattedSentence) return;
    try {
      await navigator.clipboard.writeText(formattedSentence);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={18} color="var(--text-accent)" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Live Sentence Builder</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={onTogglePause}
            className={`btn ${isPaused ? 'btn-danger' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            title={isPaused ? 'Resume live recognition stream' : 'Pause recognition stream'}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            <span>{isPaused ? 'Resume Recognition' : 'Pause'}</span>
          </button>
        </div>
      </div>

      {/* Transcript Box with ARIA Live Region */}
      <div
        className="transcript-box"
        role="log"
        aria-live="polite"
        aria-label="Real-time translated sign language sentence"
      >
        {tokens.length === 0 ? (
          <div style={{
            height: '100%',
            minHeight: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '1rem',
            fontStyle: 'italic',
            textAlign: 'center'
          }}>
            Recognized signs will appear here in sequence to build natural sentences.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Formatted Natural English Sentence */}
            <div style={{
              fontSize: '1.35rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em'
            }}>
              "{formattedSentence}"
            </div>

            {/* Individual Tokens Stream */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.4rem' }}>Tokens:</span>
              {tokens.map((token, idx) => (
                <span key={`${token}-${idx}`} className="transcript-token">
                  {token}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Controls Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        paddingTop: '0.25rem'
      }}>
        {/* Speech Controls */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isSpeaking ? (
            <button
              onClick={onStopSpeak}
              className="btn btn-danger"
              style={{ fontSize: '0.85rem' }}
            >
              <VolumeX size={16} />
              <span>Stop Speech</span>
            </button>
          ) : (
            <button
              onClick={onSpeak}
              className="btn btn-primary"
              disabled={tokens.length === 0}
              style={{ fontSize: '0.85rem' }}
            >
              <Volume2 size={16} />
              <span>Speak Sentence (TTS)</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="btn btn-secondary"
            disabled={tokens.length === 0}
            style={{ fontSize: '0.85rem' }}
            title="Copy sentence to clipboard"
          >
            {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Editing Controls */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={onUndo}
            className="btn btn-secondary"
            disabled={tokens.length === 0}
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
            title="Undo last recognized token"
          >
            <RotateCcw size={15} />
            <span>Undo</span>
          </button>

          <button
            onClick={onDeleteLastWord}
            className="btn btn-secondary"
            disabled={tokens.length === 0}
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
            title="Delete last token"
          >
            <span>Delete Word</span>
          </button>

          <button
            onClick={onClear}
            className="btn btn-danger"
            disabled={tokens.length === 0}
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
            title="Clear entire transcript"
          >
            <Trash2 size={15} />
            <span>Clear</span>
          </button>
        </div>
      </div>
    </div>
  );
};
