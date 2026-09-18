import { aiService } from '../src/lib/ai/service';

async function testGemini() {
  console.log('Testing AI Service info:', aiService.getProviderInfo());

  try {
    const res = await aiService.generateArticleDraft({
      headline: 'Global Tech Leaders Announce New Open AI Alliance',
      description: 'A coalition of leading technology companies announced an initiative for transparent AI development and open safety standards.',
      categorySlug: 'technology',
      primarySource: {
        name: 'Reuters Technology',
        url: 'https://reuters.com/tech/open-ai-alliance',
        description: 'Coalition of tech leaders formed to advance open AI benchmarking and security.',
      },
      additionalSources: [
        {
          name: 'TechCrunch',
          url: 'https://techcrunch.com/open-ai-alliance',
          description: 'Industry consortium agrees on open weight evaluation standards.',
        }
      ]
    });

    console.log('\n--- Generated Draft Result ---');
    console.log('Title:', res.draft.title);
    console.log('Slug:', res.draft.suggestedSlug);
    console.log('Excerpt:', res.draft.excerpt);
    console.log('Provider used:', res.provider);
    console.log('Model used:', res.model);
    console.log('Quick Summary:', res.draft.quickSummary);
    console.log('Review Flags:', res.draft.reviewFlags);
    console.log('\n--- Article Content Preview ---');
    console.log(res.draft.content.slice(0, 300) + '...\n');
    console.log('SUCCESS: AI Generation works perfectly with Gemini!');
  } catch (error) {
    console.error('AI Service Error:', error instanceof Error ? error.message : String(error));
  }
}

testGemini();
