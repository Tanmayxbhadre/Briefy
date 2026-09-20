'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './NewsletterSignup.module.css';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (honeypot) {
      // Quietly ignore bot submission
      setStatus('success');
      return;
    }

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setStatus('error');
      return;
    }

    setLoading(true);
    // Simulate safe API submission delay
    await new Promise((res) => setTimeout(res, 600));
    setLoading(false);
    setStatus('success');
    setEmail('');
  };

  return (
    <section className={styles.section} aria-label="Newsletter signup">
      <div className={`container ${styles.inner}`}>
        <div className={styles.content}>
          <h2 className={styles.heading}>Briefy, Daily.</h2>
          <p className={styles.subtext}>
            Get the most important stories of the day delivered to your inbox every morning.
            No noise, no spam.
          </p>
        </div>

        <div aria-live="polite" className={styles.formContainer}>
          {status === 'success' ? (
            <div className={styles.successMsg} role="status">
              <span>✓</span>
              <p>You&apos;re subscribed. Check your inbox for a confirmation email.</p>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              {/* Invisible bot honeypot */}
              <input
                type="text"
                name="b_hp"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                style={{ display: 'none' }}
                aria-hidden="true"
              />

              <div className={styles.inputGroup}>
                <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === 'error') setStatus('idle');
                  }}
                  placeholder="Your email address"
                  autoComplete="email"
                  inputMode="email"
                  disabled={loading}
                  className={`${styles.input} ${status === 'error' ? styles.inputError : ''}`}
                  aria-describedby={status === 'error' ? 'newsletter-error' : undefined}
                  required
                />
                <button type="submit" className={styles.btn} disabled={loading}>
                  {loading ? 'Subscribing…' : 'Subscribe'}
                </button>
              </div>
              {status === 'error' && (
                <p id="newsletter-error" className={styles.error} role="alert">
                  Please enter a valid email address.
                </p>
              )}
              <p className={styles.privacy}>
                No spam. Unsubscribe anytime. See our{' '}
                <Link href="/privacy">Privacy Policy</Link>.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
