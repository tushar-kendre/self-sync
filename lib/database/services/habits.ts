import { SQLiteDatabase } from "expo-sqlite";
import { HealthyHabit, HabitCompletion } from "../types";
import { StreakService } from "./streaks";

export class HabitService {
  constructor(private db: SQLiteDatabase) {}

  async createHabit(
    data: Omit<HealthyHabit, "id" | "createdAt" | "updatedAt">,
  ): Promise<HealthyHabit> {
    const id = `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newHabit: HealthyHabit = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.runAsync(
      `
      INSERT INTO healthy_habits (
        id, name, description, category, target_frequency, tracking_type, target_value, unit, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        newHabit.id,
        newHabit.name,
        newHabit.description,
        newHabit.category,
        newHabit.targetFrequency,
        newHabit.trackingType,
        newHabit.targetValue,
        newHabit.unit,
        newHabit.isActive ? 1 : 0,
        newHabit.createdAt,
        newHabit.updatedAt,
      ],
    );

    return newHabit;
  }

  async completeHabit(
    data: Omit<HabitCompletion, "id" | "createdAt">,
  ): Promise<HabitCompletion> {
    const id = `completion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const completion: HabitCompletion = {
      id,
      ...data,
      createdAt: now,
    };

    await this.db.runAsync(
      `
      INSERT OR REPLACE INTO habit_completions (
        id, habit_id, date, completed, current_value, difficulty, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        completion.id,
        completion.habitId,
        completion.date,
        completion.completed ? 1 : 0,
        completion.currentValue,
        completion.difficulty,
        completion.notes,
        completion.createdAt,
        completion.updatedAt,
      ],
    );

  // Update / create habit streak when marked completed (single implementation)
    if (completion.completed) {
      try {
        const habitRow = await this.db.getFirstAsync<any>(
          `SELECT name FROM healthy_habits WHERE id = ?`,
          [completion.habitId]
        );
        if (habitRow?.name) {
          const rawName: string = habitRow.name as string;
            // Derive a stable streak key (avoid spaces & capitalization)
          const habitKey = rawName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_|_$/g, "")
            .slice(0, 30); // limit length
          // Only track specific well-known positive habit keys for styling clarity
          const allowed = ["exercise","meditation","sleep","hydration","read","reading","gratitude","steps","deep_work"];
          const streakKey = allowed.find(a => habitKey.startsWith(a)) || habitKey;
          const { StreakService } = await import("./streaks");
          const streakService = new StreakService(this.db);
          await streakService.updateHabitStreak(streakKey);
        }
      } catch (e) {
        console.warn("Habit streak update failed", e);
      }
    }

    return completion;
  }

  /**
   * Map a habit name to a streak key used for display on the dashboard
   */
  private mapHabitNameToStreakKey(nameLower: string): string | null {
    if (nameLower.includes("exercise") || nameLower.includes("workout")) return "exercise";
    if (nameLower.includes("meditat")) return "meditation";
    if (nameLower.includes("water") || nameLower.includes("hydrate")) return "hydration";
    if (nameLower.includes("read")) return "reading";
    if (nameLower.includes("gratitude")) return "gratitude";
    if (nameLower.includes("deep work") || nameLower.includes("focus")) return "deep_work";
    if (nameLower.includes("step")) return "steps";
    return null; // Unmapped habits won't create streak entries (can extend later)
  }

  async getAllHabits(): Promise<HealthyHabit[]> {
    const results = await this.db.getAllAsync<any>(`
      SELECT * FROM healthy_habits WHERE is_active = 1 ORDER BY name
    `);

    return results.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      targetFrequency: row.target_frequency,
      trackingType: row.tracking_type || 'completion',
      targetValue: row.target_value,
      unit: row.unit,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getTodayCompletions(date: string): Promise<HabitCompletion[]> {
    const results = await this.db.getAllAsync<any>(`
      SELECT * FROM habit_completions WHERE date = ? ORDER BY created_at DESC
    `, [date]);

    return results.map((row) => ({
      id: row.id,
      habitId: row.habit_id,
      date: row.date,
      completed: row.completed === 1,
      currentValue: row.current_value || 0,
      difficulty: row.difficulty,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getCompletionForHabitAndDate(habitId: string, date: string): Promise<HabitCompletion | null> {
    const result = await this.db.getFirstAsync<any>(`
      SELECT * FROM habit_completions WHERE habit_id = ? AND date = ?
    `, [habitId, date]);

    if (!result) return null;

    return {
      id: result.id,
      habitId: result.habit_id,
      date: result.date,
      completed: result.completed === 1,
      currentValue: result.current_value || 0,
      difficulty: result.difficulty,
      notes: result.notes,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }

  /**
   * Recent habit completions across all habits (for dashboard)
   */
  async getRecentHabitCompletions(limit: number = 50): Promise<HabitCompletion[]> {
    const results = await this.db.getAllAsync<any>(
      `SELECT * FROM habit_completions ORDER BY date DESC, created_at DESC LIMIT ?`,
      [limit]
    );
    return results.map((row) => ({
      id: row.id,
      habitId: row.habit_id,
      date: row.date,
      completed: row.completed === 1,
      currentValue: row.current_value || 0,
      difficulty: row.difficulty,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getHabitStats(habitId: string, days: number = 30): Promise<{
    totalCompletions: number;
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    const completions = await this.db.getAllAsync<any>(`
      SELECT date, completed FROM habit_completions 
      WHERE habit_id = ? AND date >= ? 
      ORDER BY date DESC
    `, [habitId, startDateStr]);

    const totalCompletions = completions.filter(c => c.completed === 1).length;
    const completionRate = completions.length > 0 ? (totalCompletions / completions.length) * 100 : 0;

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split("T")[0];
    let currentDate = new Date(today);

    for (const completion of completions) {
      const completionDate = currentDate.toISOString().split("T")[0];
      const foundCompletion = completions.find(c => c.date === completionDate && c.completed === 1);
      
      if (foundCompletion) {
        currentStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak (simplified)
    let longestStreak = currentStreak;
    let tempStreak = 0;
    
    for (const completion of completions.reverse()) {
      if (completion.completed === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return {
      totalCompletions,
      completionRate: Math.round(completionRate),
      currentStreak,
      longestStreak,
    };
  }

  async initializeDefaultHabits(): Promise<void> {
    // Check if default habits already exist
    const existingHabits = await this.getAllHabits();
    if (existingHabits.length > 0) return;

    const defaultHabits = [
      {
        name: "Morning Exercise",
        description: "Start your day with physical activity",
        category: "physical" as const,
        targetFrequency: "daily" as const,
        trackingType: "duration" as const,
        targetValue: 30,
        unit: "minutes",
        isActive: true,
      },
      {
        name: "Meditation",
        description: "Practice mindfulness and meditation",
        category: "spiritual" as const,
        targetFrequency: "daily" as const,
        trackingType: "duration" as const,
        targetValue: 10,
        unit: "minutes",
        isActive: true,
      },
      {
        name: "Read Book",
        description: "Read for personal growth and learning",
        category: "mental" as const,
        targetFrequency: "daily" as const,
        trackingType: "duration" as const,
        targetValue: 30,
        unit: "minutes",
        isActive: true,
      },
      {
        name: "Drink Water",
        description: "Stay hydrated throughout the day",
        category: "physical" as const,
        targetFrequency: "daily" as const,
        trackingType: "count" as const,
        targetValue: 8,
        unit: "glasses",
        isActive: true,
      },
      {
        name: "Connect with Friends",
        description: "Reach out to friends or family members",
        category: "social" as const,
        targetFrequency: "daily" as const,
        trackingType: "count" as const,
        targetValue: 1,
        unit: "people",
        isActive: true,
      },
      {
        name: "Gratitude Practice",
        description: "Write down things you're grateful for",
        category: "mental" as const,
        targetFrequency: "daily" as const,
        trackingType: "count" as const,
        targetValue: 3,
        unit: "items",
        isActive: true,
      },
      {
        name: "Deep Work Session",
        description: "Focus on important tasks without distractions",
        category: "productivity" as const,
        targetFrequency: "daily" as const,
        trackingType: "duration" as const,
        targetValue: 90,
        unit: "minutes",
        isActive: true,
      },
      {
        name: "Steps",
        description: "Daily step count for fitness",
        category: "physical" as const,
        targetFrequency: "daily" as const,
        trackingType: "count" as const,
        targetValue: 10000,
        unit: "steps",
        isActive: true,
      },
    ];    for (const habit of defaultHabits) {
      await this.createHabit(habit);
    }

    console.log("✅ Default habits initialized");
  }
}
