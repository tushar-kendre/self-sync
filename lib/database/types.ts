// Database types for SelfSync tracking app
// Generated from database_schema.dbml

export interface SleepLog {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  bedTime: string; // Time went to bed (ISO time string)
  wakeTime: string; // Time woke up (ISO time string)
  sleepDurationHours: number; // Calculated sleep duration
  sleepQuality: number; // 1-5 rating of sleep quality
  sleepInterruptions: number; // Number of times woken up
  dreamRecall: boolean; // Whether user remembers dreams
  environment: string; // Where user slept (bedroom, hotel, couch, etc.)
  notes: string | null; // Optional sleep notes
  timestamp: string; // When logged (ISO)
  createdAt: string;
  updatedAt: string;
}

export interface AddictionLog {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  addictionType:
    | "porn"
    | "social_media"
    | "alcohol"
    | "smoking"
    | "gambling"
    | "shopping"
    | "gaming"
    | "other";
  eventType: "urge" | "milestone"; // What happened
  wasResisted: boolean; // For urges - was it successfully resisted?
  urgeIntensity: number | null; // 1-5 scale (for urges)
  durationMinutes: number | null; // Duration (if applicable)
  trigger: string | null; // What triggered the urge
  location: string | null; // Where it happened
  moodBefore: number; // 1-5 mood before event
  moodAfter: number; // 1-5 mood after event
  copingStrategy: string | null; // Strategy used to resist/cope
  notes: string | null; // Additional notes
  timestamp: string; // Exact time of event (ISO)
  createdAt: string;
  updatedAt: string;
}

export interface MoodLog {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  mood: number; // 1-5 rating (1: Very Bad, 5: Very Good)
  energy: number; // 1-5 energy level
  stress: number; // 1-5 stress level
  context: string | null; // What was happening when mood was logged
  tags: string[]; // Array of mood tags
  notes: string | null; // Optional user notes
  timestamp: string; // Exact time when logged (ISO)
  createdAt: string;
  updatedAt: string;
}

export interface HealthyHabit {
  id: string;
  name: string; // Name of the habit
  description: string | null; // Description of the habit
  category: "physical" | "mental" | "social" | "spiritual" | "productivity";
  targetFrequency: "daily" | "weekly" | "monthly";
  isActive: boolean; // Whether habit is currently active
  createdAt: string;
  updatedAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string; // Reference to healthy habit
  date: string; // ISO date string
  completed: boolean; // Whether habit was completed
  difficulty: number; // 1-5 scale of difficulty
  timeSpent: number | null; // Minutes spent on habit
  notes: string | null; // Optional notes about completion
  createdAt: string;
}

export interface CrisisResource {
  id: string;
  name: string; // Name of the resource
  type: "hotline" | "chat" | "emergency" | "therapist" | "friend" | "family";
  contact: string; // Phone number, email, or URL
  description: string | null; // Description of the resource
  isActive: boolean; // Whether resource is active
  priority: number; // Priority ordering for emergency situations
  createdAt: string;
  updatedAt: string;
}

export interface AppSetting {
  id: string;
  key: string; // Setting key name
  value: string; // Setting value as string
  type: "boolean" | "string" | "number" | "json";
  updatedAt: string;
}

export interface AIInsight {
  id: string;
  type:
    | "weekly_summary"
    | "pattern_detection"
    | "mood_correlation"
    | "recommendation";
  title: string; // Insight title
  content: string; // Insight content/description
  confidence: number; // 0-1 scale of AI confidence
  metadata: Record<string, any>; // JSON object with additional data
  isRead: boolean; // Whether user has read the insight
  createdAt: string;
  expiresAt: string | null; // When insight should expire (optional)
}

export interface Streak {
  id: string;
  behaviorType: string; // Matches addiction_logs.addiction_type
  currentStreak: number; // Current streak count
  longestStreak: number; // Personal best streak
  lastResetDate: string | null; // When streak was last reset
  startDate: string; // When tracking started
  updatedAt: string;
}

