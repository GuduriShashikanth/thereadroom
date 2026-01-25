import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

async function main() {
  console.log('🌱 Starting seed...')

  // Upsert 'Technology' Niche
  const tech = await prisma.niche.upsert({
    where: { slug: 'technology' },
    update: {},
    create: {
      name: 'Technology',
      slug: 'technology', 
      description: 'Latest updates in Tech, AI, and Software.',
    },
  })
  console.log('Created/Updated Niche:', tech.name)

  // Upsert 'Personal Finance India' Niche
  const finance = await prisma.niche.upsert({
    where: { slug: 'personal-finance-india' },
    update: {},
    create: {
      name: 'Personal Finance India',
      slug: 'personal-finance-india',
      description: 'Money saving tips, investment guides, and financial planning for Indians.',
    },
  })
  console.log('Created/Updated Niche:', finance.name)

  // Example India-focused keywords for Personal Finance niche
  const financeKeywords = [
    'how to save money as a college student in india',
    'best mutual funds for beginners in india 2024',
    'how to start investing with 500 rupees india',
    'top 10 budgeting tips for indian households',
    'best savings account interest rates in india',
    'how to create an emergency fund india',
    'step by step guide to open demat account india',
    'best credit cards for cashback in india',
    'how to file income tax return india online',
    'sip vs lumpsum which is better for beginners',
  ];

  for (const keyword of financeKeywords) {
    try {
      await prisma.keyword.upsert({
        where: {
          nicheId_keyword: {
            nicheId: finance.id,
            keyword: keyword,
          },
        },
        update: {},
        create: {
          nicheId: finance.id,
          keyword: keyword,
          slug: generateSlug(keyword),
          intent: 'informational',
          source: 'SEED',
          status: 'AVAILABLE',
          used: false,
        },
      });
    } catch (e) {
      // Skip duplicates silently
    }
  }
  console.log(`Seeded ${financeKeywords.length} keywords for ${finance.name}`)

  console.log('✅ Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

