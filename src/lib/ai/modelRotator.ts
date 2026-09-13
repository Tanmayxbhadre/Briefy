/**
 * Model Rotation Manager
 * 
 * Maintains an ordered list of fallback models per provider.
 * When a model returns a rate-limit (429) or quota-exceeded error,
 * it is put into a cooldown and the next model in the chain is used.
 * After the cooldown expires, the model becomes eligible again.
 */

/** How long to back off a rate-limited model (15 minutes) */
const RATE_LIMIT_COOLDOWN_MS = 15 * 60 * 1000;

/**
 * Ordered fallback model chains per provider.
 * Models are tried top-to-bottom. When one is rate-limited the next is used.
 */
export const MODEL_CHAINS: Record<string, string[]> = {
  gemini: [
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
  ],
  openai: [
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-3.5-turbo',
  ],
  anthropic: [
    'claude-3-5-haiku-20241022',
    'claude-3-5-sonnet-20241022',
    'claude-3-haiku-20240307',
  ],
};

/** In-memory cooldown registry: "provider:model" → timestamp when cooldown expires */
const rateLimitedUntil = new Map<string, number>();

/**
 * Returns true if the given error looks like a rate-limit / quota error.
 */
export function isRateLimitError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('too many requests') ||
    msg.includes('ratelimit') ||
    msg.includes('rate_limit')
  );
}

/**
 * Mark a model as rate-limited so it will be skipped for RATE_LIMIT_COOLDOWN_MS.
 */
export function markModelRateLimited(provider: string, model: string): void {
  const key = `${provider}:${model}`;
  const expiresAt = Date.now() + RATE_LIMIT_COOLDOWN_MS;
  rateLimitedUntil.set(key, expiresAt);
  const mins = Math.round(RATE_LIMIT_COOLDOWN_MS / 60000);
  console.warn(
    `[MODEL-ROTATOR] Model "${model}" (${provider}) rate-limited. Cooling down for ${mins} minutes.`
  );
}

/**
 * Returns true if the model is currently in a rate-limit cooldown.
 */
export function isModelRateLimited(provider: string, model: string): boolean {
  const key = `${provider}:${model}`;
  const until = rateLimitedUntil.get(key);
  if (!until) return false;
  if (Date.now() >= until) {
    rateLimitedUntil.delete(key);
    return false;
  }
  return true;
}

/**
 * Returns the ordered list of models to try for a given provider,
 * skipping those that are currently rate-limited.
 */
export function getAvailableModels(provider: string): string[] {
  const chain = MODEL_CHAINS[provider] ?? [];
  const available = chain.filter((m) => !isModelRateLimited(provider, m));

  if (available.length === 0) {
    // All models are rate-limited — return full chain anyway so callers get
    // at least one attempt (the cooldown might have just expired).
    console.warn(
      `[MODEL-ROTATOR] All models for provider "${provider}" are rate-limited. Attempting with full chain.`
    );
    return chain;
  }

  return available;
}

/**
 * Returns a snapshot of the current rotation state for admin dashboards.
 */
export function getRotationStatus(): Array<{
  provider: string;
  model: string;
  rateLimited: boolean;
  cooldownRemainingMs: number;
}> {
  const rows: ReturnType<typeof getRotationStatus> = [];
  for (const [provider, models] of Object.entries(MODEL_CHAINS)) {
    for (const model of models) {
      const key = `${provider}:${model}`;
      const until = rateLimitedUntil.get(key);
      const cooldownRemainingMs = until ? Math.max(0, until - Date.now()) : 0;
      rows.push({ provider, model, rateLimited: cooldownRemainingMs > 0, cooldownRemainingMs });
    }
  }
  return rows;
}
