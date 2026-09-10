/**
 * SignBridge AI - Future Speech-to-Sign Reverse Pipeline Architecture Preview
 */

import React, { useState } from 'react';
import { Layers, Mic, Bot, ShieldAlert, Cpu } from 'lucide-react';

export const SpeechToSignModal: React.FC = () => {
  const [inputText, setInputText] = useState('Hello, my name is Sadegh. Can you please help me?');

  // Simulated Gloss / Tokenizer output
  const glossTokens = React.useMemo(() => {
    return ['HELLO', 'MY', 'NAME', 'SADEGH', 'YOU', 'HELP', 'ME', 'PLEASE'];
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Layers size={22} color="var(--accent-primary)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Speech-to-Sign Architecture</h1>
              <span className="badge badge-detecting" style={{ fontSize: '0.7rem' }}>Roadmap V4</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Architectural design and interactive preview for two-way bidirectional sign language communication.
            </p>
          </div>
        </div>

        {/* Responsible AI Disclaimer */}
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          fontSize: '0.85rem',
          color: '#C7D2FE'
        }}>
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent-primary)' }} />
          <div>
            <strong>Product Integrity Note:</strong> The current MVP focuses on real-time Sign → Text → Speech. The reverse Speech → Sign pipeline requires linguistic spatial grammar verification and 3D mesh kinematics before full deployment.
          </div>
        </div>
      </div>

      {/* Interactive Pipeline Diagram */}
      <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Bidirectional Translation Pipeline</h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          alignItems: 'center'
        }}>
          {/* Stage 1: Spoken Audio */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-accent)' }}>
              <Mic size={18} />
              <strong style={{ fontSize: '0.9rem' }}>1. Acoustic Speech</strong>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Web Speech / Whisper STT extracts phonemes into raw text.
            </span>
          </div>

          {/* Stage 2: NLP Grammar Normalization */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-secondary)' }}>
              <Cpu size={18} />
              <strong style={{ fontSize: '0.9rem' }}>2. ASL Gloss NLP</strong>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Translates English syntax into ASL Topic-Comment grammatical gloss.
            </span>
          </div>

          {/* Stage 3: 3D Avatar Rig / Kinematics */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
              <Bot size={18} />
              <strong style={{ fontSize: '0.9rem' }}>3. 3D Avatar Rig</strong>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Interpolates skeletal keyframes, handshapes, and facial markers.
            </span>
          </div>
        </div>

        {/* Interactive Sandbox */}
        <div style={{
          marginTop: '1rem',
          padding: '1.5rem',
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Interactive NLP Glossing Sandbox</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                flex: 1,
                minWidth: '280px',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: '#FFFFFF',
                fontSize: '0.95rem'
              }}
              placeholder="Enter spoken English sentence..."
            />
          </div>

          {/* Generated ASL Gloss Tokens Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Generated ASL Gloss Sequence for 3D Kinematics Engine:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {glossTokens.map((tok, idx) => (
                <div
                  key={`${tok}-${idx}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    backgroundColor: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    color: '#A5F3FC'
                  }}
                >
                  <span>{tok}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>[KF_{idx + 1}]</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
