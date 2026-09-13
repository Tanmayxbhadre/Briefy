import { BaseAIProvider } from './base';
import {
  GenerateDraftRequest,
  GenerateDraftResponse,
  ImproveRequest,
  ImproveResponse,
  StructuredArticleDraft,
  HeadlineImprovementResult,
  SummaryImprovementResult,
  SeoImprovementResult,
  TagsImprovementResult,
  RewriteImprovementResult,
  FactCheckImprovementResult,
} from '../types';
import {
  buildArticleDraftSystemPrompt,
  buildArticleDraftUserPrompt,
} from '../prompts/articleDraftPrompt';
import { buildHeadlinePrompt } from '../prompts/headlinePrompt';
import { buildSummaryPrompt } from '../prompts/summaryPrompt';
import { buildSeoPrompt } from '../prompts/seoPrompt';
import { buildTagsPrompt } from '../prompts/tagsPrompt';
import { buildRewritePrompt } from '../prompts/rewritePrompt';
import { buildFactCheckPrompt } from '../prompts/factCheckPrompt';
import {
  getAvailableModels,
  isRateLimitError,
  markModelRateLimited,
} from '../modelRotator';

export class GeminiProvider extends BaseAIProvider {
  readonly name = 'gemini';
  readonly defaultModel = process.env.AI_MODEL || 'gemini-3.1-flash-lite';
  private apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

  isAvailable(): boolean {
    return !!this.apiKey && !this.apiKey.startsWith('PASTE_') && this.apiKey.trim().length > 0;
  }

  /**
   * Calls the Gemini API with automatic model rotation on rate-limit errors.
   * Tries each model in the chain until one succeeds.
   */
  private async callGenerateContent(
    systemInstruction: string,
    prompt: string
  ): Promise<{ content: string; model: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
    if (!this.apiKey) {
      throw new Error('Google Gemini API Key is not configured on the server.');
    }

    const models = getAvailableModels('gemini');
    let lastError: Error | null = null;

    for (const model of models) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);

      try {
        console.log(`[GEMINI] Attempting with model: ${model}`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemInstruction }],
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const errorText = await response.text();
          const err = new Error(`Gemini API returned status ${response.status}: ${errorText.slice(0, 200)}`);

          if (response.status === 429 || isRateLimitError(err)) {
            markModelRateLimited('gemini', model);
            lastError = err;
            console.warn(`[GEMINI] Rate limit hit on "${model}", rotating to next model...`);
            continue; // Try next model
          }

          throw err; // Non-rate-limit error — propagate immediately
        }

        const json = await response.json();
        const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) {
          throw new Error('Gemini returned an empty completion.');
        }

        const meta = json.usageMetadata;
        const usage = meta
          ? {
              prompt_tokens: meta.promptTokenCount || 0,
              completion_tokens: meta.candidatesTokenCount || 0,
              total_tokens: meta.totalTokenCount || 0,
            }
          : undefined;

        if (model !== this.defaultModel) {
          console.log(`[GEMINI] Successfully used fallback model: ${model}`);
        }

        return { content, model, usage };
      } catch (err) {
        clearTimeout(timeout);

        if (isRateLimitError(err)) {
          markModelRateLimited('gemini', model);
          lastError = err instanceof Error ? err : new Error(String(err));
          console.warn(`[GEMINI] Rate limit hit on "${model}", rotating to next model...`);
          continue;
        }

        throw err; // Non-rate-limit: bubble up immediately
      }
    }

    throw lastError ?? new Error('All Gemini models are exhausted or rate-limited.');
  }

  async generateDraft(req: GenerateDraftRequest): Promise<GenerateDraftResponse> {
    const startTime = Date.now();
    const systemPrompt = buildArticleDraftSystemPrompt();
    const userPrompt = buildArticleDraftUserPrompt(req);

    const { content, model, usage } = await this.callGenerateContent(systemPrompt, userPrompt);
    const draft = this.parseJsonResponse<StructuredArticleDraft>(content);

    return {
      draft,
      usage: {
        inputTokens: usage?.prompt_tokens,
        outputTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens,
        durationMs: Date.now() - startTime,
      },
      provider: this.name,
      model,
    };
  }

  async improve(req: ImproveRequest): Promise<ImproveResponse> {
    const startTime = Date.now();
    let prompt = '';

    switch (req.action) {
      case 'headline':
        prompt = buildHeadlinePrompt(req.title || '', req.content);
        break;
      case 'summary':
        prompt = buildSummaryPrompt(req.title || '', req.content || '');
        break;
      case 'seo':
        prompt = buildSeoPrompt(req.title || '', req.excerpt, req.content);
        break;
      case 'tags':
        prompt = buildTagsPrompt(req.title || '', req.categorySlug, req.content);
        break;
      case 'rewrite':
        prompt = buildRewritePrompt(req.selectedText || req.content || '', req.instruction || 'clarity');
        break;
      case 'fact_check':
        prompt = buildFactCheckPrompt(req.title || '', req.content || '', req.sources);
        break;
    }

    const { content, model, usage } = await this.callGenerateContent(
      'You are an authoritative editor for BRIEFY. Output strictly valid JSON.',
      prompt
    );

    let result:
      | HeadlineImprovementResult
      | SummaryImprovementResult
      | SeoImprovementResult
      | TagsImprovementResult
      | RewriteImprovementResult
      | FactCheckImprovementResult;

    if (req.action === 'headline') result = this.parseJsonResponse<HeadlineImprovementResult>(content);
    else if (req.action === 'summary') result = this.parseJsonResponse<SummaryImprovementResult>(content);
    else if (req.action === 'seo') result = this.parseJsonResponse<SeoImprovementResult>(content);
    else if (req.action === 'tags') result = this.parseJsonResponse<TagsImprovementResult>(content);
    else if (req.action === 'rewrite') result = this.parseJsonResponse<RewriteImprovementResult>(content);
    else result = this.parseJsonResponse<FactCheckImprovementResult>(content);

    return {
      action: req.action,
      result,
      usage: {
        inputTokens: usage?.prompt_tokens,
        outputTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens,
        durationMs: Date.now() - startTime,
      },
      provider: this.name,
      model,
    };
  }
}
