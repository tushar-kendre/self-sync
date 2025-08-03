import { useState, useEffect } from "react";
import {
  initializeDatabase,
  SleepLogService,
  MoodLogService,
  AddictionLogService,
  HabitService,
  StreakService,
  CrisisResourceService,
  AppSettingsService,
  AIInsightService,
  JournalService,
  DatabaseManager,
} from "../database";
import type {
  SleepLog,
  MoodLog,
  AddictionLog,
  HealthyHabit,
  HabitCompletion,
  Streak,
  CrisisResource,
  AIInsight,
  JournalEntry,
} from "../database/types";

/**
 * Hook for managing database initialization
 */
export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const retry = async () => {
    setError(null);
    setIsInitialized(false);

    try {
      console.log("🔄 Retrying database initialization...");
      const manager = DatabaseManager.getInstance();
      await manager.initialize();
      setIsInitialized(true);
      console.log("✅ Database retry successful");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Database retry failed";
      setError(errorMessage);
      console.error("❌ Database retry failed:", err);
    }
  };

  const clearAllData = async () => {
    try {
      console.log("🗑️ Clearing all database data...");
      const manager = DatabaseManager.getInstance();
      await manager.clearAllData();
      setIsInitialized(false);
      setError(null);
      console.log("✅ Database cleared successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to clear database";
      setError(errorMessage);
      console.error("❌ Failed to clear database:", err);
      throw err;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (isInitialized || isInitializing) return;

      setIsInitializing(true);
      setError(null);

      try {
        await initializeDatabase();
        if (isMounted) {
          setIsInitialized(true);
          console.log("✅ Database hook: Database initialized successfully");
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Database initialization failed";
          setError(errorMessage);
          console.error("❌ Database hook: Initialization failed:", err);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    isInitialized,
    isInitializing,
    error,
    retry,
    clearAllData,
  };
}

/**
 * Hook for managing sleep logs
 */
export function useSleepLogs() {
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getService = () => {
    const manager = DatabaseManager.getInstance();
    return new SleepLogService(manager.getDatabase());
  };

  const loadRecentLogs = async (limit = 30) => {
    setLoading(true);
    setError(null);
    try {
      const service = getService();
      const logs = await service.getRecentSleepLogs(limit);
      setSleepLogs(logs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load sleep logs",
      );
    } finally {
      setLoading(false);
    }
  };

  const createSleepLog = async (
    data: Omit<SleepLog, "id" | "createdAt" | "updatedAt">,
  ): Promise<SleepLog | null> => {
    try {
      const service = getService();
      const result = await service.createSleepLog(data);
      await loadRecentLogs();
      return result;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create sleep log",
      );
      return null;
    }
  };

  const getTodaySleepLog = async (): Promise<SleepLog | null> => {
    const today = new Date().toISOString().split("T")[0];
    try {
      const service = getService();
      return await service.getSleepLogByDate(today);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get today's sleep log",
      );
      return null;
    }
  };

  const getSleepStats = async (days = 30) => {
    try {
      const service = getService();
      return await service.getSleepStats(days);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get sleep stats",
      );
      return {
        averageHours: 0,
        averageQuality: 0,
        averageEfficiency: 0,
        totalLogs: 0,
      };
    }
  };

  const getSleepStreak = async () => {
    try {
      const manager = DatabaseManager.getInstance();
      const streakService = new StreakService(manager.getDatabase());
      const streak = await streakService.getStreakByType("sleep");
      return streak?.currentStreak || 0;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get sleep streak",
      );
      return 0;
    }
  };

  return {
    sleepLogs,
    loading,
    error,
    loadRecentLogs,
    createSleepLog,
    getTodaySleepLog,
    getSleepStats,
    getSleepStreak,
  };
}

/**
 * Hook for managing mood logs
 */
