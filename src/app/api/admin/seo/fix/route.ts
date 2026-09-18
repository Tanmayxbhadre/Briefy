import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession, recordActivity } from '@/lib/auth';

export const maxDuration = 60; // 60 seconds timeout

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draftId } = await request.json();
    if (!draftId) {
      return NextResponse.json({ error: 'Draft ID is required' }, { status: 400 });
    }

    const apiKey = process.env.SEO_AI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json({ error: 'SEO_AI_API_KEY is not configured in .env' }, { status: 500 });
    }

    const draft = await prisma.articleDraft.findUnique({
      where: { id: draftId },
      include: { category: true },
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    if (!draft.title || !draft.content) {
      return NextResponse.json({ error: 'Draft must have title and content' }, { status: 400 });
    }

    // Call Gemini API directly with the specific SEO_AI_API_KEY
    const prompt = `You are an expert SEO specialist for a modern news platform called Briefy.
Your task is to generate an optimized SEO title, meta description, and 3-5 keywords for the following news article draft.

Article Title: ${draft.title}
Article Category: ${draft.category?.name || 'News'}

Article Content:
${draft.content.substring(0, 3000)}...

Respond strictly with a JSON object in the following format, with no markdown formatting or backticks:
{
  "seoTitle": "Engaging, keyword-rich title under 60 chars",
  "metaDescription": "Compelling summary under 155 chars that drives clicks",
  "tags": ["keyword1", "keyword2", "keyword3"]
}`;

    // Note: You can switch to Gemini 1.5 Pro or Flash depending on the API key provided
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const aiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        }
      })
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('[SEO_FIX] AI API Error:', errText);
      return NextResponse.json({ error: 'Failed to generate SEO from AI provider' }, { status: 502 });
    }

    const aiData = await aiResponse.json();
    const resultText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      return NextResponse.json({ error: 'Invalid response from AI provider' }, { status: 502 });
    }

    let seoData;
    try {
      seoData = JSON.parse(resultText);
    } catch {
      console.error('[SEO_FIX] JSON Parse Error:', resultText);
      return NextResponse.json({ error: 'Failed to parse AI response as JSON' }, { status: 500 });
    }

    // Combine existing tags with new ones if needed, or just replace
    const newTags = Array.isArray(seoData.tags) 
      ? seoData.tags 
      : (seoData.tags ? seoData.tags.split(',').map((t: string) => t.trim()) : []);

    const updatedDraft = await prisma.articleDraft.update({
      where: { id: draftId },
      data: {
        seoTitle: seoData.seoTitle,
        metaDescription: seoData.metaDescription,
        tags: newTags,
      },
    });

    await recordActivity(
      'seo_ai_fix',
      draftId,
      `Used AI to fix SEO for draft: ${draft.title}`,
      session.user || 'Admin'
    );

    return NextResponse.json({
      success: true,
      data: {
        seoTitle: updatedDraft.seoTitle,
        metaDescription: updatedDraft.metaDescription,
        tags: updatedDraft.tags,
      }
    });

  } catch (error) {
    console.error('[SEO_FIX] Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
