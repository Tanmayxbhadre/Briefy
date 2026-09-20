import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession, recordActivity } from '@/lib/auth';
import { brandedTitle } from '@/lib/site';

export const maxDuration = 60; // 60 seconds timeout

interface FixResult {
  seoTitle: string;
  metaDescription: string;
  tags: string[];
}

async function generateSeoWithAi(title: string, category: string, content: string, apiKey: string): Promise<FixResult | null> {
  try {
    const prompt = `You are an expert SEO specialist for a modern news platform called Briefy.
Your task is to generate an optimized SEO title, meta description, and 3-5 keywords for the following news article draft.

Article Title: ${title}
Article Category: ${category}

Article Content:
${content.substring(0, 2500)}...

Rules:
1. seoTitle must be compelling and maximum 60 characters.
2. metaDescription must be informative and between 120-155 characters without generic boilerplate.
3. tags must be 3-5 relevant keywords.

Respond strictly with a JSON object in the following format, with no markdown formatting or backticks:
{
  "seoTitle": "Optimized title under 60 chars",
  "metaDescription": "Informative summary between 120-155 characters.",
  "tags": ["keyword1", "keyword2", "keyword3"]
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const aiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          responseMimeType: "application/json",
        }
      })
    });

    if (!aiResponse.ok) {
      return null;
    }

    const aiData = await aiResponse.json();
    const resultText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) return null;

    const parsed = JSON.parse(resultText);
    const tags = Array.isArray(parsed.tags) 
      ? parsed.tags 
      : (parsed.tags ? String(parsed.tags).split(',').map((t: string) => t.trim()) : []);

    return {
      seoTitle: brandedTitle(parsed.seoTitle || title),
      metaDescription: String(parsed.metaDescription || '').slice(0, 155),
      tags,
    };
  } catch (err) {
    console.warn('[SEO_FIX] AI generation error, falling back to algorithmic engine:', err);
    return null;
  }
}

function generateAlgorithmicSeo(title: string, category: string, content: string): FixResult {
  const cleanTitle = brandedTitle(title);
  
  // Extract first 1-2 factual sentences for clean meta description
  const cleanContent = content.replace(/^#+\s+[^\n]+\n/gm, '').replace(/\n+/g, ' ').trim();
  const sentences = cleanContent.split(/(?<=[.?!])\s+/).filter(Boolean);
  let desc = (sentences[0] || title).trim();
  if (desc.length < 110 && sentences[1]) {
    desc = `${desc} ${sentences[1]}`.trim();
  }
  if (desc.length > 155) {
    desc = desc.slice(0, 152).trim() + '...';
  }

  const defaultTags = [category || 'News', 'Current Affairs', 'Analysis'];

  return {
    seoTitle: cleanTitle,
    metaDescription: desc,
    tags: defaultTags,
  };
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const draftId = body.draftId as string | undefined;
    const draftIds = body.draftIds as string[] | undefined;

    const idsToProcess = draftIds && draftIds.length > 0 ? draftIds : draftId ? [draftId] : [];

    if (idsToProcess.length === 0) {
      return NextResponse.json({ error: 'Draft ID or Draft IDs required' }, { status: 400 });
    }

    const apiKey = process.env.SEO_AI_API_KEY || process.env.GEMINI_API_KEY;

    const drafts = await prisma.articleDraft.findMany({
      where: { id: { in: idsToProcess } },
      include: { category: true },
    });

    if (drafts.length === 0) {
      return NextResponse.json({ error: 'No matching drafts found' }, { status: 404 });
    }

    const updatedResults = [];

    for (const draft of drafts) {
      const catName = draft.category?.name || 'News';
      let seoResult: FixResult | null = null;

      if (apiKey && apiKey.trim() !== '') {
        seoResult = await generateSeoWithAi(draft.title, catName, draft.content || draft.excerpt || '', apiKey);
      }

      if (!seoResult) {
        seoResult = generateAlgorithmicSeo(draft.title, catName, draft.content || draft.excerpt || '');
      }

      const updated = await prisma.articleDraft.update({
        where: { id: draft.id },
        data: {
          seoTitle: seoResult.seoTitle,
          metaDescription: seoResult.metaDescription,
          tags: JSON.stringify(seoResult.tags),
          seoWorkflowStatus: 'READY_TO_PUBLISH',
        },
      });

      updatedResults.push({
        id: updated.id,
        seoTitle: updated.seoTitle,
        metaDescription: updated.metaDescription,
        tags: seoResult.tags,
      });
    }

    await recordActivity(
      'seo_ai_fix',
      idsToProcess.join(','),
      `Fixed SEO for ${updatedResults.length} draft(s)`,
      session.user || 'Admin'
    );

    return NextResponse.json({
      success: true,
      count: updatedResults.length,
      data: updatedResults.length === 1 ? updatedResults[0] : updatedResults,
    });
  } catch (error) {
    console.error('[SEO_FIX] Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
