/**
 * SignBridge AI - Landing Page Component
 */

import React from 'react';
import {
  Sparkles,
  Video,
  Eye,
  Cpu,
  Volume2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  BookOpen,
  BarChart3
} from 'lucide-react';

interface LandingPageProps {
  onLaunchDashboard: () => void;
  onExploreVocab: () => void;
  onViewMetrics: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchDashboard,
  onExploreVocab,
  onViewMetrics
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
      {/* Hero Section */}
      <section style={{
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        position: 'relative'
      }}>
        {/* Glow backdrop */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '450px',
          height: '250px',
          background: 'radial-gradient(ellipse, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }} />

        <div className="badge badge-live" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}>
          <Sparkles size={14} />
          <span>Real-Time AI Accessibility Platform</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          maxWidth: '900px',
          letterSpacing: '-0.03em'
        }}>
          Bridging Sign Language and Speech with <span style={{
            background: 'linear-gradient(135deg, #818CF8 0%, #38BDF8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Edge AI</span>
        </h1>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
          maxWidth: '680px',
          lineHeight: 1.6
        }}>
          SignBridge AI converts real-time American Sign Language gestures into fluid text and synthesized speech using client-side computer vision and neural networks.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
          <button
            onClick={onLaunchDashboard}
            className="btn btn-primary"
            style={{ padding: '0.9rem 2rem', fontSize: '1.05rem', borderRadius: 'var(--radius-lg)' }}
          >
            <Video size={20} />
            <span>Launch Live Recognition</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={onExploreVocab}
            className="btn btn-secondary"
            style={{ padding: '0.9rem 1.75rem', fontSize: '1rem', borderRadius: 'var(--radius-lg)' }}
          >
            <BookOpen size={18} />
            <span>View ASL Vocabulary (12)</span>
          </button>

          <button
            onClick={onViewMetrics}
            className="btn btn-secondary"
            style={{ padding: '0.9rem 1.75rem', fontSize: '1rem', borderRadius: 'var(--radius-lg)' }}
          >
            <BarChart3 size={18} />
            <span>Model Benchmarks (98.6%)</span>
          </button>
        </div>

        {/* Privacy Highlight Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.9rem',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          border: '1px solid var(--border-subtle)'
        }}>
          <Lock size={14} color="#10B981" />
          <span>100% Privacy by Design: Video stays in browser RAM, never uploaded.</span>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>How SignBridge AI Works</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.25rem' }}>
            A 4-stage pipeline delivering sub-25ms end-to-end recognition.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Step 1 */}
          <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}>
              <Video size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>1. Camera Frame Capture</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              WebRTC captures 720p 30 FPS video frames in local browser memory without uploading raw pixels anywhere.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-secondary)'
            }}>
              <Eye size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>2. 3D Landmark Normalization</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              MediaPipe extracts 21 3D hand joints. Our normalizer applies wrist-translation and scale invariance (84-D vector).
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--success)'
            }}>
              <Cpu size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>3. Neural Classification</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Edge-optimized neural classifier executes forward pass in &lt; 0.1ms with temporal debouncing &amp; hysteresis filtering.
            </p>
          </div>

          {/* Step 4 */}
          <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F59E0B'
            }}>
              <Volume2 size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>4. Sentence Builder &amp; TTS</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Tokens assemble into clean grammatical sentences and synthesize to natural audible speech via Web Speech API.
            </p>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="glass-card" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Core Architectural Pillars</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.75rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }}><CheckCircle2 size={20} /></div>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>No Camera Stream Uploads</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                All computer vision computation happens on client device hardware for maximum privacy and zero latency.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }}><CheckCircle2 size={20} /></div>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Hysteresis Gesture Debouncing</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                4-stage temporal state machine eliminates flickering and duplicate token spamming during held gestures.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }}><CheckCircle2 size={20} /></div>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Scale &amp; Translation Invariant</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Robust coordinate normalization ensures high accuracy across various distances, camera angles, and hand sizes.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }}><CheckCircle2 size={20} /></div>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>WCAG 2.1 AA Accessibility</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Full keyboard navigation, ARIA live region transcript announcements, and high-contrast accessibility mode.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Responsible AI & Honest Limitations */}
      <section className="glass-card" style={{ padding: '2.5rem', borderLeft: '4px solid var(--accent-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <ShieldCheck size={26} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Responsible AI &amp; Ethical Limitations</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.7' }}>
          <p>
            <strong>SignBridge AI MVP</strong> is explicitly designed for a verified 12-sign American Sign Language vocabulary. Sign languages are complete, rich natural languages with distinct spatial grammars, non-manual markers (facial expressions, mouth morphemes, head tilts), and regional dialects.
          </p>
          <p>
            This system does <em>not</em> claim universal or unrestricted sign language translation. It is engineered as a foundational, privacy-preserving building block for real-time accessible communication that can scale to full spatial linguistic modeling in future versions.
          </p>
        </div>
      </section>

      {/* Technology Stack Badges */}
      <section style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Built with Modern Engineering Stack
        </h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {['React 19', 'TypeScript (Strict)', 'Vite', 'MediaPipe Vision', 'FastAPI', 'PyTorch / Scikit-Learn', 'Web Speech API', 'WebAssembly / WebGL'].map(tech => (
            <span key={tech} className="btn btn-secondary" style={{ fontSize: '0.85rem', cursor: 'default' }}>
              {tech}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
};