export interface ResistanceMetrics {
  id: string;
  addictionType: string; // Type of addiction being tracked
  totalUrges: number; // Total urges logged
  totalResisted: number; // Total urges successfully resisted
  resistanceRate: number; // Percentage of urges resisted (0-100)
  consecutiveResistances: number; // Current consecutive resistances
  bestResistanceStreak: number; // Best consecutive resistance streak
  totalResistanceScore: number; // Cumulative resistance points
  difficultUrgesResisted: number; // Level 4-5 urges resisted
  triggerMastery: string; // JSON object of trigger -> resistance count
  lastResistanceDate: string | null; // Last time an urge was resisted
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  title: string | null; // Optional title for the entry
  content: string; // The journal content/text
  mood: number | null; // Optional mood rating (1-5) associated with this entry
  tags: string | null; // JSON array of tags as string (e.g., '["work", "family", "stress"]')
  isPrivate: boolean; // Whether the entry is private (for future features)
  wordCount: number; // Automatically calculated word count
  createdAt: string; // When the entry was created
  updatedAt: string; // When the entry was last modified
}

// Database creation SQL
export const CREATE_TABLES_SQL = `
-- Sleep tracking table
CREATE TABLE IF NOT EXISTS sleep_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  bed_time TEXT NOT NULL,
  wake_time TEXT NOT NULL,
  sleep_duration_hours REAL NOT NULL,
  sleep_quality INTEGER DEFAULT 3,
  sleep_interruptions INTEGER DEFAULT 0,
  dream_recall BOOLEAN DEFAULT FALSE,
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
  addiction_type TEXT NOT NULL CHECK (addiction_type IN ('porn', 'social_media', 'alcohol', 'smoking', 'gambling', 'shopping', 'gaming', 'other')),
  event_type TEXT NOT NULL CHECK (event_type IN ('urge', 'relapse', 'milestone')),
  was_resisted BOOLEAN DEFAULT FALSE,
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

-- Multiple mood entries per day for granular tracking
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
  category TEXT DEFAULT 'physical' CHECK (category IN ('physical', 'mental', 'social', 'spiritual', 'productivity')),
  target_frequency TEXT DEFAULT 'daily' CHECK (target_frequency IN ('daily', 'weekly', 'monthly')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Daily habit completion tracking
CREATE TABLE IF NOT EXISTS habit_completions (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL REFERENCES healthy_habits(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  difficulty INTEGER DEFAULT 3,
  time_spent INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(habit_id, date)
);

-- Crisis support resources
CREATE TABLE IF NOT EXISTS crisis_resources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hotline', 'chat', 'emergency', 'therapist', 'friend', 'family')),
  contact TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Application configuration settings
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  type TEXT DEFAULT 'string' CHECK (type IN ('boolean', 'string', 'number', 'json')),
  updated_at TEXT NOT NULL
);

-- AI-generated insights and recommendations
CREATE TABLE IF NOT EXISTS ai_insights (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('weekly_summary', 'pattern_detection', 'mood_correlation', 'recommendation')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence REAL DEFAULT 0.8,
  metadata TEXT DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TEXT NOT NULL,
  expires_at TEXT
);

-- Streak tracking for different behaviors
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
  tags TEXT, -- JSON array stored as text
  is_private BOOLEAN DEFAULT TRUE,
  word_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

// Indexes for performance
export const CREATE_INDEXES_SQL = `
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
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date ON habit_completions(habit_id, date);

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

// Default data for the application
export const DEFAULT_CRISIS_RESOURCES = [
  {
    id: "crisis-1",
    name: "National Suicide Prevention Lifeline",
    type: "hotline" as const,
    contact: "988",
    description: "24/7 crisis support hotline",
    isActive: true,
    priority: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "crisis-2",
    name: "Crisis Text Line",
    type: "chat" as const,
    contact: "Text HOME to 741741",
    description: "24/7 crisis support via text",
    isActive: true,
    priority: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_HEALTHY_HABITS = [
  {
    id: "habit-1",
    name: "Morning Exercise",
    description: "30 minutes of physical activity",
    category: "physical" as const,
    targetFrequency: "daily" as const,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "habit-2",
    name: "Meditation",
    description: "10 minutes of mindfulness practice",
    category: "mental" as const,
    targetFrequency: "daily" as const,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "habit-3",
    name: "Reading",
    description: "Read for 20 minutes",
    category: "mental" as const,
    targetFrequency: "daily" as const,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_APP_SETTINGS = [
  {
    id: "setting-1",
    key: "theme",
    value: "system",
    type: "string" as const,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "setting-2",
    key: "notifications_enabled",
    value: "true",
    type: "boolean" as const,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "setting-3",
    key: "first_time_setup",
    value: "true",
    type: "boolean" as const,
    updatedAt: new Date().toISOString(),
  },
];
