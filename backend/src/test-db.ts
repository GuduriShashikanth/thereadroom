import { prisma } from './lib/prisma';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
  console.log('🔌 Testing Database Connection...');
  console.log('URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@')); // Mask password

  try {
    const result = await prisma.$queryRaw`SELECT 1 + 1 as result`;
    console.log('✅ Connection Successful!', result);
  } catch (error: any) {
    console.error('❌ Connection Failed:', error.message);
    if (error.code) console.error('Error Code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
