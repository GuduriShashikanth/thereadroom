import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api, REVALIDATE_TIME } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  params: Promise<{
    niche: string;
    slug: string;
  }>;
}

// Allow dynamic rendering (prevents static-to-dynamic crash)
export const dynamic = 'force-dynamic';


// 2. Dynamic SEO Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche: nicheSlug, slug: articleSlug } = await params;
  const article = await api.getArticle(nicheSlug, articleSlug);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: article.title,
    description: article.metaDescription,
    alternates: {
      canonical: `/${nicheSlug}/${articleSlug}`,
    },
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      type: 'article',
      publishedTime: article.publishedAt,
    },
  };
}

// 3. Page Component
export default async function ArticlePage({ params }: Props) {
  const { niche: nicheSlug, slug: articleSlug } = await params;
  console.log(`[Frontend] Fetching article: /${nicheSlug}/${articleSlug}`);
  const article = await api.getArticle(nicheSlug, articleSlug);
  console.log(`[Frontend] Found article:`, article ? article.title : 'NULL');

  if (!article) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-16">
      {/* Breadcrumb */}
      <nav className="text-sm font-medium text-slate-400 mb-8 flex items-center space-x-2">
        <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
        <span>/</span>
        <Link href={`/${nicheSlug}`} className="hover:text-slate-900 transition-colors capitalize">
          {article.niche.name}
        </Link>
      </nav>

      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
          {article.title}
        </h1>
        
        {/* Short Answer Snippet (SEO) */}
        {article.summary && (
          <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl text-left mx-auto max-w-2xl mt-8">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">
              Quick Summary
            </h2>
            <p className="text-lg text-slate-700 leading-relaxed font-medium">
              {article.summary}
            </p>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="prose prose-lg prose-slate max-w-none mx-auto mb-20 prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600 prose-a:text-indigo-600 hover:prose-a:text-indigo-500">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {article.content}
        </ReactMarkdown>
      </div>

      {/* FAQ Section */}
      {article.faq && article.faq.length > 0 && (
        <section className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center flex items-center justify-center gap-2">
            <span>🤔</span> Frequently Asked Questions
          </h2>
          <div className="space-y-6 max-w-2xl mx-auto">
            {article.faq.map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-slate-200 transition-colors">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {item.question}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Structured Data: Article Schema (Enhanced for Google Discover) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description: article.metaDescription,
            datePublished: article.publishedAt,
            dateModified: (article as any).updatedAt || article.publishedAt,
            inLanguage: 'en-IN',
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://thereadroom.vercel.app/${nicheSlug}/${articleSlug}`,
            },
            author: {
              '@type': 'Organization',
              name: 'The Read Room',
              url: 'https://thereadroom.vercel.app',
            },
            publisher: {
              '@type': 'Organization',
              name: 'The Read Room',
              url: 'https://thereadroom.vercel.app',
              logo: {
                '@type': 'ImageObject',
                url: 'https://thereadroom.vercel.app/logo.png',
                width: 600,
                height: 60,
              },
            },
            image: {
              '@type': 'ImageObject',
              url: 'https://thereadroom.vercel.app/og-image.jpg',
              width: 1200,
              height: 630,
            },
            articleSection: article.niche.name,
            keywords: (article as any).keyword?.keyword || article.title,
          }),
        }}
      />

      {/* Structured Data: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://thereadroom.vercel.app',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: article.niche.name,
                item: `https://thereadroom.vercel.app/${nicheSlug}`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: article.title,
                item: `https://thereadroom.vercel.app/${nicheSlug}/${articleSlug}`,
              },
            ],
          }),
        }}
      />
      
      {/* Structured Data: FAQPage Schema */}
      {article.faq && article.faq.length > 0 && (
         <script
         type="application/ld+json"
         dangerouslySetInnerHTML={{
           __html: JSON.stringify({
             '@context': 'https://schema.org',
             '@type': 'FAQPage',
             mainEntity: article.faq.map(f => ({
               '@type': 'Question',
               name: f.question,
               acceptedAnswer: {
                 '@type': 'Answer',
                 text: f.answer
               }
             }))
           }),
         }}
       />
      )}
    </article>
  );
}


