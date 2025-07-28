import { SQLiteDatabase } from 'expo-sqlite';
import { Streak } from '../types';

export class StreakService {
  constructor(private db: SQLiteDatabase) {}

  async updateStreak(behaviorType: string, wasResisted: boolean): Promise<Streak> {
    const today = new Date().toISOString().split('T')[0];
    
    let streak = await this.getStreakByType(behaviorType);
    
    if (!streak) {
      // Create new streak
      const id = `streak-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      streak = {
        id,
        behaviorType,
        currentStreak: wasResisted ? 1 : 0,
        longestStreak: wasResisted ? 1 : 0,
        lastResetDate: wasResisted ? null : today,
        startDate: today,
        updatedAt: new Date().toISOString()
      };
    } else {
      if (wasResisted) {
        streak.currentStreak += 1;
        if (streak.currentStreak > streak.longestStreak) {
          streak.longestStreak = streak.currentStreak;
        }
      } else {
        streak.currentStreak = 0;
        streak.lastResetDate = today;
      }
      streak.updatedAt = new Date().toISOString();
    }

    await this.db.runAsync(`
      INSERT OR REPLACE INTO streaks (
        id, behavior_type, current_streak, longest_streak, 
        last_reset_date, start_date, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      streak.id, streak.behaviorType, streak.currentStreak,
      streak.longestStreak, streak.lastResetDate, streak.startDate, streak.updatedAt
    ]);

    return streak;
  }

  async getStreakByType(behaviorType: string): Promise<Streak | null> {
    const result = await this.db.getFirstAsync<any>(`
      SELECT * FROM streaks WHERE behavior_type = ?
    `, [behaviorType]);

    if (!result) return null;

    return {
      id: result.id,
      behaviorType: result.behavior_type,
      currentStreak: result.current_streak,
      longestStreak: result.longest_streak,
      lastResetDate: result.last_reset_date,
      startDate: result.start_date,
      updatedAt: result.updated_at
    };
  }

  async getAllStreaks(): Promise<Streak[]> {
    const results = await this.db.getAllAsync<any>(`
      SELECT * FROM streaks ORDER BY current_streak DESC
    `);

    return results.map(row => ({
      id: row.id,
      behaviorType: row.behavior_type,
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      lastResetDate: row.last_reset_date,
      startDate: row.start_date,
      updatedAt: row.updated_at
    }));
  }

  /**
   * Update mood logging streak - for tracking consecutive days of mood logging
   */
  async updateMoodStreak(): Promise<Streak> {
    const today = new Date().toISOString().split('T')[0];
    const behaviorType = 'mood_logging';
    
    let streak = await this.getStreakByType(behaviorType);
    
    if (!streak) {
      // Create new streak
      const id = `streak-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      streak = {
        id,
        behaviorType,
        currentStreak: 1,
        longestStreak: 1,
        lastResetDate: null,
        startDate: today,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Check if we already logged today
      const lastUpdate = streak.updatedAt?.split('T')[0];
      if (lastUpdate === today) {
        // Already logged today, just return current streak
        return streak;
      }

      // Check if it's a consecutive day
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastUpdate === yesterdayStr) {
        // Consecutive day - increment streak
        streak.currentStreak += 1;
        if (streak.currentStreak > streak.longestStreak) {
          streak.longestStreak = streak.currentStreak;
        }
      } else {
        // Gap in logging - reset streak
        streak.currentStreak = 1;
        streak.lastResetDate = today;
      }
      
      streak.updatedAt = new Date().toISOString();
    }

    await this.db.runAsync(`
      INSERT OR REPLACE INTO streaks (
        id, behavior_type, current_streak, longest_streak, 
        last_reset_date, start_date, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      streak.id, streak.behaviorType, streak.currentStreak,
      streak.longestStreak, streak.lastResetDate, streak.startDate, streak.updatedAt
    ]);

    return streak;
  }

  /**
   * Update sleep tracking streak - for tracking consecutive days of sleep logging
   */
  async updateSleepStreak(): Promise<Streak> {
    const today = new Date().toISOString().split('T')[0];
    const behaviorType = 'sleep';
    
    let streak = await this.getStreakByType(behaviorType);
    
    if (!streak) {
      // Create new streak
      const id = `streak-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      streak = {
        id,
        behaviorType,
        currentStreak: 1,
        longestStreak: 1,
        lastResetDate: null,
        startDate: today,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Check if we already logged today
      const lastUpdate = streak.updatedAt?.split('T')[0];
      if (lastUpdate === today) {
        // Already logged today, just return current streak
        return streak;
      }

      // Check if it's a consecutive day
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastUpdate === yesterdayStr) {
        // Consecutive day - increment streak
        streak.currentStreak += 1;
        if (streak.currentStreak > streak.longestStreak) {
          streak.longestStreak = streak.currentStreak;
        }
      } else {
        // Gap in logging - reset streak
        streak.currentStreak = 1;
        streak.lastResetDate = today;
      }
      
      streak.updatedAt = new Date().toISOString();
    }

    await this.db.runAsync(`
      INSERT OR REPLACE INTO streaks (
        id, behavior_type, current_streak, longest_streak, 
        last_reset_date, start_date, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      streak.id, streak.behaviorType, streak.currentStreak,
      streak.longestStreak, streak.lastResetDate, streak.startDate, streak.updatedAt
    ]);

    return streak;
  }
}
