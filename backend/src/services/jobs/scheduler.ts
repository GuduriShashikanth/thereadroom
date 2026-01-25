import cron from 'node-cron';
import { processGenerationQueue } from './worker';

/**
 * Initialize background jobs for automated content generation.
 * 
 * Schedule:
 * - Daily at 02:00 AM server time
 * - In development: Runs immediately on startup for testing
 */
export function initScheduler() {
  console.log('⏰ [Scheduler] Initializing automated tasks...');

  // Schedule content generation to run daily at 02:00 AM
  // Cron format: minute hour day-of-month month day-of-week
  // "0 2 * * *" = At 02:00 every day
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ [Cron] Triggering daily content generation at 02:00 AM');
    await processGenerationQueue();
  });

  // Development: Run once on startup for testing
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 [Dev] Running immediate queue check...');
    // Add a small delay to avoid overwhelming on startup
    setTimeout(() => processGenerationQueue(), 5000);
  }
}
