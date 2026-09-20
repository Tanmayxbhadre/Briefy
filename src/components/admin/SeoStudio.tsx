'use client';

import React, { useState, useMemo } from 'react';
import { Zap, CheckCircle, AlertTriangle, AlertCircle, Search, RefreshCw, Sparkles, Filter } from 'lucide-react';
import { auditArticleSeo, SeoAuditResult, ArticleForAudit } from '@/lib/seo/audit';

interface DraftProps {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  tags?: string[] | string | null;
  category?: { name: string } | null;
}

export function SeoStudio({ initialDrafts }: { initialDrafts: DraftProps[] }) {
  const [drafts, setDrafts] = useState<DraftProps[]>(initialDrafts);
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [isFixingAll, setIsFixingAll] = useState<boolean>(false);
  const [fixProgress, setFixProgress] = useState<{ current: number; total: number } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'needs_work' | 'optimized'>('all');

  // Compute audits for all drafts
  const draftAudits = useMemo(() => {
    const map = new Map<string, SeoAuditResult>();
    for (const draft of drafts) {
      const auditData: ArticleForAudit = {
        title: draft.title,
        slug: draft.slug,
        content: draft.content,
        excerpt: draft.excerpt,
        seoTitle: draft.seoTitle,
        metaDescription: draft.metaDescription,
        tags: draft.tags,
        categorySlug: draft.category?.name,
      };
      map.set(draft.id, auditArticleSeo(auditData));
    }
    return map;
  }, [drafts]);

  const needsWorkDrafts = useMemo(() => {
    return drafts.filter((d) => {
      const audit = draftAudits.get(d.id);
      return audit ? audit.score < 80 : true;
    });
  }, [drafts, draftAudits]);

  const filteredDrafts = useMemo(() => {
    return drafts.filter((d) => {
      const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const audit = draftAudits.get(d.id);
      const isGood = audit ? audit.score >= 80 : false;

      if (activeFilter === 'needs_work') return !isGood;
      if (activeFilter === 'optimized') return isGood;
      return true;
    });
  }, [drafts, draftAudits, searchQuery, activeFilter]);

  // Fix single draft
  const handleFixSeo = async (draft: DraftProps) => {
    setFixingId(draft.id);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/seo/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setFeedback({ type: 'success', message: `✓ SEO fixed for "${draft.title.substring(0, 35)}..."` });
        
        setDrafts(prev => prev.map(d => {
          if (d.id === draft.id) {
            return {
              ...d,
              seoTitle: result.data.seoTitle,
              metaDescription: result.data.metaDescription,
              tags: result.data.tags,
            };
          }
          return d;
        }));
      } else {
        setFeedback({ type: 'error', message: result.error || 'Failed to apply SEO fix.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error while contacting SEO fix service.' });
    } finally {
      setFixingId(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  // Fix all drafts that need work
  const handleFixAll = async () => {
    const targets = needsWorkDrafts;
    if (targets.length === 0) {
      setFeedback({ type: 'success', message: 'All articles are already SEO optimized!' });
      return;
    }

    setIsFixingAll(true);
    setFixProgress({ current: 0, total: targets.length });
    setFeedback(null);

    try {
      const targetIds = targets.map((t) => t.id);
      const res = await fetch('/api/admin/seo/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftIds: targetIds }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const updatedList: Array<{ id: string; seoTitle: string; metaDescription: string; tags: string[] }> = 
          Array.isArray(result.data) ? result.data : [result.data];

        const updatedMap = new Map(updatedList.map(item => [item.id, item]));

        setDrafts(prev => prev.map(d => {
          const u = updatedMap.get(d.id);
          if (u) {
            return {
              ...d,
              seoTitle: u.seoTitle,
              metaDescription: u.metaDescription,
              tags: u.tags,
            };
          }
          return d;
        }));

        setFeedback({ type: 'success', message: `✓ Successfully optimized SEO for ${updatedList.length} articles!` });
      } else {
        setFeedback({ type: 'error', message: result.error || 'Failed to batch fix SEO.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error during batch SEO optimization.' });
    } finally {
      setIsFixingAll(false);
      setFixProgress(null);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  const renderDraftCard = (draft: DraftProps) => {
    const audit = draftAudits.get(draft.id) || auditArticleSeo({
      title: draft.title,
      slug: draft.slug,
      content: draft.content,
      seoTitle: draft.seoTitle,
      metaDescription: draft.metaDescription,
      tags: draft.tags,
      categorySlug: draft.category?.name,
    });

    const isGood = audit.score >= 80;
    const isThisFixing = fixingId === draft.id;

    return (
      <div key={draft.id} style={{
        background: '#fff',
        border: `1px solid ${isGood ? '#e2e8f0' : '#fed7aa'}`,
        borderRadius: '10px',
        padding: '1.5rem',
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              {draft.category?.name && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: '#f1f5f9',
                  color: '#475569',
                }}>
                  {draft.category.name}
                </span>
              )}
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>/{draft.slug}</span>
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 600, color: '#0f172a' }}>
              {draft.title}
            </h3>
            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span>
                <strong>SEO Score:</strong> 
                <span style={{ 
                  color: audit.score >= 80 ? '#16a34a' : audit.score >= 60 ? '#d97706' : '#dc2626',
                  marginLeft: '0.35rem',
                  fontWeight: 700 
                }}>
                  {audit.score}/100 ({audit.grade})
                </span>
              </span>
              <span><strong>Status:</strong> {audit.isRankReady ? '✅ Ready to Rank' : '⚠️ Needs Work'}</span>
            </div>
          </div>
          
          <button 
            onClick={() => handleFixSeo(draft)}
            disabled={isThisFixing || isFixingAll || isGood}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.15rem',
              backgroundColor: isGood ? '#f8fafc' : '#2563eb',
              color: isGood ? '#94a3b8' : '#ffffff',
              border: `1px solid ${isGood ? '#e2e8f0' : '#1d4ed8'}`,
              borderRadius: '8px',
              cursor: isGood || isThisFixing || isFixingAll ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {isThisFixing ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Zap size={16} fill={isGood ? '#94a3b8' : '#ffffff'} />
            )}
            {isThisFixing ? 'Fixing...' : isGood ? 'SEO Optimized' : 'Fix SEO with AI'}
          </button>
        </div>

        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem', border: '1px solid #f1f5f9' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, color: '#334155' }}>SEO Title: </span>
            {draft.seoTitle ? (
              <span style={{ color: '#0f172a' }}>{draft.seoTitle} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({draft.seoTitle.length} chars)</span></span>
            ) : (
              <span style={{ color: '#dc2626', fontStyle: 'italic' }}>Missing (will fall back to raw headline)</span>
            )}
          </div>
          <div>
            <span style={{ fontWeight: 600, color: '#334155' }}>Meta Description: </span>
            {draft.metaDescription ? (
              <span style={{ color: '#0f172a' }}>{draft.metaDescription} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({draft.metaDescription.length} chars)</span></span>
            ) : (
              <span style={{ color: '#dc2626', fontStyle: 'italic' }}>Missing (will fall back to raw excerpt)</span>
            )}
          </div>
        </div>

        {audit.criticalCount > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: '#b91c1c', fontSize: '0.875rem', background: '#fef2f2', padding: '0.75rem', borderRadius: '6px' }}>
            <AlertCircle size={16} style={{ marginTop: '0.15rem', flexShrink: 0 }} />
            <div>
              <strong>Critical Ranking Issues ({audit.criticalCount}):</strong>
              <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.25rem' }}>
                {audit.checks.filter(c => c.status === 'critical').map(c => (
                  <li key={c.id}>{c.message} {c.recommendation && <span style={{ color: '#7f1d1d' }}>— {c.recommendation}</span>}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1rem',
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid #e2e8f0' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
            color: 'white', 
            width: '52px', 
            height: '52px', 
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
          }}>
            <Sparkles size={26} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>AI SEO Studio</h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
              One-click SEO audit & AI optimization for pending newsroom drafts.
            </p>
          </div>
        </div>

        {/* Global FIX ALL SEO Button */}
        <button
          onClick={handleFixAll}
          disabled={isFixingAll || needsWorkDrafts.length === 0}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1.5rem',
            background: needsWorkDrafts.length > 0 ? 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)' : '#e2e8f0',
            color: needsWorkDrafts.length > 0 ? '#ffffff' : '#94a3b8',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: needsWorkDrafts.length > 0 && !isFixingAll ? 'pointer' : 'not-allowed',
            boxShadow: needsWorkDrafts.length > 0 ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          {isFixingAll ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              Optimizing {fixProgress?.current || 0}/{fixProgress?.total || needsWorkDrafts.length}...
            </>
          ) : (
            <>
              <Zap size={18} fill="#ffffff" />
              Fix All SEO ({needsWorkDrafts.length})
            </>
          )}
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
          color: feedback.type === 'success' ? '#065f46' : '#991b1b',
          border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          fontSize: '0.95rem',
          fontWeight: 500,
        }}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          {feedback.message}
        </div>
      )}

      {/* Search & Filter Tabs */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1rem',
        marginBottom: '1.5rem',
        background: '#fff',
        padding: '0.75rem 1rem',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveFilter('all')}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '6px',
              border: 'none',
              background: activeFilter === 'all' ? '#0f172a' : '#f1f5f9',
              color: activeFilter === 'all' ? '#fff' : '#475569',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            All Drafts ({drafts.length})
          </button>
          <button
            onClick={() => setActiveFilter('needs_work')}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '6px',
              border: 'none',
              background: activeFilter === 'needs_work' ? '#dc2626' : '#fef2f2',
              color: activeFilter === 'needs_work' ? '#fff' : '#b91c1c',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Needs Work ({needsWorkDrafts.length})
          </button>
          <button
            onClick={() => setActiveFilter('optimized')}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '6px',
              border: 'none',
              background: activeFilter === 'optimized' ? '#16a34a' : '#f0fdf4',
              color: activeFilter === 'optimized' ? '#fff' : '#15803d',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Optimized ({drafts.length - needsWorkDrafts.length})
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search drafts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem 0.45rem 2rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Drafts List */}
      {filteredDrafts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <CheckCircle size={48} style={{ color: '#16a34a', margin: '0 auto 1rem' }} />
          <h2 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>No matching drafts found</h2>
          <p style={{ color: '#64748b', margin: 0 }}>
            {activeFilter === 'needs_work' 
              ? 'All drafts have achieved optimal SEO score!' 
              : 'Try changing your search query or filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredDrafts.map(renderDraftCard)}
        </div>
      )}
    </div>
  );
}
