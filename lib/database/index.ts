// Database exports for SelfSync app

// Core database manager
export { DatabaseManager } from './manager';

// Data types
export * from './types';

// Service classes
export { SleepLogService } from './services/sleep-logs';
export { MoodLogService } from './services/mood-logs';
export { AddictionLogService } from './services/addiction-logs';
export { HabitService } from './services/habits';
export { StreakService } from './services/streaks';
export { CrisisResourceService } from './services/crisis-resources';
export { AppSettingsService } from './services/app-settings';
export { AIInsightService } from './services/ai-insights';
export { JournalService } from './services/journal';

// Initialize database and get manager instance
export async function initializeDatabase() {
  const { DatabaseManager } = await import('./manager');
  const manager = DatabaseManager.getInstance();
  await manager.initialize();
  return manager;
}
