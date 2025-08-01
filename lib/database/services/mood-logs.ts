import { SQLiteDatabase } from "expo-sqlite";
import { MoodLog } from "../types";
import { StreakService } from "./streaks";

export class MoodLogService {
  constructor(private db: SQLiteDatabase) {}

  /**
   * Create a new mood log entry
   */
  async createMoodLog(
    data: Omit<MoodLog, "id" | "createdAt" | "updatedAt">,
  ): Promise<MoodLog> {
    const now = new Date().toISOString();
    const id = `mood-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const newEntry: MoodLog = {
        id,
        ...data,
        createdAt: now,
        updatedAt: now,
      };

      await this.db.runAsync(
        `
        INSERT INTO mood_logs (
          id, date, mood, energy, stress, context, tags, notes, timestamp, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          newEntry.id,
          newEntry.date,
          newEntry.mood,
          newEntry.energy,
          newEntry.stress,
          newEntry.context,
          JSON.stringify(newEntry.tags),
          newEntry.notes,
          newEntry.timestamp,
          newEntry.createdAt,
          newEntry.updatedAt,
        ],
      );

      // Update mood logging streak
      const streakService = new StreakService(this.db);
      await streakService.updateMoodStreak();

      return newEntry;
    } catch (error) {
      console.error("Error creating mood log:", error);
      throw error;
    }
  }

  /**
   * Get all mood logs for a specific date
   */
  async getMoodLogsByDate(date: string): Promise<MoodLog[]> {
    try {
      const results = await this.db.getAllAsync<any>(
        `
        SELECT * FROM mood_logs 
        WHERE date = ? 
        ORDER BY timestamp ASC
      `,
        [date],
      );

      return results.map((row) => this.mapRowToMoodLog(row));
    } catch (error) {
      console.error("Error getting mood logs by date:", error);
      return [];
    }
  }

  /**
   * Get today's mood logs
   */
  async getTodayMoodLogs(): Promise<MoodLog[]> {
    const today = new Date().toISOString().split("T")[0];
    return this.getMoodLogsByDate(today);
  }

  /**
   * Get mood logs within a date range
   */
  async getMoodLogsByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<MoodLog[]> {
    try {
      const results = await this.db.getAllAsync<any>(
        `
        SELECT * FROM mood_logs 
        WHERE date BETWEEN ? AND ? 
        ORDER BY timestamp ASC
      `,
        [startDate, endDate],
      );

      return results.map((row) => this.mapRowToMoodLog(row));
    } catch (error) {
      console.error("Error getting mood logs by date range:", error);
      return [];
    }
  }

  /**
   * Get recent mood logs
   */
  async getRecentMoodLogs(limit: number = 30): Promise<MoodLog[]> {
    try {
      const results = await this.db.getAllAsync<any>(
        `
        SELECT * FROM mood_logs 
        ORDER BY timestamp DESC 
        LIMIT ?
      `,
        [limit],
      );

      return results.map((row) => this.mapRowToMoodLog(row));
    } catch (error) {
      console.error("Error getting recent mood logs:", error);
      return [];
    }
  }

  /**
   * Update a mood log
   */
  async updateMoodLog(
    id: string,
    updates: Partial<Omit<MoodLog, "id" | "createdAt" | "updatedAt">>,
  ): Promise<boolean> {
    try {
      const fields = [];
      const values = [];

      if (updates.mood !== undefined) {
        fields.push("mood = ?");
        values.push(updates.mood);
      }
      if (updates.energy !== undefined) {
        fields.push("energy = ?");
        values.push(updates.energy);
      }
      if (updates.stress !== undefined) {
        fields.push("stress = ?");
        values.push(updates.stress);
      }
      if (updates.context !== undefined) {
        fields.push("context = ?");
        values.push(updates.context);
      }
      if (updates.tags !== undefined) {
        fields.push("tags = ?");
        values.push(JSON.stringify(updates.tags));
      }
      if (updates.notes !== undefined) {
        fields.push("notes = ?");
        values.push(updates.notes);
      }

      if (fields.length === 0) return false;

      fields.push("updated_at = ?");
      values.push(new Date().toISOString());
      values.push(id);

      await this.db.runAsync(
        `
        UPDATE mood_logs 
        SET ${fields.join(", ")} 
        WHERE id = ?
      `,
        values,
      );

      return true;
    } catch (error) {
      console.error("Error updating mood log:", error);
      return false;
    }
  }

  /**
   * Delete a mood log
   */
  async deleteMoodLog(id: string): Promise<boolean> {
    try {
      await this.db.runAsync("DELETE FROM mood_logs WHERE id = ?", [id]);
      return true;
    } catch (error) {
      console.error("Error deleting mood log:", error);
      return false;
    }
  }

  /**
   * Get average mood for a specific date
   */
  async getAverageMoodForDate(date: string): Promise<number | null> {
    try {
      const result = await this.db.getFirstAsync<{ avg_mood: number }>(
        `
        SELECT AVG(mood) as avg_mood 
        FROM mood_logs 
        WHERE date = ?
      `,
        [date],
      );

      return result?.avg_mood || null;
    } catch (error) {
      console.error("Error getting average mood for date:", error);
      return null;
    }
  }

  /**
   * Get mood statistics for a date range
   */
  async getMoodStats(
    startDate: string,
    endDate: string,
  ): Promise<{
    averageMood: number;
    averageEnergy: number;
    averageStress: number;
    moodCount: number;
    topTags: string[];
  }> {
    try {
      const result = await this.db.getFirstAsync<{
        avg_mood: number;
        avg_energy: number;
        avg_stress: number;
        count: number;
      }>(
        `
        SELECT 
          AVG(mood) as avg_mood,
          AVG(energy) as avg_energy,
          AVG(stress) as avg_stress,
          COUNT(*) as count
        FROM mood_logs 
        WHERE date BETWEEN ? AND ?
      `,
        [startDate, endDate],
      );

      // Get top tags
      const tagResults = await this.db.getAllAsync<{
        tag: string;
        count: number;
      }>(
        `
        SELECT 
          json_each.value as tag,
          COUNT(*) as count
        FROM mood_logs, json_each(mood_logs.tags)
        WHERE mood_logs.date BETWEEN ? AND ?
        GROUP BY json_each.value
        ORDER BY count DESC
        LIMIT 5
      `,
        [startDate, endDate],
      );

      return {
        averageMood: result?.avg_mood || 0,
        averageEnergy: result?.avg_energy || 0,
        averageStress: result?.avg_stress || 0,
        moodCount: result?.count || 0,
        topTags: tagResults.map((r) => r.tag),
      };
    } catch (error) {
      console.error("Error getting mood stats:", error);
      return {
        averageMood: 0,
        averageEnergy: 0,
        averageStress: 0,
        moodCount: 0,
        topTags: [],
      };
    }
  }

  /**
   * Get mood trend over time
   */
  async getMoodTrend(
    days: number = 30,
  ): Promise<
    Array<{ date: string; mood: number; energy: number; stress: number }>
  > {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    try {
      const results = await this.db.getAllAsync<{
        date: string;
        avg_mood: number;
        avg_energy: number;
        avg_stress: number;
      }>(
        `
        SELECT 
          date,
          AVG(mood) as avg_mood,
          AVG(energy) as avg_energy,
          AVG(stress) as avg_stress
        FROM mood_logs 
        WHERE date BETWEEN ? AND ?
        GROUP BY date
        ORDER BY date ASC
      `,
        [startDate, endDate],
      );

      return results.map((row) => ({
        date: row.date,
        mood: row.avg_mood,
        energy: row.avg_energy,
        stress: row.avg_stress,
      }));
    } catch (error) {
      console.error("Error getting mood trend:", error);
      return [];
    }
  }

  /**
   * Map database row to MoodLog object
   */
  private mapRowToMoodLog(row: any): MoodLog {
    return {
      id: row.id,
      date: row.date,
      mood: row.mood,
      energy: row.energy,
      stress: row.stress,
      context: row.context,
      tags: JSON.parse(row.tags || "[]"),
      notes: row.notes,
      timestamp: row.timestamp,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
