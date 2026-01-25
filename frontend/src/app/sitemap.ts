import { MetadataRoute } from 'next';
import { api } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await api.getAllArticles();
  const niches = await api.getNiches();
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thereadroom.vercel.app';

  const articleEntries = articles.map((article) => ({
    url: `${baseUrl}/${article.niche.slug}/${article.slug}`,
    lastModified: article.publishedAt || new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const nicheEntries = niches.map((niche) => ({
    url: `${baseUrl}/${niche.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...nicheEntries,
    ...articleEntries,
  ];
}
