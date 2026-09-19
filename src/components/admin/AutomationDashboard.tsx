'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileCheck,
  Send,
  Sparkles,
  Server,
  Activity,
} from 'lucide-react';
import { formatRelativeTime, formatDate } from '@/lib/utils';
import styles from './AutomationDashboard.module.css';

interface RecentJob {
  id: string;
  trigger: string;
  startedAt: string;
  completedAt: string | null;
  status: string;
  itemsFound: number;
  itemsInserted: number;
  publishedCount: number;
  draftsCreated: number;
  durationMs: number;
  errorMessage: string | null;
}

interface AutomationStatusPayload {
  status: 'HEALTHY' | 'RUNNING' | 'WARNING' | 'FAILED' | 'IDLE';
  lastRun: string | null;
  lastRunCompletedAt: string | null;
  lastRunStatus: string | null;
  lastRunTrigger: string | null;
  lastRunDurationMs: number | null;
  itemsFound: number;
  itemsInserted: number;
  duplicates: number;
  publishedLastRun: number;
  draftsCreatedLastRun: number;
  totalPublished: number;
  publishedLast24h: number;
  autoPublishedLast24h: number;
  pendingDraftsCount: number;
  approvedDraftsCount: number;
  totalPendingEditorial: number;
  discoveredNewsCount: number;
  runsLast24h: number;
  config: {
    autoPublishEnabled: boolean;
    cronSchedule: string;
    minConfidence: string;
    minQuality: string;
  };
  recentJobs: RecentJob[];
}

