import { BaseAIProvider } from './base';
import {
  GenerateDraftRequest,
  GenerateDraftResponse,
  ImproveRequest,
  ImproveResponse,
  StructuredArticleDraft,
} from '../types';
import slugify from 'slugify';

export class MockAIProvider extends BaseAIProvider {
  readonly name = 'mock';
  readonly defaultModel = 'briefylive-editorial-mock-v1';

  isAvailable(): boolean {
    return true;
  }

  async generateDraft(req: GenerateDraftRequest): Promise<GenerateDraftResponse> {
    const startTime = Date.now();

    // Simulate short server latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    const cleanTitle = req.headline.trim();
    const slug = slugify(cleanTitle, { lower: true, strict: true, trim: true }) || 'editorial-draft';
    const isBreaking = req.mode === 'breaking';

    const allSources = [req.primarySource, ...(req.additionalSources || [])];
    const sourceAttribution = allSources.length > 1
      ? `Reporting synthesized from ${allSources.map((s) => s.name).join(', ')}.`
      : `According to reporting by ${req.primarySource.name}.`;

    const rawLede = req.description ? req.description.trim() : `${cleanTitle}.`;

    const draft: StructuredArticleDraft = {
      title: cleanTitle,
      suggestedSlug: slug,
      excerpt: req.description
        ? req.description.slice(0, 150).trim()
        : `${cleanTitle}. Reporting by ${req.primarySource.name}.`,
      content: isBreaking
        ? `## Developing Story\n\n${rawLede}\n\n${sourceAttribution}`
        : `## Overview\n\n${rawLede}\n\n${sourceAttribution}`,
      quickSummary: req.description
        ? [req.description.slice(0, 120)]
        : undefined,
      suggestedCategory: req.categorySlug || 'technology',
      subcategory: req.subcategory,
      tags: [req.categorySlug ? req.categorySlug.toUpperCase() : 'News', req.primarySource.name],
      seoTitle: cleanTitle.slice(0, 60),
      metaDescription: (req.description || `${cleanTitle}. Reporting by ${req.primarySource.name}.`).slice(0, 155),
      alternativeHeadlines: [
        cleanTitle,
        `Update: ${cleanTitle}`,
      ],
      sources: [
        { name: req.primarySource.name, url: req.primarySource.url },
        ...(req.additionalSources || []).map((s) => ({ name: s.name, url: s.url })),
      ],
      reviewFlags: {
        needsVerification: false,
        verificationNotes: [],
      },
      readingTime: isBreaking ? 1 : 2,
    };

    return {
      draft,
      usage: {
        inputTokens: 450,
        outputTokens: 680,
        totalTokens: 1130,
        durationMs: Date.now() - startTime,
      },
      provider: this.name,
      model: this.defaultModel,
    };
  }

  async improve(req: ImproveRequest): Promise<ImproveResponse> {
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 300));

    switch (req.action) {
      case 'headline': {
        const title = req.title || 'Breaking Story';
        return {
          action: 'headline',
          result: {
            headline: `${title}: Full Analysis & Key Facts`,
            alternatives: [
              `Explained: Why ${title} Matters Now`,
              `Behind ${title}: What You Need To Know`,
              `${title} — Critical Takeaways for Readers`,
            ],
          },
          usage: { inputTokens: 120, outputTokens: 80, totalTokens: 200, durationMs: Date.now() - startTime },
          provider: this.name,
          model: this.defaultModel,
        };
      }

      case 'summary': {
        return {
          action: 'summary',
          result: {
            quickSummary: [
              `Major developments confirmed regarding ${req.title || 'the story'}.`,
              'Strategic impacts across key sectors and stakeholders highlighted.',
              'Ongoing implementation timeline confirmed by primary reporting.',
            ],
          },
          usage: { inputTokens: 200, outputTokens: 90, totalTokens: 290, durationMs: Date.now() - startTime },
          provider: this.name,
          model: this.defaultModel,
        };
      }

      case 'seo': {
        const base = (req.title || 'Briefy Editorial').slice(0, 45);
        return {
          action: 'seo',
          result: {
            seoTitle: base,
            metaDescription: `Discover key facts, analysis, and implications regarding ${base.toLowerCase()}. Serious journalism by Briefy.live.`.slice(
              0,
              155
            ),
          },
          usage: { inputTokens: 150, outputTokens: 60, totalTokens: 210, durationMs: Date.now() - startTime },
          provider: this.name,
          model: this.defaultModel,
        };
      }

      case 'tags': {
        const topic = req.categorySlug ? [req.categorySlug] : ['Technology'];
        return {
          action: 'tags',
          result: {
            tags: [...topic, 'Editorial', 'Analysis', 'Industry', 'Policy'],
          },
          usage: { inputTokens: 100, outputTokens: 40, totalTokens: 140, durationMs: Date.now() - startTime },
          provider: this.name,
          model: this.defaultModel,
        };
      }

      case 'rewrite': {
        const text = req.selectedText || req.content || '';
        const tone = req.instruction || 'clarity';
        let rewritten = text;
        if (tone === 'concise') {
          rewritten = text.split('. ').slice(0, 2).join('. ');
        } else if (tone === 'informative') {
          rewritten = `${text} According to verified reporting, these developments establish key benchmarks for the field.`;
        } else {
          rewritten = text.trim();
        }
        return {
          action: 'rewrite',
          result: {
            rewrittenText: rewritten,
            tone,
          },
          usage: { inputTokens: 180, outputTokens: 120, totalTokens: 300, durationMs: Date.now() - startTime },
          provider: this.name,
          model: this.defaultModel,
        };
      }

      case 'fact_check': {
        return {
          action: 'fact_check',
          result: {
            claims: [
              {
                claim: 'Primary news event occurred as announced.',
                status: 'verified',
                note: 'Consistent with source reporting.',
                sourceAttribution: req.sources?.[0]?.name || 'Primary Wire',
              },
              {
                claim: 'Timeline and milestone schedules.',
                status: 'unconfirmed',
                note: 'Target dates require corroboration with official calendar.',
              },
            ],
            overallAssessment: 'Factual core supported by wire reporting; specific dates require editorial review.',
            reviewFlags: {
              needsVerification: true,
              verificationNotes: ['Verify secondary dates and figures before final publication.'],
            },
          },
          usage: { inputTokens: 350, outputTokens: 160, totalTokens: 510, durationMs: Date.now() - startTime },
          provider: this.name,
          model: this.defaultModel,
        };
      }
    }
  }
}
