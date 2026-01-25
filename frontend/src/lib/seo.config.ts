/**
 * Site Configuration for SEO Schema.org
 * 
 * IMPORTANT: Update these values with your actual domain before deploying!
 */

export const SITE_CONFIG = {
  name: 'The Read Room',
  description: 'Your go-to destination for expert knowledge and insights across specialized niches for Indian readers.',
  url: 'https://thereadroom.vercel.app',
  logo: 'https://thereadroom.vercel.app/logo.png',
  ogImage: 'https://thereadroom.vercel.app/og-image.jpg',
  language: 'en-IN',
  author: {
    name: 'The Read Room',
    type: 'Organization' as const,
  },
};

/**
 * Generate Article structured data for Google Discover
 */
export function generateArticleSchema(params: {
  title: string;
  description: string;
  slug: string;
  nicheSlug: string;
  nicheName: string;
  publishedAt: string;
  updatedAt?: string;
  keyword?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.title,
    description: params.description,
    datePublished: params.publishedAt,
    dateModified: params.updatedAt || params.publishedAt,
    inLanguage: SITE_CONFIG.language,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_CONFIG.url}/${params.nicheSlug}/${params.slug}`,
    },
    author: {
      '@type': SITE_CONFIG.author.type,
      name: SITE_CONFIG.author.name,
      url: SITE_CONFIG.url,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      logo: {
        '@type': 'ImageObject',
        url: SITE_CONFIG.logo,
        width: 600,
        height: 60,
      },
    },
    image: {
      '@type': 'ImageObject',
      url: SITE_CONFIG.ogImage,
      width: 1200,
      height: 630,
    },
    articleSection: params.nicheName,
    keywords: params.keyword || params.title,
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_CONFIG.url}${item.url}`,
    })),
  };
}

/**
 * Generate FAQPage schema
 */
export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate WebSite schema (for homepage)
 */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    inLanguage: SITE_CONFIG.language,
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      logo: {
        '@type': 'ImageObject',
        url: SITE_CONFIG.logo,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_CONFIG.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: SITE_CONFIG.logo,
    sameAs: [
      // Add your social media links here
      // 'https://twitter.com/yourhandle',
      // 'https://facebook.com/yourpage',
    ],
  };
}