export function AutomationDashboard() {
  const [data, setData] = useState<AutomationStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [isFetchingFeeds, setIsFetchingFeeds] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [nextPublishMins, setNextPublishMins] = useState<number | null>(null);
  const [lastActionTime, setLastActionTime] = useState<number>(() => Date.now());

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/automation/status', { cache: 'no-store' });
      if (res.ok) {
        const payload = await res.json();
        setData(payload);

        if (payload.lastRun) {
          const runTime = new Date(payload.lastRun).getTime();
          setLastActionTime((prev) => Math.max(prev, runTime));
        }
      }
    } catch {
      console.error('Failed to fetch automation status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const doFetch = async () => {
      if (isMounted) await fetchStatus();
    };
    doFetch();
    const interval = setInterval(doFetch, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchStatus]);

  useEffect(() => {
    const calcNextPublish = () => {
      const now = Date.now();
      const diffMins = Math.floor((now - lastActionTime) / 60000);
      let remaining = 60 - diffMins;
      if (remaining <= 0) {
        remaining = 60 - (Math.abs(diffMins) % 60);
      }
      setNextPublishMins(remaining === 60 ? 0 : remaining);
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
        body: JSON.stringify({ limit: 1000 }),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setFeedback({
          text:
            result.count > 0
              ? `✓ Successfully published ${result.count} articles to Briefy.live!`
              : 'No eligible news items or drafts found to publish.',
          isError: false,
        });
        setLastActionTime(Date.now());
        await fetchStatus();
      } else {
        setFeedback({
          text: result.error || 'Failed to auto-publish',
          isError: true,
        });
      }
    } catch (err) {
      setFeedback({ text: 'Network error occurred', isError: true });
    } finally {
      setIsPublishing(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleTriggerPipeline = async () => {
    if (isPublishing || isPipelineRunning || isFetchingFeeds) return;
    setIsPipelineRunning(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/automation/trigger-pipeline', { method: 'POST' });
      const result = await res.json();

      if (res.ok && result.success) {
        setFeedback({
          text: '✓ Full pipeline completed successfully!',
          isError: false,
        });
        setLastActionTime(Date.now());
        await fetchStatus();
      } else {
        setFeedback({
          text: result.error || 'Pipeline execution failed',
          isError: true,
        });
      }
    } catch (err) {
      setFeedback({ text: 'Network error occurred', isError: true });
    } finally {
      setIsPipelineRunning(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleFetchFeedsOnly = async () => {
    if (isPublishing || isPipelineRunning || isFetchingFeeds) return;
    setIsFetchingFeeds(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/collection/fetch', { method: 'POST' });
      const result = await res.json();

      if (res.ok && result.success) {
        setFeedback({
          text: `✓ Fetched ${result.totalInserted} new items from ${result.totalSources} sources`,
          isError: false,
        });
        setLastActionTime(Date.now());
        await fetchStatus();
      } else {
        setFeedback({
          text: result.error || 'Fetch operation failed',
          isError: true,
        });
      }
    } catch (err) {
      setFeedback({ text: 'Network error occurred', isError: true });
    } finally {
      setIsFetchingFeeds(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const isBusy = isPublishing || isPipelineRunning || isFetchingFeeds;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Autonomous Newsroom Automation</h1>
          <p className={styles.subtitle}>
            Real-time control and monitoring of Briefy’s automated news ingestion, AI verification,
            editorial clustering, and one-click auto-publication pipeline.
          </p>
        </div>

        <div className={styles.actionGroup}>
          <button
            onClick={handleAutoPublishAll}
            disabled={isBusy}
            className={styles.primaryBtn}
            title="Auto-publish all pending ready news articles to the live site immediately"
          >
            <Zap size={16} className={isPublishing ? styles.spinIcon : ''} />
            <span>{isPublishing ? 'Auto-Publishing News...' : '⚡ Auto-Publish All News'}</span>
          </button>

          <button
            onClick={handleTriggerPipeline}
            disabled={isBusy}
            className={styles.secondaryBtn}
            title="Execute the full end-to-end automated pipeline"
          >
            <RefreshCw size={14} className={isPipelineRunning ? styles.spinIcon : ''} />
            <span>{isPipelineRunning ? 'Running Pipeline...' : 'Run Full Pipeline'}</span>
          </button>

          <button
            onClick={handleFetchFeedsOnly}
            disabled={isBusy}
            className={styles.secondaryBtn}
            title="Fetch only the latest RSS wire items"
          >
            <Radio size={14} className={isFetchingFeeds ? styles.spinIcon : ''} />
            <span>{isFetchingFeeds ? 'Fetching...' : 'Fetch Feeds Only'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`${styles.feedbackCard} ${
            feedback.isError ? styles.feedbackError : styles.feedbackSuccess
          }`}
        >
          {feedback.isError ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Key Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statLabel}>Pipeline Status</span>
            <Activity size={18} className={styles.statIcon} />
          </div>
          <div className={styles.statValue}>
            <span
              className={`${styles.statusBadge} ${
                data?.status === 'RUNNING' || isBusy
                  ? styles.statusRunning
                  : data?.status === 'FAILED'
                  ? styles.statusFailed
                  : styles.statusHealthy
              }`}
            >
              {data?.status === 'RUNNING' || isBusy
                ? 'Processing'
                : data?.status === 'FAILED'
                ? 'Attention Needed'
                : 'Operational'}
            </span>
          </div>
          <span className={styles.statSubtext}>
            {data?.config.cronSchedule || 'Hourly execution via Vercel Cron'}
          </span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statLabel}>Last Automation</span>
            <Clock size={18} className={styles.statIcon} />
          </div>
          <div className={styles.statValue}>
            {data?.lastRun ? formatRelativeTime(data.lastRun) : 'Never'}
          </div>
          <span className={styles.statSubtext}>
            {data?.lastRun
              ? `${data.itemsInserted} fetched · ${data.publishedLastRun} published`
              : 'Waiting for initial run'}
          </span>
          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Next publish: <strong>{nextPublishMins !== null ? `in ${nextPublishMins} min${nextPublishMins !== 1 ? 's' : ''}` : '—'}</strong>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statLabel}>Auto-Published (24h)</span>
            <Sparkles size={18} className={styles.statIcon} />
          </div>
          <div className={styles.statValue}>{data?.autoPublishedLast24h ?? 0}</div>
          <span className={styles.statSubtext}>
            {data?.publishedLast24h ?? 0} total published today
          </span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statLabel}>Live on Briefy</span>
            <Send size={18} className={styles.statIcon} />
          </div>
          <div className={styles.statValue}>{data?.totalPublished ?? 0}</div>
          <span className={styles.statSubtext}>Articles currently public on briefy.live</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statLabel}>Pending Drafts Queue</span>
            <FileCheck size={18} className={styles.statIcon} />
          </div>
          <div className={styles.statValue}>{data?.totalPendingEditorial ?? 0}</div>
          <span className={styles.statSubtext}>
            {data?.approvedDraftsCount ?? 0} approved · {data?.pendingDraftsCount ?? 0} in review
          </span>
        </div>
      </div>

      {/* End-to-End Pipeline Visualization */}
      <div className={styles.pipelineBanner}>
        <div className={styles.pipelineBannerTitle}>
          <Server size={16} />
          <span>Automated News Architecture</span>
        </div>

        <div className={styles.pipelineSteps}>
          <div className={styles.pipelineStep}>
            <div className={styles.pipelineStepNum}>Step 1</div>
            <div className={styles.pipelineStepName}>Wire Collection</div>
            <div className={styles.pipelineStepDetail}>13 authoritative RSS sources polled hourly</div>
          </div>

          <span className={styles.stepArrow}>→</span>

          <div className={styles.pipelineStep}>
            <div className={styles.pipelineStepNum}>Step 2</div>
            <div className={styles.pipelineStepName}>Semantic Clustering</div>
            <div className={styles.pipelineStepDetail}>Deduplication & multi-source grouping</div>
          </div>

          <span className={styles.stepArrow}>→</span>

          <div className={styles.pipelineStep}>
            <div className={styles.pipelineStepNum}>Step 3</div>
            <div className={styles.pipelineStepName}>AI Journalism</div>
            <div className={styles.pipelineStepDetail}>Gemini 3.1 Flash Lite synthesis & verify</div>
          </div>

          <span className={styles.stepArrow}>→</span>

          <div className={styles.pipelineStep}>
            <div className={styles.pipelineStepNum}>Step 4</div>
            <div className={styles.pipelineStepName}>SEO Gate & Publish</div>
            <div className={styles.pipelineStepDetail}>Schema generation & instant publishing</div>
          </div>

          <span className={styles.stepArrow}>→</span>

          <div className={styles.pipelineStep}>
            <div className={styles.pipelineStepNum}>Step 5</div>
            <div className={styles.pipelineStepName}>Edge Invalidation</div>
            <div className={styles.pipelineStepDetail}>Instant cache refresh across Briefy.live</div>
          </div>
        </div>
      </div>

      {/* Recent Jobs History Table */}
      <div className={styles.historySection}>
        <div className={styles.historyHeader}>
          <h2 className={styles.historyTitle}>Automation Execution History</h2>
          <span className={styles.historyCount}>
            Showing last {data?.recentJobs?.length || 0} runs ({data?.runsLast24h || 0} in past 24h)
          </span>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Started At</th>
                <th>Trigger</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Items Found</th>
                <th>New Inserted</th>
                <th>Published</th>
                <th>Drafts Created</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                    Loading automation history...
                  </td>
                </tr>
              ) : !data?.recentJobs || data.recentJobs.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No recorded automation jobs found.
                  </td>
                </tr>
              ) : (
                data.recentJobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div>{formatDate(job.startedAt)}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {formatRelativeTime(job.startedAt)}
                      </div>
                    </td>
                    <td>
                      <span className={styles.triggerBadge}>{job.trigger}</span>
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          job.status === 'COMPLETED'
                            ? styles.statusHealthy
                            : job.status === 'RUNNING'
                            ? styles.statusRunning
                            : styles.statusFailed
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td>{job.durationMs ? `${(job.durationMs / 1000).toFixed(1)}s` : '—'}</td>
                    <td>{job.itemsFound}</td>
                    <td style={{ fontWeight: 600, color: '#2563eb' }}>{job.itemsInserted}</td>
                    <td style={{ fontWeight: 600, color: '#059669' }}>
                      {job.publishedCount ?? 0}
                    </td>
                    <td>{job.draftsCreated ?? 0}</td>
                    <td style={{ color: job.errorMessage ? '#dc2626' : '#64748b' }}>
                      {job.errorMessage || 'Completed normally'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
