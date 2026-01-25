/**
 * Seed Script: seedKeywords.ts
 * 
 * This script seeds the database with initial niches and keywords.
 * It is idempotent - safe to run multiple times.
 * 
 * Usage: npx ts-node scripts/seedKeywords.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate a URL-safe slug from text.
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface SeedNiche {
  name: string;
  slug: string;
  description: string;
  keywords: string[];
}

/**
 * Define your niches and keywords here.
 * Add or remove as needed.
 */
const SEED_DATA: SeedNiche[] = [
  {
    name: 'Personal Finance',
    slug: 'personal-finance',
    description: 'Money management, budgeting, saving, and investing tips.',
    keywords: [
      'how to save money fast',
      'best budgeting apps for beginners',
      'how to start investing with little money',
      'credit score improvement tips',
      'how to pay off debt quickly',
      'emergency fund guide',
      'side hustle ideas for extra income',
      'how to negotiate a salary increase',
      'retirement planning basics',
      'best high yield savings accounts',
    ],
  },
  {
    name: 'Health & Wellness',
    slug: 'health-wellness',
    description: 'Healthy living, fitness, nutrition, and mental health.',
    keywords: [
      'how to improve sleep quality',
      'best morning routine for energy',
      'how to reduce stress naturally',
      'healthy meal prep ideas for beginners',
      'benefits of meditation daily',
      'how to start working out at home',
      'best foods for brain health',
      'how to build a consistent workout habit',
      'natural remedies for headaches',
      'how to stay motivated to exercise',
    ],
  },
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Tech guides, software reviews, and digital productivity.',
    keywords: [
      'best productivity apps for remote work',
      'how to protect your online privacy',
      'best password managers',
      'how to speed up a slow computer',
      'best video conferencing tools',
      'how to backup data safely',
      'best note taking apps',
      'how to set up a home office',
      'best cloud storage services',
      'how to learn coding for beginners',
    ],
  },
];

async function main() {
  console.log('🌱 Starting seed process...\n');

  for (const nicheData of SEED_DATA) {
    console.log(`📁 Processing niche: ${nicheData.name}`);

    // Upsert niche (create if not exists, skip if exists)
    let niche = await prisma.niche.findUnique({
      where: { slug: nicheData.slug },
    });

    if (!niche) {
      niche = await prisma.niche.create({
        data: {
          name: nicheData.name,
          slug: nicheData.slug,
          description: nicheData.description,
        },
      });
      console.log(`   ✅ Created niche: ${niche.name}`);
    } else {
      console.log(`   ⏭️  Niche already exists: ${niche.name}`);
    }

    // Insert keywords
    let created = 0;
    let skipped = 0;

    for (const keywordText of nicheData.keywords) {
      const slug = generateSlug(keywordText);

      try {
        await prisma.keyword.create({
          data: {
            nicheId: niche.id,
            keyword: keywordText,
            slug,
            intent: 'informational',
            used: false,
          },
        });
        created++;
      } catch (error) {
        // Unique constraint violation - skip
        skipped++;
      }
    }

    console.log(`   📝 Keywords: ${created} created, ${skipped} skipped (duplicates)\n`);
  }

  console.log('✅ Seed process complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
