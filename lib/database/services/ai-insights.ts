import { SQLiteDatabase } from "expo-sqlite";
import { AIInsight } from "../types";

export class AIInsightService {
  constructor(private db: SQLiteDatabase) {}

  async createInsight(
    data: Omit<AIInsight, "id" | "createdAt">,
  ): Promise<AIInsight> {
    const id = `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const insight: AIInsight = {
      id,
      ...data,
      createdAt: now,
    };

    await this.db.runAsync(
      `
      INSERT INTO ai_insights (
        id, type, title, content, confidence, metadata, 
        is_read, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        insight.id,
        insight.type,
        insight.title,
        insight.content,
        insight.confidence,
        JSON.stringify(insight.metadata),
        insight.isRead ? 1 : 0,
        insight.createdAt,
        insight.expiresAt,
      ],
    );

    return insight;
  }

  async getUnreadInsights(): Promise<AIInsight[]> {
    const results = await this.db.getAllAsync<any>(`
      SELECT * FROM ai_insights 
      WHERE is_read = 0 AND (expires_at IS NULL OR expires_at > datetime('now'))
      ORDER BY created_at DESC
    `);

    return results.map(this.mapRowToInsight);
  }

  async markAsRead(id: string): Promise<void> {
    await this.db.runAsync(
      `
      UPDATE ai_insights SET is_read = 1 WHERE id = ?
    `,
      [id],
    );
  }

  private mapRowToInsight(row: any): AIInsight {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      content: row.content,
      confidence: row.confidence,
      metadata: JSON.parse(row.metadata || "{}"),
      isRead: row.is_read === 1,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    };
  }
}
