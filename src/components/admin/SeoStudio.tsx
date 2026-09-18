'use client';

import React, { useState } from 'react';
import { Zap, CheckCircle, AlertTriangle, AlertCircle, Search, RefreshCw } from 'lucide-react';
import { auditArticleSeo, SeoAuditResult, ArticleForAudit } from '@/lib/seo/audit';

interface DraftProps {
  id: string;
  title: string;
  slug: string;
  content: string;
  seoTitle?: string | null;
  metaDescription?: string | null;
  tags?: string[] | string | null;
  category?: { name: string } | null;
}

export function SeoStudio({ initialDrafts }: { initialDrafts: DraftProps[] }) {
  const [drafts, setDrafts] = useState<DraftProps[]>(initialDrafts);
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
        setFeedback({ type: 'success', message: `✓ SEO fixed for "${draft.title.substring(0, 30)}..."` });
        
        // Update local state to reflect new SEO data
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
        setFeedback({ type: 'error', message: result.error || 'Failed to apply AI SEO fix.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error while contacting AI service.' });
    } finally {
      setFixingId(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const renderDraftCard = (draft: DraftProps) => {
    // Map draft to ArticleForAudit type for the audit function
    const auditData: ArticleForAudit = {
      title: draft.title,
      slug: draft.slug,
      content: draft.content,
      seoTitle: draft.seoTitle,
      metaDescription: draft.metaDescription,
      tags: draft.tags,
      categorySlug: draft.category?.name,
    };

    const audit: SeoAuditResult = auditArticleSeo(auditData);
    const isGood = audit.score >= 80;

    return (
      <div key={draft.id} style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{draft.title}</h3>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>
                <strong>SEO Score:</strong> 
                <span style={{ 
                  color: audit.score >= 80 ? 'var(--success)' : audit.score >= 60 ? 'var(--warning)' : 'var(--danger)',
                  marginLeft: '0.25rem',
                  fontWeight: 600 
                }}>
                  {audit.score}/100 ({audit.grade})
                </span>
              </span>
              <span><strong>Status:</strong> {audit.isRankReady ? '✅ Ready to Rank' : '⚠️ Needs Work'}</span>
            </div>
          </div>
          
          <button 
            onClick={() => handleFixSeo(draft)}
            disabled={fixingId === draft.id || isGood}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: isGood ? '#f1f5f9' : 'var(--accent)',
              color: isGood ? '#94a3b8' : '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: isGood || fixingId === draft.id ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              transition: 'background 0.2s',
            }}
          >
            {fixingId === draft.id ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Zap size={16} />
            )}
            {fixingId === draft.id ? 'Fixing...' : isGood ? 'SEO Optimized' : 'Fix with AI'}
          </button>
        </div>

        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', fontSize: '0.9rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Current SEO Title:</strong> {draft.seoTitle || <span style={{color: 'var(--danger)'}}>Missing</span>}
          </div>
          <div>
            <strong>Current Meta Description:</strong> {draft.metaDescription || <span style={{color: 'var(--danger)'}}>Missing</span>}
          </div>
        </div>

        {audit.criticalCount > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: 'var(--danger)', fontSize: '0.9rem' }}>
            <AlertCircle size={16} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
            <div>
              <strong>Critical Issues ({audit.criticalCount}):</strong>
              <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.25rem' }}>
                {audit.checks.filter(c => c.status === 'critical').map(c => (
                  <li key={c.id}>{c.message}</li>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ 
          background: 'var(--accent)', 
          color: 'white', 
          width: '48px', 
          height: '48px', 
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Search size={24} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>AI SEO Studio</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
            Automatically audit and fix search engine optimization for your pending drafts using AI.
          </p>
        </div>
      </div>

      {feedback && (
        <div style={{
          padding: '1rem',
          marginBottom: '2rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
          color: feedback.type === 'success' ? '#065f46' : '#991b1b',
          border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
        }}>
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {feedback.message}
        </div>
      )}

      {drafts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <CheckCircle size={48} style={{ color: 'var(--success)', margin: '0 auto 1rem' }} />
          <h2 style={{ margin: '0 0 0.5rem' }}>All Caught Up!</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>There are no pending drafts requiring SEO optimization.</p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Pending Drafts ({drafts.length})</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {drafts.map(renderDraftCard)}
          </div>
        </div>
      )}
    </div>
  );
}