export function useMoodLogs() {
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getService = () => {
    const manager = DatabaseManager.getInstance();
    return new MoodLogService(manager.getDatabase());
  };

  const loadRecentLogs = async (limit = 30) => {
    setLoading(true);
    setError(null);
    try {
      const service = getService();
      const logs = await service.getRecentMoodLogs(limit);
      setMoodLogs(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load mood logs");
    } finally {
      setLoading(false);
    }
  };

  const createMoodLog = async (
    data: Omit<MoodLog, "id" | "createdAt" | "updatedAt">,
  ): Promise<MoodLog | null> => {
    try {
      const service = getService();
      const result = await service.createMoodLog(data);
      await loadRecentLogs();
      return result;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create mood log",
      );
      return null;
    }
  };

  const getTodayMoodLogs = async (): Promise<MoodLog[]> => {
    const today = new Date().toISOString().split("T")[0];
    try {
      const service = getService();
      return await service.getMoodLogsByDate(today);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get today's mood logs",
      );
      return [];
    }
  };

  const getMoodTrend = async (days = 30) => {
    try {
      const service = getService();
      return await service.getMoodTrend(days);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get mood trend");
      return [];
    }
  };

  const getMoodStreak = async () => {
    try {
      const manager = DatabaseManager.getInstance();
      const streakService = new StreakService(manager.getDatabase());
      const streak = await streakService.getStreakByType("mood_logging");
      return streak?.currentStreak || 0;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get mood streak",
      );
      return 0;
    }
  };

  return {
    moodLogs,
    loading,
    error,
    loadRecentLogs,
    createMoodLog,
    getTodayMoodLogs,
    getMoodTrend,
    getMoodStreak,
  };
}

/**
 * Hook for managing addiction logs
 */
export function useAddictionLogs() {
  const [addictionLogs, setAddictionLogs] = useState<AddictionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getService = () => {
    const manager = DatabaseManager.getInstance();
    return new AddictionLogService(manager.getDatabase());
  };

  const loadRecentLogs = async (limit = 50) => {
    setLoading(true);
    setError(null);
    try {
      const service = getService();
      const logs = await service.getRecentAddictionLogs(limit);
      setAddictionLogs(logs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load addiction logs",
      );
    } finally {
      setLoading(false);
    }
  };

  const createAddictionLog = async (
    data: Omit<AddictionLog, "id" | "createdAt" | "updatedAt">,
  ): Promise<AddictionLog | null> => {
    try {
      const service = getService();
      const result = await service.createAddictionLog(data);
      await loadRecentLogs();
      return result;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create addiction log",
      );
      return null;
    }
  };

  const getTodayAddictionLogs = async (): Promise<AddictionLog[]> => {
    const today = new Date().toISOString().split("T")[0];
    try {
      const service = getService();
      return await service.getAddictionLogsByDate(today);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to get today's addiction logs",
      );
      return [];
    }
  };

  const getAddictionStreak = async (): Promise<number> => {
    try {
      const manager = DatabaseManager.getInstance();
      const streakService = new StreakService(manager.getDatabase());
      const streak = await streakService.getStreakByType("addiction_recovery");
      return streak?.currentStreak || 0;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get addiction streak",
      );
      return 0;
    }
  };

  const getResistanceMetrics = async (addictionType: string) => {
    try {
      const manager = DatabaseManager.getInstance();
      return await manager.resistanceMetrics.getResistanceMetrics(
        addictionType,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get resistance metrics",
      );
      return null;
    }
  };

  const generateResistanceMessage = async (
    addictionType: string,
    wasResisted: boolean,
    urgeIntensity: number,
  ) => {
    try {
      const manager = DatabaseManager.getInstance();
      const metrics =
        await manager.resistanceMetrics.getResistanceMetrics(addictionType);
      if (metrics) {
        return manager.resistanceMetrics.generateResistanceMessage(
          metrics,
          wasResisted,
          urgeIntensity,
        );
      }
      return {
        title: wasResisted ? "🎯 Great Job!" : "🤗 Tomorrow is a New Day",
        message: wasResisted
          ? "Urge resisted successfully!"
          : "Recovery isn't about perfection, it's about progress.",
        encouragement: wasResisted
          ? "Every resistance builds strength!"
          : "You can try again tomorrow.",
      };
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate resistance message",
      );
      return {
        title: "Keep Going",
        message: "Every step counts in your recovery journey.",
        encouragement: "You're stronger than you know.",
      };
    }
  };

  return {
    addictionLogs,
    loading,
    error,
    loadRecentLogs,
    createAddictionLog,
    getTodayAddictionLogs,
    getAddictionStreak,
    getResistanceMetrics,
    generateResistanceMessage,
  };
}

/**
 * Hook for managing habits
 */
export function useHabits() {
  const [habits, setHabits] = useState<HealthyHabit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getService = () => {
    const manager = DatabaseManager.getInstance();
    return new HabitService(manager.getDatabase());
  };

  const loadAllHabits = async () => {
    setLoading(true);
    setError(null);
    try {
      const service = getService();
      const allHabits = await service.getAllHabits();
      setHabits(allHabits);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load habits");
    } finally {
      setLoading(false);
    }
  };

  const createHabit = async (
    data: Omit<HealthyHabit, "id" | "createdAt" | "updatedAt">,
  ): Promise<HealthyHabit | null> => {
    try {
      const service = getService();
      const result = await service.createHabit(data);
      await loadAllHabits();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create habit");
      return null;
    }
  };

  const completeHabit = async (
    data: Omit<HabitCompletion, "id" | "createdAt">,
  ): Promise<HabitCompletion | null> => {
    try {
      const service = getService();
      return await service.completeHabit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete habit");
      return null;
    }
  };

  return {
    habits,
    loading,
    error,
    loadAllHabits,
    createHabit,
    completeHabit,
  };
}

