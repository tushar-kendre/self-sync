import { SQLiteDatabase } from 'expo-sqlite';
import { HealthyHabit, HabitCompletion } from '../types';

export class HabitService {
  constructor(private db: SQLiteDatabase) {}

  async createHabit(data: Omit<HealthyHabit, 'id' | 'createdAt' | 'updatedAt'>): Promise<HealthyHabit> {
    const id = `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newHabit: HealthyHabit = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    };

    await this.db.runAsync(`
      INSERT INTO healthy_habits (
        id, name, description, category, target_frequency, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newHabit.id, newHabit.name, newHabit.description, newHabit.category,
      newHabit.targetFrequency, newHabit.isActive ? 1 : 0,
      newHabit.createdAt, newHabit.updatedAt
    ]);

    return newHabit;
  }

  async completeHabit(data: Omit<HabitCompletion, 'id' | 'createdAt'>): Promise<HabitCompletion> {
    const id = `completion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const completion: HabitCompletion = {
      id,
      ...data,
      createdAt: now
    };

    await this.db.runAsync(`
      INSERT OR REPLACE INTO habit_completions (
        id, habit_id, date, completed, difficulty, time_spent, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      completion.id, completion.habitId, completion.date,
      completion.completed ? 1 : 0, completion.difficulty,
      completion.timeSpent, completion.notes, completion.createdAt
    ]);

    return completion;
  }

  async getAllHabits(): Promise<HealthyHabit[]> {
    const results = await this.db.getAllAsync<any>(`
      SELECT * FROM healthy_habits WHERE is_active = 1 ORDER BY name
    `);

    return results.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      targetFrequency: row.target_frequency,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }
}
