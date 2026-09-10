/**
 * SignBridge AI - ASL Vocabulary Catalog Component
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Hand } from 'lucide-react';
import { VocabularyItem } from '../../types';
import { ApiService } from '../../services/apiService';

export const VocabularyCatalog: React.FC = () => {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVocab = async () => {
      setLoading(true);
      const items = await ApiService.getVocabulary();
      setVocabulary(items);
      setLoading(false);
    };
    fetchVocab();
  }, []);

  const categories = ['All', ...Array.from(new Set(vocabulary.map(v => v.category)))];

  const filteredItems = vocabulary.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
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
            <BookOpen size={22} color="var(--accent-primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>ASL MVP Supported Vocabulary</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Targeted 12-sign American Sign Language vocabulary catalog with morphological descriptions.
            </p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1.5rem',
          flexWrap: 'wrap'
        }}>
          {/* Search Input */}
          <div style={{
            flex: 1,
            minWidth: '240px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem' }} />
            <input
              type="text"
              placeholder="Search sign by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem'
              }}
              aria-label="Search vocabulary"
            />
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
              >
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading ASL catalog...
        </div>
      ) : (
        /* Vocabulary Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.25rem'
        }}>
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="glass-card"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {item.name}
                    </h3>
                    <span style={{
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-accent)'
                    }}>
                      TOKEN: {item.id}
                    </span>
                  </div>
                  <span className="badge badge-idle" style={{ fontSize: '0.75rem' }}>
                    {item.category}
                  </span>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {item.description}
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}>
                <Hand size={14} color="var(--accent-secondary)" />
                <span>Hand Configuration: <strong style={{ color: 'var(--text-primary)' }}>{item.hand_type}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
