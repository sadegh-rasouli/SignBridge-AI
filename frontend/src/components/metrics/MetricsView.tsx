/**
 * SignBridge AI - Model Performance & Evaluation Metrics View
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, CheckCircle2, Zap, Target, Layers } from 'lucide-react';
import { ModelMetrics } from '../../types';
import { ApiService } from '../../services/apiService';

export const MetricsView: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      const data = await ApiService.getMetrics();
      setMetrics(data);
      setLoading(false);
    };
    loadMetrics();
  }, []);

  if (loading || !metrics) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading AI evaluation metrics...</div>;
  }

  const classNames = Object.keys(metrics.per_class_metrics);

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
            <BarChart3 size={22} color="var(--accent-primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Model Evaluation & Verification</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Rigorous subject-independent benchmark evaluation (Subject 8 Holdout Test Set with zero data leakage).
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Test Accuracy */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.85rem' }}>Test Accuracy (Subject 8)</span>
            <CheckCircle2 size={18} color="var(--success)" />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
            {(metrics.test_accuracy * 100).toFixed(2)}%
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Benchmark Random Forest: {(metrics.rf_test_accuracy * 100).toFixed(2)}%
          </span>
        </div>

        {/* Macro F1 */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.85rem' }}>Macro F1-Score</span>
            <Target size={18} color="var(--accent-secondary)" />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
            {metrics.macro_f1.toFixed(4)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Balanced across all 13 classes
          </span>
        </div>

        {/* Latency */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.85rem' }}>Inference Latency</span>
            <Zap size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
            {metrics.mean_latency_ms.toFixed(2)} <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>ms</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            p95 Latency: {metrics.p95_latency_ms.toFixed(2)} ms (&gt; 1,000 FPS potential)
          </span>
        </div>

        {/* Input Dimensions */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.85rem' }}>Feature Representation</span>
            <Layers size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
            84 <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Dims</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            63 Invariant Coords + 21 Spatial Ratios
          </span>
        </div>
      </div>

      {/* Per-Class Performance Table */}
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Per-Class Performance Breakdown</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Sign Class</th>
                <th style={{ padding: '0.75rem 1rem' }}>Precision</th>
                <th style={{ padding: '0.75rem 1rem' }}>Recall</th>
                <th style={{ padding: '0.75rem 1rem' }}>F1-Score</th>
                <th style={{ padding: '0.75rem 1rem' }}>Support (Test Samples)</th>
              </tr>
            </thead>
            <tbody>
              {classNames.map((cls) => {
                const item = metrics.per_class_metrics[cls];
                return (
                  <tr key={cls} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <span className="transcript-token" style={{ margin: 0 }}>{cls}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>
                      {(item.precision * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>
                      {(item.recall * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', color: 'var(--text-accent)' }}>
                      {item.f1.toFixed(4)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                      {item.support}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Normalized Confusion Matrix Preview */}
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Confusion Matrix Verification</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Verification across 520 test samples. Diagonal elements represent correct classifications.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${classNames.length + 1}, minmax(40px, 1fr))`,
            gap: '3px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            textAlign: 'center'
          }}>
            {/* Top Header Row */}
            <div style={{ padding: '0.3rem', color: 'var(--text-muted)' }}>True \ Pred</div>
            {classNames.map(c => (
              <div key={c} style={{ padding: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.slice(0, 3)}
              </div>
            ))}

            {/* Rows */}
            {metrics.confusion_matrix.map((row, rowIdx) => (
              <React.Fragment key={`row-${rowIdx}`}>
                <div style={{ padding: '0.3rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'left', fontSize: '0.65rem' }}>
                  {classNames[rowIdx]?.slice(0, 3)}
                </div>
                {row.map((val, colIdx) => {
                  const isDiagonal = rowIdx === colIdx;
                  const bg = isDiagonal ? (val > 0 ? 'rgba(16, 185, 129, 0.35)' : 'transparent') :
                                          (val > 0 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255,255,255,0.02)');
                  return (
                    <div
                      key={`cell-${rowIdx}-${colIdx}`}
                      style={{
                        padding: '0.4rem 0.2rem',
                        backgroundColor: bg,
                        borderRadius: '3px',
                        color: isDiagonal ? '#34D399' : val > 0 ? '#F87171' : 'var(--text-muted)'
                      }}
                      title={`True: ${classNames[rowIdx]}, Pred: ${classNames[colIdx]} -> Count: ${val}`}
                    >
                      {val}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
