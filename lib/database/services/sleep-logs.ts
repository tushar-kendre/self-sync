import { SQLiteDatabase } from 'expo-sqlite';
import { SleepLog } from '../types';
import { StreakService } from './streaks';

export class SleepLogService {
  constructor(private db: SQLiteDatabase) {}

  /**
   * Create a new sleep log entry
   */
  async createSleepLog(data: Omit<SleepLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<SleepLog> {
    const now = new Date().toISOString();
    const id = `sleep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const newEntry: SleepLog = {
        id,
        ...data,
        createdAt: now,
        updatedAt: now
      };

      await this.db.runAsync(
        `INSERT INTO sleep_logs (
          id, date, bed_time, wake_time, sleep_duration_hours, 
          sleep_quality, sleep_interruptions, dream_recall, 
          environment, notes, timestamp, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newEntry.id,
          newEntry.date,
          newEntry.bedTime,
          newEntry.wakeTime,
          newEntry.sleepDurationHours,
          newEntry.sleepQuality,
          newEntry.sleepInterruptions,
          newEntry.dreamRecall ? 1 : 0,
          newEntry.environment,
          newEntry.notes,
          newEntry.timestamp,
          newEntry.createdAt,
          newEntry.updatedAt
        ]
      );

      // Update sleep tracking streak
      const streakService = new StreakService(this.db);
      await streakService.updateSleepStreak();

      return newEntry;
    } catch (error) {
      console.error('Error creating sleep log:', error);
      throw error;
    }
  }

  /**
   * Get sleep log by date
   */
  async getSleepLogByDate(date: string): Promise<SleepLog | null> {
    try {
      const result = await this.db.getFirstAsync<any>(
        'SELECT * FROM sleep_logs WHERE date = ?',
        [date]
      );

      if (!result) return null;

      return this.mapRowToSleepLog(result);
    } catch (error) {
      console.error('Error getting sleep log by date:', error);
      return null;
    }
  }

  /**
   * Get sleep logs within a date range
   */
  async getSleepLogsByDateRange(startDate: string, endDate: string): Promise<SleepLog[]> {
    try {
      const results = await this.db.getAllAsync<any>(
        'SELECT * FROM sleep_logs WHERE date BETWEEN ? AND ? ORDER BY date DESC',
        [startDate, endDate]
      );

      return results.map(row => this.mapRowToSleepLog(row));
    } catch (error) {
      console.error('Error getting sleep logs by date range:', error);
      return [];
    }
  }

  /**
   * Get recent sleep logs
   */
  async getRecentSleepLogs(limit: number = 30): Promise<SleepLog[]> {
    try {
      const results = await this.db.getAllAsync<any>(
        'SELECT * FROM sleep_logs ORDER BY date DESC LIMIT ?',
        [limit]
      );

      return results.map(row => this.mapRowToSleepLog(row));
    } catch (error) {
      console.error('Error getting recent sleep logs:', error);
      return [];
    }
  }

  /**
   * Update a sleep log
   */
  async updateSleepLog(id: string, data: Partial<Omit<SleepLog, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> {
    try {
      const fields = [];
      const values = [];

      if (data.bedTime !== undefined) {
        fields.push('bed_time = ?');
        values.push(data.bedTime);
      }
      if (data.wakeTime !== undefined) {
        fields.push('wake_time = ?');
        values.push(data.wakeTime);
      }
      if (data.sleepDurationHours !== undefined) {
        fields.push('sleep_duration_hours = ?');
        values.push(data.sleepDurationHours);
      }
      if (data.sleepQuality !== undefined) {
        fields.push('sleep_quality = ?');
        values.push(data.sleepQuality);
      }
      if (data.sleepInterruptions !== undefined) {
        fields.push('sleep_interruptions = ?');
        values.push(data.sleepInterruptions);
      }
      if (data.dreamRecall !== undefined) {
        fields.push('dream_recall = ?');
        values.push(data.dreamRecall ? 1 : 0);
      }
      if (data.environment !== undefined) {
        fields.push('environment = ?');
        values.push(data.environment);
      }
      if (data.notes !== undefined) {
        fields.push('notes = ?');
        values.push(data.notes);
      }

      if (fields.length === 0) return false;

      fields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      await this.db.runAsync(
        `UPDATE sleep_logs SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return true;
    } catch (error) {
      console.error('Error updating sleep log:', error);
      return false;
    }
  }

  /**
   * Delete a sleep log
   */
  async deleteSleepLog(id: string): Promise<boolean> {
    try {
      await this.db.runAsync('DELETE FROM sleep_logs WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting sleep log:', error);
      return false;
    }
  }

  /**
   * Get sleep statistics
   */
  async getSleepStats(days: number = 30): Promise<{
    averageHours: number;
    averageQuality: number;
    averageEfficiency: number;
    totalLogs: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = new Date().toISOString().split('T')[0];

    try {
      const result = await this.db.getFirstAsync<{
        avg_hours: number;
        avg_quality: number;
        avg_efficiency: number;
        count: number;
      }>(
        `SELECT 
          AVG(sleep_duration_hours) as avg_hours,
          AVG(sleep_quality) as avg_quality,
          AVG(CASE WHEN sleep_duration_hours > 0 THEN (sleep_duration_hours - sleep_interruptions * 0.5) / sleep_duration_hours * 100 ELSE 0 END) as avg_efficiency,
          COUNT(*) as count
        FROM sleep_logs 
        WHERE date BETWEEN ? AND ?`,
        [startDateStr, endDateStr]
      );

      return {
        averageHours: result?.avg_hours || 0,
        averageQuality: result?.avg_quality || 0,
        averageEfficiency: result?.avg_efficiency || 0,
        totalLogs: result?.count || 0
      };
    } catch (error) {
      console.error('Error getting sleep stats:', error);
      return {
        averageHours: 0,
        averageQuality: 0,
        averageEfficiency: 0,
        totalLogs: 0
      };
    }
  }

  /**
   * Get sleep quality trend
   */
  async getSleepQualityTrend(days: number = 30): Promise<Array<{
    date: string;
    quality: number;
    hours: number;
    efficiency: number;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = new Date().toISOString().split('T')[0];

    try {
      const results = await this.db.getAllAsync<{
        date: string;
        quality: number;
        hours: number;
        efficiency: number;
      }>(
        `SELECT 
          date,
          sleep_quality as quality,
          sleep_duration_hours as hours,
          CASE WHEN sleep_duration_hours > 0 THEN (sleep_duration_hours - sleep_interruptions * 0.5) / sleep_duration_hours * 100 ELSE 0 END as efficiency
        FROM sleep_logs 
        WHERE date BETWEEN ? AND ?
        ORDER BY date ASC`,
        [startDateStr, endDateStr]
      );

      return results;
    } catch (error) {
      console.error('Error getting sleep quality trend:', error);
      return [];
    }
  }

  /**
   * Calculate sleep duration between bed time and wake time
   */
  calculateSleepDuration(bedTime: string, wakeTime: string): number {
    const bed = new Date(`1970-01-01T${bedTime}`);
    let wake = new Date(`1970-01-01T${wakeTime}`);
    
    // If wake time is earlier than bed time, assume it's the next day
    if (wake < bed) {
      wake = new Date(`1970-01-02T${wakeTime}`);
    }
    
    const durationMs = wake.getTime() - bed.getTime();
    return durationMs / (1000 * 60 * 60); // Convert to hours
  }

  /**
   * Map database row to SleepLog object
   */
  private mapRowToSleepLog(row: any): SleepLog {
    return {
      id: row.id,
      date: row.date,
      bedTime: row.bed_time,
      wakeTime: row.wake_time,
      sleepDurationHours: row.sleep_duration_hours,
      sleepQuality: row.sleep_quality,
      sleepInterruptions: row.sleep_interruptions,
      dreamRecall: row.dream_recall === 1,
      environment: row.environment,
      notes: row.notes,
      timestamp: row.timestamp,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}