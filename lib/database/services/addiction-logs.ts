import { SQLiteDatabase } from "expo-sqlite";
import { AddictionLog } from "../types";
import { StreakService } from "./streaks";
import { ResistanceMetricsService } from "./resistance-metrics";

export class AddictionLogService {
  constructor(private db: SQLiteDatabase) {}

  async createAddictionLog(
    data: Omit<AddictionLog, "id" | "createdAt" | "updatedAt">,
  ): Promise<AddictionLog> {
    const id = `addiction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newLog: AddictionLog = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.runAsync(
      `
      INSERT INTO addiction_logs (
        id, date, addiction_type, event_type, was_resisted, urge_intensity,
        duration_minutes, trigger, location, mood_before, mood_after,
        coping_strategy, notes, timestamp, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        newLog.id,
        newLog.date,
        newLog.addictionType,
        newLog.eventType,
        newLog.wasResisted ? 1 : 0,
        newLog.urgeIntensity,
        newLog.durationMinutes,
        newLog.trigger,
        newLog.location,
        newLog.moodBefore,
        newLog.moodAfter,
        newLog.copingStrategy,
        newLog.notes,
        newLog.timestamp,
        newLog.createdAt,
        newLog.updatedAt,
      ],
    );

    // Update addiction recovery streak
    await this.updateAddictionStreak(
      data.date,
      data.eventType,
      data.addictionType,
    );

    // Update resistance metrics if it's an urge event
    if (data.eventType === "urge") {
      const resistanceService = new ResistanceMetricsService(this.db);
      await resistanceService.updateResistanceMetrics(
        data.addictionType,
        data.wasResisted || false,
        data.urgeIntensity || 3,
        data.trigger || undefined,
      );
    }

    return newLog;
  }

  async getAddictionLogsByDate(date: string): Promise<AddictionLog[]> {
    const results = await this.db.getAllAsync<any>(
      `
      SELECT * FROM addiction_logs WHERE date = ? ORDER BY timestamp DESC
    `,
      [date],
    );

    return results.map(this.mapRowToAddictionLog);
  }

  async getRecentAddictionLogs(limit: number = 50): Promise<AddictionLog[]> {
    const results = await this.db.getAllAsync<any>(
      `
      SELECT * FROM addiction_logs ORDER BY timestamp DESC LIMIT ?
    `,
      [limit],
    );

    return results.map(this.mapRowToAddictionLog);
  }

  /**
   * Update addiction recovery streak based on daily behavior
   * Streak is maintained for days without giving in to urges
   */
  private async updateAddictionStreak(
    date: string,
    eventType: string,
    addictionType: string,
  ): Promise<void> {
    const streakService = new StreakService(this.db);

    // Check if there are any urges that were NOT resisted for this addiction type on this date
    const hasGivenInToday = await this.hasGivenInToUrgeOnDate(
      date,
      addictionType,
    );

    // If they gave in to an urge, break the streak
    // If no urges were given in to today (all urges resisted or just milestones), maintain/increase streak
    const maintainStreak = !hasGivenInToday;

    await streakService.updateAddictionStreak(maintainStreak, addictionType);
  }

  /**
   * Check if there are any urges that were NOT resisted on a given date for a specific addiction type
   */
  private async hasGivenInToUrgeOnDate(
    date: string,
    addictionType: string,
  ): Promise<boolean> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      `
      SELECT COUNT(*) as count FROM addiction_logs 
      WHERE date = ? AND event_type = 'urge' AND was_resisted = 0 AND addiction_type = ?
    `,
      [date, addictionType],
    );

    return (result?.count || 0) > 0;
  }

  /**
   * Get addiction recovery streak - days without slips
   */
  async getAddictionStreak(): Promise<number> {
    const streakService = new StreakService(this.db);
    const streak = await streakService.getStreakByType("addiction_recovery");
    return streak?.currentStreak || 0;
  }

  private mapRowToAddictionLog(row: any): AddictionLog {
    return {
      id: row.id,
      date: row.date,
      addictionType: row.addiction_type,
      eventType: row.event_type,
      wasResisted: row.was_resisted === 1,
      urgeIntensity: row.urge_intensity,
      durationMinutes: row.duration_minutes,
      trigger: row.trigger,
      location: row.location,
      moodBefore: row.mood_before,
      moodAfter: row.mood_after,
      copingStrategy: row.coping_strategy,
      notes: row.notes,
      timestamp: row.timestamp,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
