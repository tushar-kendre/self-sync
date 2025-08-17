import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import {
  SleepLogService,
  MoodLogService,
  AddictionLogService,
  HabitService,
  StreakService,
  CrisisResourceService,
  AppSettingsService,
  AIInsightService,
  JournalService,
  ResistanceMetricsService,
} from "./services";

// Database schema creation SQL
const CREATE_TABLES_SQL = `
-- Sleep tracking table
CREATE TABLE IF NOT EXISTS sleep_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  bed_time TEXT NOT NULL,
  wake_time TEXT NOT NULL,
  sleep_duration_hours REAL NOT NULL,
  sleep_quality INTEGER DEFAULT 3,
  sleep_interruptions INTEGER DEFAULT 0,
  dream_recall INTEGER DEFAULT 0,
  environment TEXT DEFAULT 'bedroom',
  notes TEXT,
  timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Addiction/behavior tracking table
CREATE TABLE IF NOT EXISTS addiction_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  addiction_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  was_resisted INTEGER DEFAULT 0,
  urge_intensity INTEGER,
  duration_minutes INTEGER,
  trigger TEXT,
  location TEXT,
  mood_before INTEGER DEFAULT 3,
  mood_after INTEGER DEFAULT 3,
  coping_strategy TEXT,
  notes TEXT,
  timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Multiple mood entries per day
CREATE TABLE IF NOT EXISTS mood_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  mood INTEGER NOT NULL,
  energy INTEGER DEFAULT 3,
  stress INTEGER DEFAULT 3,
  context TEXT,
  tags TEXT DEFAULT '[]',
  notes TEXT,
  timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Available healthy habits library
CREATE TABLE IF NOT EXISTS healthy_habits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'physical',
  target_frequency TEXT DEFAULT 'daily',
  tracking_type TEXT DEFAULT 'completion',
  target_value INTEGER,
  unit TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Daily habit completion tracking
CREATE TABLE IF NOT EXISTS habit_completions (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL,
  date TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  current_value INTEGER DEFAULT 0,
  difficulty INTEGER DEFAULT 3,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (habit_id) REFERENCES healthy_habits(id) ON DELETE CASCADE
);

-- Crisis support resources
CREATE TABLE IF NOT EXISTS crisis_resources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  contact TEXT NOT NULL,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Application settings
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  type TEXT DEFAULT 'string',
  updated_at TEXT NOT NULL
);

-- AI insights
CREATE TABLE IF NOT EXISTS ai_insights (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence REAL DEFAULT 0.8,
  metadata TEXT DEFAULT '{}',
  is_read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  expires_at TEXT
);

-- Streak tracking
CREATE TABLE IF NOT EXISTS streaks (
  id TEXT PRIMARY KEY,
  behavior_type TEXT UNIQUE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_reset_date TEXT,
  start_date TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Personal journaling table
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  mood INTEGER CHECK (mood BETWEEN 1 AND 5),
  tags TEXT,
  is_private INTEGER DEFAULT 1,
  word_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

// Indexes for performance
const CREATE_INDEXES_SQL = `
-- Sleep logs indexes
CREATE INDEX IF NOT EXISTS idx_sleep_logs_date ON sleep_logs(date);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_timestamp ON sleep_logs(timestamp);

-- Addiction logs indexes
CREATE INDEX IF NOT EXISTS idx_addiction_logs_date ON addiction_logs(date);
CREATE INDEX IF NOT EXISTS idx_addiction_logs_type_date ON addiction_logs(addiction_type, date);
CREATE INDEX IF NOT EXISTS idx_addiction_logs_timestamp ON addiction_logs(timestamp);

-- Mood logs indexes
CREATE INDEX IF NOT EXISTS idx_mood_logs_date ON mood_logs(date);
CREATE INDEX IF NOT EXISTS idx_mood_logs_timestamp ON mood_logs(timestamp);

-- Habit completions indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_completions_habit_date ON habit_completions(habit_id, date);

-- Crisis resources indexes
CREATE INDEX IF NOT EXISTS idx_crisis_resources_priority ON crisis_resources(priority, is_active);

-- AI insights indexes
CREATE INDEX IF NOT EXISTS idx_ai_insights_type_created ON ai_insights(type, created_at);

-- Streaks indexes
CREATE INDEX IF NOT EXISTS idx_streaks_behavior_type ON streaks(behavior_type);

