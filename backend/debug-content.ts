import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- GENERATION LOGS ---');
  const logs = await prisma.generationLog.findMany({
    orderBy: { startedAt: 'desc' },
    take: 5,
    include: { keyword: true }
  });
  console.log(JSON.stringify(logs, null, 2));

  console.log('\n--- ARTICLES ---');
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(articles, null, 2));
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
