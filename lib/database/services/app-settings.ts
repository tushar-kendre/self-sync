import { SQLiteDatabase } from "expo-sqlite";
import { AppSetting } from "../types";

export class AppSettingsService {
  constructor(private db: SQLiteDatabase) {}

  async getSetting(key: string): Promise<string | null> {
    const result = await this.db.getFirstAsync<{ value: string }>(
      `
      SELECT value FROM app_settings WHERE key = ?
    `,
      [key],
    );

    return result?.value || null;
  }

  async setSetting(
    key: string,
    value: string,
    type: string = "string",
  ): Promise<void> {
    const id = `setting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await this.db.runAsync(
      `
      INSERT OR REPLACE INTO app_settings (id, key, value, type, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `,
      [id, key, value, type, now],
    );
  }

  async getAllSettings(): Promise<AppSetting[]> {
    const results = await this.db.getAllAsync<any>(`
      SELECT * FROM app_settings ORDER BY key
    `);

    return results.map((row) => ({
      id: row.id,
      key: row.key,
      value: row.value,
      type: row.type,
      updatedAt: row.updated_at,
    }));
  }

  // User settings convenience methods
  async getUserName(): Promise<string | null> {
    return this.getSetting("user_name");
  }

  async setUserName(name: string): Promise<void> {
    await this.setSetting("user_name", name, "string");
  }

  async isFirstTime(): Promise<boolean> {
    const setting = await this.getSetting("first_time_setup");
    return setting !== "false";
  }

  async markSetupComplete(): Promise<void> {
    await this.setSetting("first_time_setup", "false", "boolean");
  }

  // Theme settings convenience methods
  async getThemePreference(): Promise<"light" | "dark" | null> {
    const theme = await this.getSetting("theme_preference");
    return theme as "light" | "dark" | null;
  }

  async setThemePreference(theme: "light" | "dark"): Promise<void> {
    await this.setSetting("theme_preference", theme, "string");
  }
}