-- Journal entries indexes
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_journal_entries_mood ON journal_entries(mood);
`;

// Default data
const DEFAULT_HEALTHY_HABITS = [
  {
    id: "habit-1",
    name: "Morning Exercise",
    description: "Daily physical activity to start the day",
    category: "physical",
    target_frequency: "daily",
    tracking_type: "duration",
    target_value: 30,
    unit: "minutes",
  },
  {
    id: "habit-2",
    name: "Meditation",
    description: "Mindfulness meditation practice",
    category: "spiritual",
    target_frequency: "daily",
    tracking_type: "duration",
    target_value: 10,
    unit: "minutes",
  },
  {
    id: "habit-3",
    name: "Read Book",
    description: "Daily reading for personal growth",
    category: "mental",
    target_frequency: "daily",
    tracking_type: "duration",
    target_value: 30,
    unit: "minutes",
  },
  {
    id: "habit-4",
    name: "Drink Water",
    description: "Stay hydrated throughout the day",
    category: "physical",
    target_frequency: "daily",
    tracking_type: "count",
    target_value: 8,
    unit: "glasses",
  },
  {
    id: "habit-5",
    name: "Gratitude Practice",
    description: "Write down things you're grateful for",
    category: "mental",
    target_frequency: "daily",
    tracking_type: "count",
    target_value: 3,
    unit: "items",
  },
  {
    id: "habit-6",
    name: "Connect with Friends",
    description: "Reach out to friends or family",
    category: "social",
    target_frequency: "daily",
    tracking_type: "count",
    target_value: 1,
    unit: "people",
  },
  {
    id: "habit-7",
    name: "Deep Work Session",
    description: "Focused work without distractions",
    category: "productivity",
    target_frequency: "daily",
    tracking_type: "duration",
    target_value: 90,
    unit: "minutes",
  },
  {
    id: "habit-8",
    name: "Steps",
    description: "Daily step count for fitness",
    category: "physical",
    target_frequency: "daily",
    tracking_type: "count",
    target_value: 10000,
    unit: "steps",
  },
];

const DEFAULT_CRISIS_RESOURCES = [
  {
    id: "crisis-1",
    name: "National Suicide Prevention Lifeline",
    type: "hotline",
    contact: "988",
    description: "Free, confidential 24/7 crisis support",
    priority: 1,
  },
  {
    id: "crisis-2",
    name: "Crisis Text Line",
    type: "chat",
    contact: "Text HOME to 741741",
    description: "Free, 24/7 crisis support via text",
    priority: 2,
  },
  {
    id: "crisis-3",
    name: "Emergency Services",
    type: "emergency",
    contact: "911",
    description: "For immediate emergency assistance",
    priority: 1,
  },
];

const DEFAULT_APP_SETTINGS = [
  { key: "theme", value: "system", type: "string" },
  { key: "notifications_enabled", value: "true", type: "boolean" },
  { key: "reminder_time", value: "20:00", type: "string" },
  { key: "user_name", value: "", type: "string" },
  { key: "setup_complete", value: "false", type: "boolean" },
];

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitializing = false;

  // Service instances
  public sleepLogs!: SleepLogService;
  public moodLogs!: MoodLogService;
  public addictionLogs!: AddictionLogService;
  public habits!: HabitService;
  public streaks!: StreakService;
  public crisisResources!: CrisisResourceService;
  public appSettings!: AppSettingsService;
  public aiInsights!: AIInsightService;
  public journal!: JournalService;
  public resistanceMetrics!: ResistanceMetricsService;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.db) {
      console.log("✅ Database already initialized");
      return;
    }

    if (this.isInitializing) {
      console.log("⏳ Database initialization in progress...");
      return;
    }

    this.isInitializing = true;

    try {
      console.log("🔄 Initializing database...");

      // Open database
      const databaseName = Platform.OS === "web" ? ":memory:" : "selfsync.db";
      this.db = await SQLite.openDatabaseAsync(databaseName);

      // Enable foreign keys
      await this.db.execAsync("PRAGMA foreign_keys = ON;");

      // Create tables
      await this.db.execAsync(CREATE_TABLES_SQL);

      // Create indexes
      await this.db.execAsync(CREATE_INDEXES_SQL);

      // Initialize service instances
      this.initializeServices();

      // Create additional tables through services
      await this.resistanceMetrics.createResistanceMetricsTable();

      // Insert default data if tables are empty
      await this.insertDefaultData();

      console.log("✅ Database initialized successfully");
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  private initializeServices(): void {
    if (!this.db) throw new Error("Database not initialized");

    this.sleepLogs = new SleepLogService(this.db);
    this.moodLogs = new MoodLogService(this.db);
    this.addictionLogs = new AddictionLogService(this.db);
    this.habits = new HabitService(this.db);
    this.streaks = new StreakService(this.db);
    this.crisisResources = new CrisisResourceService(this.db);
    this.appSettings = new AppSettingsService(this.db);
    this.aiInsights = new AIInsightService(this.db);
    this.journal = new JournalService(this.db);
    this.resistanceMetrics = new ResistanceMetricsService(this.db);
  }

  private async insertDefaultData(): Promise<void> {
    if (!this.db) return;

    try {
      // Check if default data already exists
      const habitCount = await this.db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM healthy_habits",
      );
      const crisisCount = await this.db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM crisis_resources",
      );
      const settingsCount = await this.db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM app_settings",
      );

      // Insert default habits
      if (habitCount?.count === 0) {
        for (const habit of DEFAULT_HEALTHY_HABITS) {
          const now = new Date().toISOString();
          await this.db.runAsync(
            "INSERT INTO healthy_habits (id, name, description, category, target_frequency, tracking_type, target_value, unit, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              habit.id,
              habit.name,
              habit.description,
              habit.category,
              habit.target_frequency,
              habit.tracking_type,
              habit.target_value,
              habit.unit,
              1,
              now,
              now,
            ],
          );
        }
      }

      // Insert default crisis resources
      if (crisisCount?.count === 0) {
        for (const resource of DEFAULT_CRISIS_RESOURCES) {
          const now = new Date().toISOString();
          await this.db.runAsync(
            "INSERT INTO crisis_resources (id, name, type, contact, description, is_active, priority, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              resource.id,
              resource.name,
              resource.type,
              resource.contact,
              resource.description,
              1,
              resource.priority,
              now,
              now,
            ],
          );
        }
      }

      // Insert default app settings
      if (settingsCount?.count === 0) {
        for (const setting of DEFAULT_APP_SETTINGS) {
          const now = new Date().toISOString();
          await this.db.runAsync(
            "INSERT INTO app_settings (id, key, value, type, updated_at) VALUES (?, ?, ?, ?, ?)",
            [
              `setting-${setting.key}`,
              setting.key,
              setting.value,
              setting.type,
              now,
            ],
          );
        }
      }
    } catch (error) {
      console.error("Error inserting default data:", error);
    }
  }

  public getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.db;
  }

  public async clearAllData(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized. Call initialize() first.");
    }

    try {
      console.log("🗑️ Completely clearing database - dropping all tables...");

      // Drop all tables completely (for complete fresh start in development)
      const tables = [
        'sleep_logs',
        'mood_logs', 
        'addiction_logs',
        'healthy_habits',
        'habit_completions',
        'crisis_resources',
        'app_settings',
        'ai_insights',
        'streaks',
        'journal_entries',
        'resistance_metrics'
      ];

      for (const table of tables) {
        try {
          await this.db.runAsync(`DROP TABLE IF EXISTS ${table}`);
          console.log(`✅ Dropped table: ${table}`);
        } catch (error) {
          console.warn(`⚠️ Failed to drop table ${table}:`, error);
        }
      }

      // Drop indexes as well
      const indexes = [
        'idx_sleep_logs_date',
        'idx_mood_logs_date', 
        'idx_addiction_logs_date',
        'idx_habit_completions_date',
        'idx_habit_completions_habit_id_date',
        'idx_ai_insights_type_created',
        'idx_streaks_behavior_type',
        'idx_journal_entries_date',
        'idx_journal_entries_created_at',
        'idx_journal_entries_mood'
      ];

      for (const index of indexes) {
        try {
          await this.db.runAsync(`DROP INDEX IF EXISTS ${index}`);
          console.log(`✅ Dropped index: ${index}`);
        } catch (error) {
          console.warn(`⚠️ Failed to drop index ${index}:`, error);
        }
      }

      console.log("🔄 Recreating fresh database schema...");
      
      // Recreate all tables fresh
      await this.db.execAsync(CREATE_TABLES_SQL);
      
      // Recreate indexes
      await this.db.execAsync(CREATE_INDEXES_SQL);
      
      // Reinitialize services
      this.initializeServices();
      
      // Create additional tables through services
      await this.resistanceMetrics.createResistanceMetricsTable();
      
      // Reinitialize default data
      await this.insertDefaultData();

      console.log("✅ Database completely cleared and recreated successfully!");
    } catch (error) {
      console.error("❌ Failed to clear database completely:", error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

// Singleton instance
export const dbManager = DatabaseManager.getInstance();
