/**
 * SignBridge AI - Main Application Component
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/navbar/Navbar';
import { RecognitionDashboard } from './components/dashboard/RecognitionDashboard';
import { LandingPage } from './components/landing/LandingPage';
import { VocabularyCatalog } from './components/vocabulary/VocabularyCatalog';
import { MetricsView } from './components/metrics/MetricsView';
import { SpeechToSignModal } from './components/speech-to-sign/SpeechToSignModal';
import { ApiService } from './services/apiService';
import { Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'landing' | 'vocabulary' | 'metrics' | 'speech-to-sign'>('dashboard');
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      const health = await ApiService.checkHealth();
      setBackendOnline(health.status === 'healthy');
    };
    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  // Toggle High Contrast Class on Body
  const handleToggleHighContrast = () => {
    setIsHighContrast(prev => {
      const next = !prev;
      if (next) {
        document.body.classList.add('high-contrast');
      } else {
        document.body.classList.remove('high-contrast');
      }
      return next;
    });
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isHighContrast={isHighContrast}
        onToggleHighContrast={handleToggleHighContrast}
        backendOnline={backendOnline}
      />

      {/* Main Content Area */}
      <main className="main-content" id="main-content">
        {activeTab === 'dashboard' && <RecognitionDashboard />}
        {activeTab === 'landing' && (
          <LandingPage
            onLaunchDashboard={() => setActiveTab('dashboard')}
            onExploreVocab={() => setActiveTab('vocabulary')}
            onViewMetrics={() => setActiveTab('metrics')}
          />
        )}
        {activeTab === 'vocabulary' && <VocabularyCatalog />}
        {activeTab === 'metrics' && <MetricsView />}
        {activeTab === 'speech-to-sign' && <SpeechToSignModal />}
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-glass)',
        padding: '2rem 1.5rem',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              <Sparkles size={16} color="var(--accent-primary)" />
              <span>SignBridge AI — Production Accessibility Platform</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Designed for American Sign Language (ASL) MVP recognition. Powered by Edge Computer Vision &amp; Neural Inference.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('landing')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Product Vision
            </button>
            <button
              onClick={() => setActiveTab('vocabulary')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ASL Vocabulary
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Model Metrics
            </button>
            <span style={{ color: 'var(--text-muted)' }}>
              WCAG 2.1 AA Compliant
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