/**
 * Hook for managing streaks
 */
export function useStreaks() {
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getService = () => {
    const manager = DatabaseManager.getInstance();
    return new StreakService(manager.getDatabase());
  };

  const loadAllStreaks = async () => {
    setLoading(true);
    setError(null);
    try {
      const service = getService();
      const allStreaks = await service.getAllStreaks();
      setStreaks(allStreaks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load streaks");
    } finally {
      setLoading(false);
    }
  };

  const updateStreak = async (
    behaviorType: string,
    wasResisted: boolean,
  ): Promise<Streak | null> => {
    try {
      const service = getService();
      const result = await service.updateStreak(behaviorType, wasResisted);
      await loadAllStreaks();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update streak");
      return null;
    }
  };

  const getStreakByType = async (
    behaviorType: string,
  ): Promise<Streak | null> => {
    try {
      const service = getService();
      return await service.getStreakByType(behaviorType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get streak");
      return null;
    }
  };

  return {
    streaks,
    loading,
    error,
    loadAllStreaks,
    updateStreak,
    getStreakByType,
  };
}

/**
 * Hook for managing user settings
 */
export function useUserSettings() {
  const { isInitialized } = useDatabase();
  const [userName, setUserName] = useState<string | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getService = () => {
    const manager = DatabaseManager.getInstance();
    return new AppSettingsService(manager.getDatabase());
  };

  useEffect(() => {
    if (isInitialized) {
      // Add a small delay to ensure database is fully ready
      const timeoutId = setTimeout(() => {
        loadUserSettings();
      }, 200); // 200ms delay to ensure stable database state

      return () => clearTimeout(timeoutId);
    }
  }, [isInitialized]);

  const loadUserSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const service = getService();
      const [name, firstTime] = await Promise.all([
        service.getUserName(),
        service.isFirstTime(),
      ]);

      setUserName(name);
      setIsFirstTime(firstTime);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load user settings",
      );
    } finally {
      setLoading(false);
    }
  };

  const saveUserName = async (name: string): Promise<boolean> => {
    try {
      const service = getService();
      await service.setUserName(name);
      await service.markSetupComplete();
      setUserName(name);
      setIsFirstTime(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user name");
      return false;
    }
  };

  const getSetting = async (key: string): Promise<string | null> => {
    try {
      const service = getService();
      return await service.getSetting(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get setting");
      return null;
    }
  };

  const setSetting = async (
    key: string,
    value: string,
    type: string = "string",
  ): Promise<boolean> => {
    try {
      const service = getService();
      await service.setSetting(key, value, type);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set setting");
      return false;
    }
  };

  const getThemePreference = async (): Promise<"light" | "dark" | null> => {
    try {
      const service = getService();
      return await service.getThemePreference();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get theme preference",
      );
      return null;
    }
  };

  const setThemePreference = async (
    theme: "light" | "dark",
  ): Promise<boolean> => {
    try {
      const service = getService();
      await service.setThemePreference(theme);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to set theme preference",
      );
      return false;
    }
  };

  return {
    userName,
    isFirstTime,
    loading,
    error,
    saveUserName,
    getSetting,
    setSetting,
    getThemePreference,
    setThemePreference,
    refresh: loadUserSettings,
  };
}

/**
 * Hook for crisis resources
 */
export function useCrisisResources() {
  const [resources, setResources] = useState<CrisisResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getService = () => {
    const manager = DatabaseManager.getInstance();
    return new CrisisResourceService(manager.getDatabase());
  };

  const loadAllResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const service = getService();
      const allResources = await service.getAllCrisisResources();
      setResources(allResources);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load crisis resources",
      );
    } finally {
      setLoading(false);
    }
  };

  const getEmergencyResources = async (): Promise<CrisisResource[]> => {
    try {
      const service = getService();
      return await service.getEmergencyResources();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to get emergency resources",
      );
      return [];
    }
  };

  return {
    resources,
    loading,
    error,
    loadAllResources,
    getEmergencyResources,
  };
}

/**
 * Hook for AI insights
 */
