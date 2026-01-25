import { api, REVALIDATE_TIME } from '@/lib/api';
import Link from 'next/link';
import { generateWebSiteSchema, generateOrganizationSchema } from '@/lib/seo.config';

export default async function Home() {
  const niches = await api.getNiches();

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">The Read Room</h1>
          <p className="text-xl text-slate-300 mb-8">
            Expert knowledge across {niches.length} specialized niches.
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-10 border-b pb-4">
          Browse by Category
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {niches.map((niche) => (
            <div key={niche.id} className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                <Link href={`/${niche.slug}`} className="hover:text-indigo-600 transition-colors">
                  {niche.name}
                </Link>
              </h3>
              <p className="text-slate-600 mb-4 line-clamp-2">
                {niche.description || `Explore articles about ${niche.name}.`}
              </p>
              <Link 
                href={`/${niche.slug}`}
                className="text-indigo-600 font-medium hover:underline inline-flex items-center"
              >
                View Articles →
              </Link>
            </div>
          ))}

          {niches.length === 0 && (
            <p className="text-slate-500 col-span-full text-center py-10">
              No niches found. Admin needs to generate content.
            </p>
          )}
        </div>
      </section>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateWebSiteSchema()),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateOrganizationSchema()),
        }}
      />
    </main>
  );
}


