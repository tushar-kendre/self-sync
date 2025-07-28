import { SQLiteDatabase } from 'expo-sqlite';
import { AddictionLog } from '../types';

export class AddictionLogService {
  constructor(private db: SQLiteDatabase) {}

  async createAddictionLog(data: Omit<AddictionLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<AddictionLog> {
    const id = `addiction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newLog: AddictionLog = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    };

    await this.db.runAsync(`
      INSERT INTO addiction_logs (
        id, date, addiction_type, event_type, was_resisted, urge_intensity,
        duration_minutes, trigger, location, mood_before, mood_after,
        coping_strategy, notes, timestamp, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newLog.id, newLog.date, newLog.addictionType, newLog.eventType,
      newLog.wasResisted ? 1 : 0, newLog.urgeIntensity, newLog.durationMinutes,
      newLog.trigger, newLog.location, newLog.moodBefore, newLog.moodAfter,
      newLog.copingStrategy, newLog.notes, newLog.timestamp,
      newLog.createdAt, newLog.updatedAt
    ]);

    return newLog;
  }

  async getAddictionLogsByDate(date: string): Promise<AddictionLog[]> {
    const results = await this.db.getAllAsync<any>(`
      SELECT * FROM addiction_logs WHERE date = ? ORDER BY timestamp DESC
    `, [date]);

    return results.map(this.mapRowToAddictionLog);
  }

  async getRecentAddictionLogs(limit: number = 50): Promise<AddictionLog[]> {
    const results = await this.db.getAllAsync<any>(`
      SELECT * FROM addiction_logs ORDER BY timestamp DESC LIMIT ?
    `, [limit]);

    return results.map(this.mapRowToAddictionLog);
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
      updatedAt: row.updated_at
    };
  }
}
