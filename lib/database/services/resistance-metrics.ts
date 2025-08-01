import { SQLiteDatabase } from "expo-sqlite";
import { ResistanceMetrics } from "../types";

export class ResistanceMetricsService {
  constructor(private db: SQLiteDatabase) {}

  async createResistanceMetricsTable(): Promise<void> {
    await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS resistance_metrics (
        id TEXT PRIMARY KEY,
        addiction_type TEXT NOT NULL,
        total_urges INTEGER DEFAULT 0,
        total_resisted INTEGER DEFAULT 0,
        resistance_rate REAL DEFAULT 0,
        consecutive_resistances INTEGER DEFAULT 0,
        best_resistance_streak INTEGER DEFAULT 0,
        total_resistance_score INTEGER DEFAULT 0,
        difficult_urges_resisted INTEGER DEFAULT 0,
        trigger_mastery TEXT DEFAULT '{}',
        last_resistance_date TEXT,
        updated_at TEXT NOT NULL,
        UNIQUE(addiction_type)
      );
    `);
  }

  async updateResistanceMetrics(
    addictionType: string,
    wasResisted: boolean,
    urgeIntensity: number,
    trigger?: string,
  ): Promise<void> {
    const now = new Date().toISOString();

    // Get existing metrics or create new
    let metrics = await this.getResistanceMetrics(addictionType);

    if (!metrics) {
      // Create new metrics record
      const newId = `resistance_${addictionType}_${Date.now()}`;
      metrics = {
        id: newId,
        addictionType,
        totalUrges: 0,
        totalResisted: 0,
        resistanceRate: 0,
        consecutiveResistances: 0,
        bestResistanceStreak: 0,
        totalResistanceScore: 0,
        difficultUrgesResisted: 0,
        triggerMastery: "{}",
        lastResistanceDate: null,
        updatedAt: now,
      };
    }

    // Update metrics
    metrics.totalUrges += 1;

    if (wasResisted) {
      metrics.totalResisted += 1;
      metrics.consecutiveResistances += 1;
      metrics.lastResistanceDate = now;

      // Calculate resistance score with intensity bonus
      const baseScore = 10;
      const intensityBonus = urgeIntensity * 2; // Higher intensity = more points
      const comboBonus = Math.min(metrics.consecutiveResistances * 0.5, 20); // Max 20 bonus points
      const resistanceScore = Math.round(
        baseScore + intensityBonus + comboBonus,
      );

      metrics.totalResistanceScore += resistanceScore;

      // Track difficult urges (intensity 4-5)
      if (urgeIntensity >= 4) {
        metrics.difficultUrgesResisted += 1;
      }

      // Update best streak
      if (metrics.consecutiveResistances > metrics.bestResistanceStreak) {
        metrics.bestResistanceStreak = metrics.consecutiveResistances;
      }

      // Update trigger mastery
      if (trigger) {
        const triggerData = JSON.parse(metrics.triggerMastery);
        triggerData[trigger] = (triggerData[trigger] || 0) + 1;
        metrics.triggerMastery = JSON.stringify(triggerData);
      }
    } else {
      // Reset consecutive resistances on relapse
      metrics.consecutiveResistances = 0;
    }

    // Calculate resistance rate
    metrics.resistanceRate = Math.round(
      (metrics.totalResisted / metrics.totalUrges) * 100,
    );
    metrics.updatedAt = now;

    // Save to database
    await this.db.runAsync(
      `
      INSERT OR REPLACE INTO resistance_metrics (
        id, addiction_type, total_urges, total_resisted, resistance_rate,
        consecutive_resistances, best_resistance_streak, total_resistance_score,
        difficult_urges_resisted, trigger_mastery, last_resistance_date, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        metrics.id,
        metrics.addictionType,
        metrics.totalUrges,
        metrics.totalResisted,
        metrics.resistanceRate,
        metrics.consecutiveResistances,
        metrics.bestResistanceStreak,
        metrics.totalResistanceScore,
        metrics.difficultUrgesResisted,
        metrics.triggerMastery,
        metrics.lastResistanceDate,
        metrics.updatedAt,
      ],
    );
  }

  async getResistanceMetrics(
    addictionType: string,
  ): Promise<ResistanceMetrics | null> {
    const result = await this.db.getFirstAsync<any>(
      `
      SELECT * FROM resistance_metrics WHERE addiction_type = ?
    `,
      [addictionType],
    );

    if (!result) return null;

    return {
      id: result.id as string,
      addictionType: result.addiction_type as string,
      totalUrges: result.total_urges as number,
      totalResisted: result.total_resisted as number,
      resistanceRate: result.resistance_rate as number,
      consecutiveResistances: result.consecutive_resistances as number,
      bestResistanceStreak: result.best_resistance_streak as number,
      totalResistanceScore: result.total_resistance_score as number,
      difficultUrgesResisted: result.difficult_urges_resisted as number,
      triggerMastery: result.trigger_mastery as string,
      lastResistanceDate: result.last_resistance_date as string | null,
      updatedAt: result.updated_at as string,
    };
  }

  async getAllResistanceMetrics(): Promise<ResistanceMetrics[]> {
    const results = await this.db.getAllAsync<any>(`
      SELECT * FROM resistance_metrics ORDER BY updated_at DESC
    `);

    return results.map((row: any) => ({
      id: row.id as string,
      addictionType: row.addiction_type as string,
      totalUrges: row.total_urges as number,
      totalResisted: row.total_resisted as number,
      resistanceRate: row.resistance_rate as number,
      consecutiveResistances: row.consecutive_resistances as number,
      bestResistanceStreak: row.best_resistance_streak as number,
      totalResistanceScore: row.total_resistance_score as number,
      difficultUrgesResisted: row.difficult_urges_resisted as number,
      triggerMastery: row.trigger_mastery as string,
      lastResistanceDate: row.last_resistance_date as string | null,
      updatedAt: row.updated_at as string,
    }));
  }

  calculateResistanceLevel(
    resistanceRate: number,
    totalResisted: number,
  ): {
    level: string;
    badge: string;
    description: string;
  } {
    if (resistanceRate >= 90 && totalResisted >= 50) {
      return {
        level: "Master of Resistance",
        badge: "🏆",
        description: "Exceptional self-control and dedication",
      };
    } else if (resistanceRate >= 80 && totalResisted >= 30) {
      return {
        level: "Resistance Champion",
        badge: "🥇",
        description: "Strong willpower and consistency",
      };
    } else if (resistanceRate >= 70 && totalResisted >= 20) {
      return {
        level: "Determined Fighter",
        badge: "⚔️",
        description: "Building strong resistance habits",
      };
    } else if (resistanceRate >= 60 && totalResisted >= 10) {
      return {
        level: "Growing Stronger",
        badge: "💪",
        description: "Making solid progress",
      };
    } else if (totalResisted >= 5) {
      return {
        level: "First Steps",
        badge: "🌱",
        description: "Beginning your resistance journey",
      };
    } else {
      return {
        level: "Starting Out",
        badge: "🎯",
        description: "Every journey begins with a single step",
      };
    }
  }

  generateResistanceMessage(
    metrics: ResistanceMetrics,
    wasResisted: boolean,
    urgeIntensity: number,
  ): {
    title: string;
    message: string;
    encouragement: string;
  } {
    const level = this.calculateResistanceLevel(
      metrics.resistanceRate,
      metrics.totalResisted,
    );

    if (wasResisted) {
      const scoreGained =
        10 +
        urgeIntensity * 2 +
        Math.min(metrics.consecutiveResistances * 0.5, 20);

      if (urgeIntensity >= 4) {
        return {
          title: `${level.badge} Incredible Strength!`,
          message: `You resisted a level ${urgeIntensity} urge! That's ${Math.round(scoreGained)} resistance points.`,
          encouragement: `Conquering difficult urges like this builds incredible mental strength. You're proving your power over addiction!`,
        };
      } else if (metrics.consecutiveResistances >= 10) {
        return {
          title: `${level.badge} Unstoppable Streak!`,
          message: `${metrics.consecutiveResistances} consecutive resistances! +${Math.round(scoreGained)} points with combo bonus!`,
          encouragement: `This streak is evidence of your growing mastery. Each resistance makes the next one easier!`,
        };
      } else {
        return {
          title: `${level.badge} Victory!`,
          message: `Urge resisted successfully! +${Math.round(scoreGained)} resistance points earned.`,
          encouragement: `Every resistance is a victory worth celebrating. You're building unbreakable habits!`,
        };
      }
    } else {
      return {
        title: "🤗 Tomorrow is a New Day",
        message: "Recovery isn't about perfection, it's about progress.",
        encouragement: `You've resisted ${metrics.totalResisted} urges before - that strength is still within you. Learn from this moment and keep moving forward.`,
      };
    }
  }
}
