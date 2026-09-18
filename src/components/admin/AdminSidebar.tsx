'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Newspaper,
  Layers,
  FileEdit,
  Globe,
  Radio,
  FolderTree,
  BarChart3,
  Settings,
  LogOut,
  X,
  ExternalLink,
  Activity,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import styles from './AdminSidebar.module.css';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user?: string;
  counts?: {
    discovered?: number;
    drafts?: number;
    clusters?: number;
  };
}

interface AutomationSummary {
  status: 'HEALTHY' | 'RUNNING' | 'WARNING' | 'FAILED' | 'IDLE';
  lastRun: string | null;
  lastRunStatus: string | null;
  itemsInserted: number;
  publishedLastRun: number;
  publishedLast24h: number;
  autoPublishedLast24h: number;
  totalPublished: number;
  pendingDraftsCount: number;
  approvedDraftsCount: number;
  totalPendingEditorial: number;
  runsLast24h: number;
}

export function AdminSidebar({ isOpen, onClose, user = 'Editor', counts }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [automation, setAutomation] = useState<AutomationSummary | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  const [nextPublishMins, setNextPublishMins] = useState<number | null>(null);
  const [lastActionTime, setLastActionTime] = useState<number>(() => Date.now());

  const fetchAutomationStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/automation/status', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAutomation({
          status: data.status,
          lastRun: data.lastRun,
          lastRunStatus: data.lastRunStatus,
          itemsInserted: data.itemsInserted ?? 0,
          publishedLastRun: data.publishedLastRun ?? 0,
          publishedLast24h: data.publishedLast24h ?? 0,
          autoPublishedLast24h: data.autoPublishedLast24h ?? 0,
          totalPublished: data.totalPublished ?? 0,
          pendingDraftsCount: data.pendingDraftsCount ?? 0,
          approvedDraftsCount: data.approvedDraftsCount ?? 0,
          totalPendingEditorial: data.totalPendingEditorial ?? 0,
          runsLast24h: data.runsLast24h ?? 0,
        });

        if (data.lastRun) {
          const runTime = new Date(data.lastRun).getTime();
          setLastActionTime((prev) => Math.max(prev, runTime));
        }
      }
    } catch {
      // Fallback silently if offline or unauthenticated
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const doFetch = async () => {
      if (isMounted) await fetchAutomationStatus();
    };
    doFetch();
    const interval = setInterval(doFetch, 30000); // 30s auto-refresh
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchAutomationStatus]);

  useEffect(() => {
    const calcNextPublish = () => {
      const now = Date.now();
      const diffMins = Math.floor((now - lastActionTime) / 60000);
      let remaining = 60 - diffMins;
      if (remaining <= 0) {
        remaining = 60 - (Math.abs(diffMins) % 60);
      }
      setNextPublishMins(remaining === 60 ? 0 : remaining); // 0 means 'now' or just rolled over
    };
    calcNextPublish();
    const timer = setInterval(calcNextPublish, 60000);
    return () => clearInterval(timer);
  }, [lastActionTime]);

  const handleAutoPublishAll = async () => {
    if (isPublishing || isPipelineRunning) return;
    setIsPublishing(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/automation/publish-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 100 }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          text: data.count > 0 ? `✓ Published ${data.count} news items!` : 'No pending drafts to publish.',
          isError: false,
        });
        setLastActionTime(Date.now());
        await fetchAutomationStatus();
        router.refresh();
      } else {
        setFeedback({
          text: data.error || 'Failed to auto-publish news.',
          isError: true,
        });
      }
    } catch {
      setFeedback({
        text: 'Network error while publishing.',
        isError: true,
      });
    } finally {
      setIsPublishing(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleTriggerPipeline = async () => {
    if (isPublishing || isPipelineRunning) return;
    setIsPipelineRunning(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/automation/trigger-pipeline', { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          text: '✓ News pipeline completed successfully!',
          isError: false,
        });
        setLastActionTime(Date.now());
        await fetchAutomationStatus();
        router.refresh();
      } else {
        setFeedback({
          text: data.error || 'Pipeline run failed.',
          isError: true,
        });
      }
    } catch {
      setFeedback({
        text: 'Pipeline connection error.',
        isError: true,
      });
    } finally {
      setIsPipelineRunning(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      router.push('/admin/login');
    }
  };

  interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
    exact?: boolean;
    count?: number;
  }

  const editorialItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'News Queue', href: '/admin/news', icon: Newspaper, count: counts?.discovered },
    { label: 'Story Clusters', href: '/admin/clusters', icon: Layers, count: counts?.clusters },
    { label: 'Drafts', href: '/admin/drafts', icon: FileEdit, count: counts?.drafts },
    { label: 'SEO Studio', href: '/admin/seo', icon: Zap },
  ];

  const systemItems: NavItem[] = [
    { label: 'Published', href: '/admin/articles', icon: Globe },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'News Collection', href: '/admin/collection', icon: Activity },
    { label: 'Sources & Health', href: '/admin/sources', icon: Radio },
    { label: 'Categories', href: '/admin/categories', icon: FolderTree },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const isLinkActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isAnyRunning = isPublishing || isPipelineRunning || automation?.status === 'RUNNING';

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.brand}>
        <div className={styles.logoArea}>
          <span className={styles.logoText}>Briefy.live</span>
          <span className={styles.subBrand}>Newsroom Desk</span>
        </div>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <nav className={styles.nav}>
        {/* EDITORIAL */}
        <div className={styles.navSectionLabel}>Editorial</div>
        {editorialItems.map((item) => {
          const active = isLinkActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.75} />
              <span>{item.label}</span>
              {typeof item.count === 'number' && item.count > 0 && (
                <span className={`${styles.badge} ${active ? styles.badgeActive : ''}`}>
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}

        {/* AUTOMATION SECTION */}
        <div className={styles.navSectionLabel} style={{ marginTop: '0.85rem' }}>
          Automation
        </div>

        <Link
          href="/admin/automation"
          onClick={onClose}
          className={`${styles.navLink} ${isLinkActive('/admin/automation') ? styles.navLinkActive : ''}`}
        >
          <Zap size={17} strokeWidth={isLinkActive('/admin/automation') ? 2.2 : 1.75} />
          <span>Automation Hub</span>
          {automation && automation.totalPendingEditorial > 0 && (
            <span className={`${styles.badge} ${styles.badgeAutomation}`}>
              {automation.totalPendingEditorial} ready
            </span>
          )}
        </Link>

        {/* AUTOMATION LIVE WIDGET */}
        <div className={styles.automationCard}>
          <div className={styles.automationCardHeader}>
            <div className={styles.statusIndicatorRow}>
              <span
                className={`${styles.statusDot} ${
                  isAnyRunning
                    ? styles.statusDotRunning
                    : automation?.status === 'FAILED'
                    ? styles.statusDotFailed
                    : styles.statusDotHealthy
                }`}
              />
              <span className={styles.automationHeading}>Auto News Pipeline</span>
            </div>
            <span
              className={`${styles.statusPill} ${
                isAnyRunning
                  ? styles.statusPillRunning
                  : automation?.status === 'FAILED'
                  ? styles.statusPillFailed
                  : styles.statusPillActive
              }`}
            >
              {isAnyRunning ? 'Running' : automation?.status === 'FAILED' ? 'Failed' : 'Hourly'}
            </span>
          </div>

          <div className={styles.automationDetails}>
            <div className={styles.automationDataRow}>
              <span className={styles.dataLabel}>Last Automation:</span>
              <span
                className={styles.dataValue}
                title={automation?.lastRun ? new Date(automation.lastRun).toLocaleString() : 'Never'}
              >
                {automation?.lastRun ? formatRelativeTime(automation.lastRun) : 'Never run'}
              </span>
            </div>

            <div className={styles.automationDataRow}>
              <span className={styles.dataLabel}>Next Publish:</span>
              <span className={styles.dataValue}>
                {nextPublishMins !== null
                  ? `in ${nextPublishMins} min${nextPublishMins !== 1 ? 's' : ''}`
                  : '—'}
              </span>
            </div>

            <div className={styles.automationDataRow}>
              <span className={styles.dataLabel}>Last Run Stats:</span>
              <span className={styles.dataValue}>
                {automation
                  ? `${automation.itemsInserted} fetched · ${automation.publishedLastRun} pub`
                  : '—'}
              </span>
            </div>

            <div className={styles.automationDataRow}>
              <span className={styles.dataLabel}>24h Activity:</span>
              <span className={styles.dataValue}>
                {automation
                  ? `${automation.runsLast24h} runs · ${automation.publishedLast24h} pub`
                  : '—'}
              </span>
            </div>
          </div>

          {/* Inline Feedback Message */}
          {feedback && (
            <div
              className={`${styles.feedbackBanner} ${
                feedback.isError ? styles.feedbackBannerError : styles.feedbackBannerSuccess
              }`}
            >
              {feedback.isError ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.automationActionGroup}>
            <button
              onClick={handleAutoPublishAll}
              disabled={isAnyRunning}
              className={styles.autoPublishBtn}
              title="Automatically publish all ready and pending news drafts"
            >
              <Zap size={13} className={isPublishing ? styles.spinIcon : ''} />
              <span>{isPublishing ? 'Publishing News...' : 'Auto-Publish All News'}</span>
            </button>

            <button
              onClick={handleTriggerPipeline}
              disabled={isAnyRunning}
              className={styles.runPipelineBtn}
              title="Trigger end-to-end news collection, clustering, and auto-publishing"
            >
              <RefreshCw size={12} className={isPipelineRunning ? styles.spinIcon : ''} />
              <span>{isPipelineRunning ? 'Running Pipeline...' : 'Run Full Pipeline'}</span>
            </button>
          </div>
        </div>

        {/* SYSTEM */}
        <div className={styles.navSectionLabel} style={{ marginTop: '0.85rem' }}>
          System
        </div>
        {systemItems.map((item) => {
          const active = isLinkActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.75} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.navLink}
            style={{ color: 'var(--color-text-secondary, #666666)' }}
          >
            <ExternalLink size={16} />
            <span>View Public Site</span>
          </a>
        </div>
      </nav>

      <div className={styles.footer}>
        <div className={styles.userProfile}>
          <div className={styles.userAvatar}>
            {user.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user}</span>
            <span className={styles.userRole}>Editor-in-Chief</span>
          </div>
        </div>

        <button onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
