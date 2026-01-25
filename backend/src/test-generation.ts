// Force config for testing BEFORE any imports
process.env.AI_MODEL = 'llama-3.3-70b-versatile';

// Load dotenv
require('dotenv').config();

// Import app modules using require to avoid hoisting issues
const { contentGenerator } = require('./services/content/generator');
const { config } = require('./config');

console.log('DEBUG: Config loaded model:', config.openai.model);

async function testGeneration() {
  const niche = 'Urban Gardening';
  const keyword = 'how to grow tomatoes in pots';

  console.log('🧪 Testing AI Content Generation...');
  console.log(`Input: Niche="${niche}", Keyword="${keyword}"`);
  console.log('-------------------------------------------');

  try {
    const article = await contentGenerator.generateArticle(niche, keyword);
    
    console.log('\n✅ Generation Successful!');
    console.log('-------------------------------------------');
    console.log('Title:', article.title);
    console.log('Slug:', article.slug);
    console.log('Short Answer Snippet:', article.shortAnswer.substring(0, 100) + '...');
    console.log('Word Count (approx):', article.content.split(' ').length);
    console.log('Headings:', article.headings);
    console.log('FAQ Count:', article.faq.length);
    
  } catch (error: any) {
    console.error('\n❌ Generation Failed:', error.message);
    if (error.response) {
      console.error('Response Data:', error.response.data);
    }
    // Log cause if available
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

testGeneration();
