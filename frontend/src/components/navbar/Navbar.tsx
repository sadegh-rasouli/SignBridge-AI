/**
 * SignBridge AI - Main Navigation Bar Component
 */

import React from 'react';
import { Sparkles, Video, BookOpen, BarChart3, Layers, Eye } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'landing' | 'vocabulary' | 'metrics' | 'speech-to-sign';
  onSelectTab: (tab: 'dashboard' | 'landing' | 'vocabulary' | 'metrics' | 'speech-to-sign') => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
  backendOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  isHighContrast,
  onToggleHighContrast,
  backendOnline
}) => {
  return (
    <header className="navbar-wrapper" style={{
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--bg-glass)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        {/* Brand Title */}
        <button
          onClick={() => onSelectTab('landing')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            textAlign: 'left'
          }}
          aria-label="SignBridge AI Home"
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
          }}>
            <Sparkles size={20} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.35rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}>
                SignBridge<span style={{ color: 'var(--text-accent)' }}>.AI</span>
              </span>
              <span className="badge badge-live" style={{ fontSize: '0.65rem' }}>ASL MVP</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
              AI Sign Language Communication Platform
            </span>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }} aria-label="Main Navigation">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
            aria-current={activeTab === 'dashboard' ? 'page' : undefined}
          >
            <Video size={16} />
            <span>Live Recognition</span>
          </button>

          <button
            onClick={() => onSelectTab('vocabulary')}
            className={`btn ${activeTab === 'vocabulary' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
            aria-current={activeTab === 'vocabulary' ? 'page' : undefined}
          >
            <BookOpen size={16} />
            <span>Vocabulary (12)</span>
          </button>

          <button
            onClick={() => onSelectTab('metrics')}
            className={`btn ${activeTab === 'metrics' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
            aria-current={activeTab === 'metrics' ? 'page' : undefined}
          >
            <BarChart3 size={16} />
            <span>AI Metrics</span>
          </button>

          <button
            onClick={() => onSelectTab('speech-to-sign')}
            className={`btn ${activeTab === 'speech-to-sign' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
            aria-current={activeTab === 'speech-to-sign' ? 'page' : undefined}
          >
            <Layers size={16} />
            <span>Speech → Sign (Preview)</span>
          </button>
        </nav>

        {/* Accessibility & Status Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* High Contrast Toggle */}
          <button
            onClick={onToggleHighContrast}
            className="btn btn-secondary"
            style={{
              padding: '0.45rem 0.75rem',
              fontSize: '0.8rem',
              border: isHighContrast ? '2px solid var(--border-focus)' : '1px solid var(--border-subtle)'
            }}
            title="Toggle WCAG High Contrast Mode"
            aria-pressed={isHighContrast}
          >
            <Eye size={15} />
            <span>{isHighContrast ? 'Standard Contrast' : 'High Contrast'}</span>
          </button>

          {/* Backend Status Badge */}
          <div
            className={`badge ${backendOnline ? 'badge-live' : 'badge-idle'}`}
            title={backendOnline ? 'FastAPI Backend Online' : 'Edge-Only Mode (Offline / Local Wasm ML)'}
            style={{ padding: '0.4rem 0.75rem' }}
          >
            <span className={backendOnline ? 'pulse-dot' : ''} style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: backendOnline ? '#10B981' : '#94A3B8',
              display: 'inline-block'
            }} />
            <span>{backendOnline ? 'API Connected' : 'Edge ML (Local)'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
