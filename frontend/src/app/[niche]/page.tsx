import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Props {
  params: Promise<{
    niche: string;
  }>;
}

// Allow dynamic rendering for unknown slugs (prevents static-to-dynamic crash)
export const dynamic = 'force-dynamic';


// 2. Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche: nicheSlug } = await params;
  const niche = await api.getNiche(nicheSlug);
  
  if (!niche) {
    return { title: 'Niche Not Found' };
  }

  return {
    title: `${niche.name} Articles`,
    description: niche.description,
  };
}

// 3. Page
export default async function NichePage({ params }: Props) {
  const { niche: nicheSlug } = await params;
  console.log(`[Frontend] Fetching niche: ${nicheSlug}`);
  const niche = await api.getNiche(nicheSlug);
  console.log(`[Frontend] Found niche:`, niche ? niche.name : 'NULL');

  if (!niche) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-20">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">{niche.name}</h1>
        <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full mb-6"></div>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">{niche.description}</p>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(niche.articles && niche.articles.length > 0) ? (
          niche.articles.map((article) => (
            <Link 
              key={article.id} 
              href={`/${niche.slug}/${article.slug}`}
              className="flex flex-col group bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors leading-snug">
                {article.title}
              </h2>
              <p className="text-slate-500 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                {article.summary || article.metaDescription}
              </p>
              <div className="flex items-center text-sm font-bold text-indigo-600 uppercase tracking-wider">
                Read Article 
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center p-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">No articles found in this niche yet.</p>
          </div>
        )}
      </div>
    </div>
  );

}
