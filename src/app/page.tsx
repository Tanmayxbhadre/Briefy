import type { Metadata } from 'next';
import BreakingNewsBar from '@/components/layout/BreakingNewsBar';
import HeroSection from '@/components/home/HeroSection';
import LatestNewsFeed from '@/components/home/LatestNewsFeed';
import CategorySection from '@/components/home/CategorySection';
import TrendingSection from '@/components/home/TrendingSection';
import NewsletterSignup from '@/components/home/NewsletterSignup';
import AdSlot from '@/components/shared/AdSlot';

import { getHomepageData } from '@/lib/news/homepage';
import styles from './page.module.css';

// ISR: edge-cached with 60s freshness, plus instant revalidation on publish
export const revalidate = 60;

export const metadata: Metadata = {
  title: {
    absolute: 'Briefy.live | Serious Journalism for the Modern Reader',
  },
  description:
    "India's most trusted source for clear, concise news across Technology, AI, Business, India, World, Science, Finance, and Sports.",
  alternates: {
    canonical: '/',
  },
};

export default async function HomePage() {
  const {
    breakingItem,
    featured,
    secondary,
    latestArticles,
    trendingArticles,
    categoryArticles,
  } = await getHomepageData();

  const techArticles = categoryArticles['technology'] || [];
  const indiaArticles = categoryArticles['india'] || [];
  const worldArticles = categoryArticles['world'] || [];
  const aiArticles = categoryArticles['ai'] || [];
  const businessArticles = categoryArticles['business'] || [];
  const financeArticles = categoryArticles['finance'] || [];
  const scienceArticles = categoryArticles['science'] || [];
  const startupsArticles = categoryArticles['startups'] || [];
  const sportsArticles = categoryArticles['sports'] || [];
  const gamingArticles = categoryArticles['gaming'] || [];
  const entertainmentArticles = categoryArticles['entertainment'] || [];

  return (
    <>
      {/* Dynamic Breaking News Bar */}
      {breakingItem && <BreakingNewsBar item={breakingItem} />}

      {/* Hero Section — single unambiguous lead story */}
      {featured ? (
        <section aria-label="Today's top stories">
          <HeroSection featured={featured} secondary={secondary} />
        </section>
      ) : (
        <section className="container" aria-labelledby="empty-home-heading">
          <div className="empty-state">
            <h1 id="empty-home-heading">Briefy.live news desk</h1>
            <p>New coverage is being prepared. Please check back soon.</p>
          </div>
        </section>
      )}

      {/* Ad slot — after hero */}
      <div className="container">
        <div className={styles.adRow}>
          <AdSlot id="ad-post-hero" width={728} height={90} />
        </div>
      </div>

      {/* Continuous Live Feed + Trending Tracker */}
      <div className="container">
        <div className={styles.latestTrendingGrid}>
          <LatestNewsFeed articles={latestArticles} />
          <TrendingSection articles={trendingArticles} />
        </div>
      </div>

      {/* Category Sections */}
      <div className={`container ${styles.categorySections}`}>
        {techArticles.length > 0 && (
          <CategorySection
            categoryName="Technology"
            categorySlug="technology"
            articles={techArticles}
          />
        )}

        {/* Mid-page ad */}
        <div className={styles.adRow}>
          <AdSlot id="ad-mid-page" width={970} height={90} />
        </div>

        {indiaArticles.length > 0 && (
          <CategorySection
            categoryName="India"
            categorySlug="india"
            articles={indiaArticles}
          />
        )}

        {worldArticles.length > 0 && (
          <CategorySection
            categoryName="World"
            categorySlug="world"
            articles={worldArticles}
          />
        )}

        {aiArticles.length > 0 && (
          <CategorySection
            categoryName="Artificial Intelligence"
            categorySlug="ai"
            articles={aiArticles}
          />
        )}

        {businessArticles.length > 0 && (
          <CategorySection
            categoryName="Business"
            categorySlug="business"
            articles={businessArticles}
          />
        )}

        {financeArticles.length > 0 && (
          <CategorySection
            categoryName="Finance & Markets"
            categorySlug="finance"
            articles={financeArticles}
          />
        )}

        {scienceArticles.length > 0 && (
          <CategorySection
            categoryName="Science"
            categorySlug="science"
            articles={scienceArticles}
          />
        )}

        {startupsArticles.length > 0 && (
          <CategorySection
            categoryName="Startups & Venture"
            categorySlug="startups"
            articles={startupsArticles}
          />
        )}

        {sportsArticles.length > 0 && (
          <CategorySection
            categoryName="Sports"
            categorySlug="sports"
            articles={sportsArticles}
          />
        )}

        {gamingArticles.length > 0 && (
          <CategorySection
            categoryName="Gaming"
            categorySlug="gaming"
            articles={gamingArticles}
          />
        )}

        {entertainmentArticles.length > 0 && (
          <CategorySection
            categoryName="Entertainment"
            categorySlug="entertainment"
            articles={entertainmentArticles}
          />
        )}
      </div>

      {/* Newsletter */}
      <NewsletterSignup />
    </>
  );
}