export function useAIInsights() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getService = () => {
    const manager = DatabaseManager.getInstance();
    return new AIInsightService(manager.getDatabase());
  };

  const loadUnreadInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const service = getService();
      const unreadInsights = await service.getUnreadInsights();
      setInsights(unreadInsights);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  const createInsight = async (
    data: Omit<AIInsight, "id" | "createdAt">,
  ): Promise<AIInsight | null> => {
    try {
      const service = getService();
      const result = await service.createInsight(data);
      await loadUnreadInsights();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create insight");
      return null;
    }
  };

  const markAsRead = async (id: string): Promise<void> => {
    try {
      const service = getService();
      await service.markAsRead(id);
      await loadUnreadInsights();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to mark insight as read",
      );
    }
  };

  return {
    insights,
    loading,
    error,
    loadUnreadInsights,
    createInsight,
    markAsRead,
  };
}

/**
 * Hook for managing journal entries
 */
export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getService = () => {
    const manager = DatabaseManager.getInstance();
    return new JournalService(manager.getDatabase());
  };

  const loadRecentEntries = async (limit = 20) => {
    setLoading(true);
    setError(null);
    try {
      const service = getService();
      const recentEntries = await service.getRecentEntries(limit);
      setEntries(recentEntries);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load journal entries",
      );
    } finally {
      setLoading(false);
    }
  };

  const createEntry = async (
    data: Omit<JournalEntry, "id" | "wordCount" | "createdAt" | "updatedAt">,
  ): Promise<JournalEntry | null> => {
    try {
      const service = getService();
      const result = await service.createEntry(data);
      await loadRecentEntries();
      return result;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create journal entry",
      );
      return null;
    }
  };

  const updateEntry = async (
    id: string,
    data: Partial<Omit<JournalEntry, "id" | "createdAt">>,
  ): Promise<JournalEntry | null> => {
    try {
      const service = getService();
      const result = await service.updateEntry(id, data);
      await loadRecentEntries();
      return result;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update journal entry",
      );
      return null;
    }
  };

  const deleteEntry = async (id: string): Promise<boolean> => {
    try {
      const service = getService();
      const success = await service.deleteEntry(id);
      if (success) {
        await loadRecentEntries();
      }
      return success;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete journal entry",
      );
      return false;
    }
  };

  const getEntryById = async (id: string): Promise<JournalEntry | null> => {
    try {
      const service = getService();
      return await service.getEntryById(id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get journal entry",
      );
      return null;
    }
  };

  const getEntryByDate = async (date: string): Promise<JournalEntry | null> => {
    try {
      const service = getService();
      return await service.getEntryByDate(date);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get journal entry",
      );
      return null;
    }
  };

  const searchEntries = async (query: string): Promise<JournalEntry[]> => {
    try {
      const service = getService();
      return await service.searchEntries(query);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to search journal entries",
      );
      return [];
    }
  };

  const getJournalStats = async (days = 30) => {
    try {
      const service = getService();
      return await service.getJournalStats(days);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get journal stats",
      );
      return {
        totalEntries: 0,
        totalWords: 0,
        averageWordsPerEntry: 0,
        averageMood: 0,
        streakDays: 0,
      };
    }
  };

  const getAllTags = async (): Promise<string[]> => {
    try {
      const service = getService();
      return await service.getAllTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get tags");
      return [];
    }
  };

  return {
    entries,
    loading,
    error,
    loadRecentEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    getEntryById,
    getEntryByDate,
    searchEntries,
    getJournalStats,
    getAllTags,
  };
}

/**
 * Combined hook for dashboard data
 */
export function useDashboardData() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const manager = DatabaseManager.getInstance();
      const sleepService = new SleepLogService(manager.getDatabase());
      const moodService = new MoodLogService(manager.getDatabase());
      const addictionService = new AddictionLogService(manager.getDatabase());
      const streakService = new StreakService(manager.getDatabase());
      const journalService = new JournalService(manager.getDatabase());

      const [
        recentSleepLogs,
        recentMoodLogs,
        recentAddictionLogs,
        allStreaks,
        moodTrend,
        sleepStats,
        recentJournalEntries,
      ] = await Promise.all([
        sleepService.getRecentSleepLogs(7),
        moodService.getRecentMoodLogs(7),
        addictionService.getRecentAddictionLogs(7),
        streakService.getAllStreaks(),
        moodService.getMoodTrend(7),
        sleepService.getSleepStats(7),
        journalService.getRecentEntries(7),
      ]);

      setDashboardData({
        recentSleepLogs,
        recentMoodLogs,
        recentAddictionLogs,
        streaks: allStreaks,
        moodTrend,
        sleepStats,
        recentJournalEntries,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data",
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    dashboardData,
    loading,
    error,
    loadDashboardData,
    refresh: loadDashboardData,
  };
}
