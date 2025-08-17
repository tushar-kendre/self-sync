import * as React from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Text } from "~/components/ui/text";
import { ThemeToggle } from "~/components/ThemeToggle";
import { WelcomeDialog } from "~/components/WelcomeDialog";
import {
  useDatabase,
  useStreaks,
  useMoodLogs,
  useSleepLogs,
  useUserSettings,
  useAddictionLogs,
  useDashboardData,
  useJournal,
  useHabits,
} from "~/lib/hooks/useDatabase";
import { useColorScheme } from "~/lib/useColorScheme";
import type { MoodLog, SleepLog } from "~/lib/database/types";
import { router, useFocusEffect } from "expo-router";
// Import configured icons
import { Star } from "~/lib/icons/Star";
import { Smile } from "~/lib/icons/Smile";
import { Moon } from "~/lib/icons/Moon";
import { Activity } from "~/lib/icons/Activity";
import { Target } from "~/lib/icons/Target";
import { Shield } from "~/lib/icons/Shield";
import { Smartphone } from "~/lib/icons/Smartphone";
import { UtensilsCrossed } from "~/lib/icons/UtensilsCrossed";
import { Cigarette } from "~/lib/icons/Cigarette";
import { Leaf } from "~/lib/icons/Leaf";
import { Monitor } from "~/lib/icons/Monitor";
import { BookOpen } from "~/lib/icons/BookOpen";
import { AlertTriangle } from "~/lib/icons/AlertTriangle";
import { FileText } from "~/lib/icons/FileText";
import { Zap } from "~/lib/icons/Zap";
import { BarChart3 } from "~/lib/icons/BarChart3";
import { Flame } from "~/lib/icons/Flame";
import { ClipboardList } from "~/lib/icons/ClipboardList";

export default function Screen() {
  const { isDarkColorScheme } = useColorScheme();
  const {
    isInitialized,
    isInitializing,
    error: dbError,
    retry,
    clearAllData,
  } = useDatabase();
  const { streaks, loadAllStreaks, loading: streaksLoading } = useStreaks();
  const { getTodayMoodLogs } = useMoodLogs();
  const { getTodaySleepLog } = useSleepLogs();
  const {
    userName,
    isFirstTime,
    saveUserName,
    loading: userLoading,
  } = useUserSettings();
  const {
    dashboardData,
    loadDashboardData,
    loading: dashboardLoading,
  } = useDashboardData();
  const { getEntryByDate } = useJournal();
  const { habits, loadAllHabits } = useHabits();
  const [todayMoodLogs, setTodayMoodLogs] = React.useState<MoodLog[]>([]);
  const [todaySleep, setTodaySleep] = React.useState<SleepLog | null>(null);
  const [todayJournal, setTodayJournal] = React.useState<any>(null);
  const [showWelcome, setShowWelcome] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [hasCheckedWelcome, setHasCheckedWelcome] = React.useState(false);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (isInitialized) {
        loadAllStreaks();
        loadTodayData();
        loadDashboardData();
      }
    }, [isInitialized]),
  );

  // Load data when database is ready
  React.useEffect(() => {
    if (isInitialized) {
      loadAllStreaks();
      loadTodayData();
      loadDashboardData();
  loadAllHabits();
    }
  }, [isInitialized]);

  // Show welcome dialog for first-time users - robust logic with proper sequencing
  React.useEffect(() => {
    // Only proceed if we haven't checked welcome yet
    if (hasCheckedWelcome) return;

    console.log("Welcome check:", {
      isInitialized,
      userLoading,
      userName,
      showWelcome,
      hasCheckedWelcome,
    });

    // Wait for both database and user data to be ready
    if (!isInitialized || userLoading) {
      console.log("Waiting for initialization or user loading to complete");
      return;
    }

    // Mark that we've performed the welcome check
    setHasCheckedWelcome(true);

    // Show welcome only if no username exists and welcome isn't already showing
    if (userName === null && !showWelcome) {
      console.log(
        "Showing welcome dialog - no username found after full initialization",
      );
      setShowWelcome(true);
    } else if (userName !== null) {
      console.log("User already exists, not showing welcome dialog:", userName);
      setShowWelcome(false);
    }
  }, [isInitialized, userLoading, userName, showWelcome, hasCheckedWelcome]);

  // Reset welcome check flag when database is cleared
  React.useEffect(() => {
    if (!isInitialized) {
      setHasCheckedWelcome(false);
    }
  }, [isInitialized]);

  const loadTodayData = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [moodLogs, sleepLog, journalEntry] = await Promise.all([
        getTodayMoodLogs(),
        getTodaySleepLog(),
        getEntryByDate(today),
      ]);
      setTodayMoodLogs(moodLogs);
      setTodaySleep(sleepLog);
      setTodayJournal(journalEntry);
    } catch (error) {
      console.error("Failed to load today's data:", error);
    }
  };

  const refreshAllData = async () => {
    if (isInitialized) {
      await Promise.all([
        loadAllStreaks(),
        loadTodayData(),
        loadDashboardData(),
      ]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAllData();
    setRefreshing(false);
  };

  const handleWelcomeComplete = async (name: string) => {
    console.log("Welcome complete called with name:", name);
    const success = await saveUserName(name);
    if (success) {
      console.log("Username saved successfully, hiding welcome dialog");
      setShowWelcome(false);
      setHasCheckedWelcome(true); // Ensure we don't recheck
      // Refresh data after setting up the user
      loadTodayData();
      loadDashboardData();
    } else {
      console.error("Failed to save username");
    }
  };

  const handleQuickLog = async (
    type: "mood" | "sleep" | "activity" | "addiction" | "journal" | "habit",
  ) => {
    try {
      switch (type) {
        case "mood":
          router.push("/(tabs)/mood-check");
          break;
        case "sleep":
          // For now, create a simple sleep log - in a real app this would navigate to a form
          router.push("/(tabs)/sleep-log");
          break;
        case "addiction":
          router.push("/(tabs)/addiction-log");
          break;
        case "habit":
          router.push("/(tabs)/habits-log");
          break;
        case "journal":
          router.push("/(tabs)/journal");
          break;
        default:
          console.log(`Opening ${type} logging screen`);
      }
    } catch (error) {
      console.error(`Failed to handle ${type} quick log:`, error);
    }
  };

  const handleClearDatabase = async () => {
    try {
      // Show confirmation alert
      Alert.alert(
        "Reset Database",
        "Are you sure you want to completely RESET the database? This will drop all tables and recreate them fresh. All your data will be permanently lost. This action cannot be undone.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Reset All",
            style: "destructive",
            onPress: async () => {
              try {
                console.log("Completely resetting database...");

                // Clear the actual SQLite database (drops all tables)
                await clearAllData();

                // Clear all local state
                setTodayMoodLogs([]);
                setTodaySleep(null);
                setTodayJournal(null);

                console.log("Database reset successfully");

                // Reset welcome check flag BEFORE retry
                setHasCheckedWelcome(false);

                // Reinitialize the database
                await retry();

                // Refresh data to show empty state
                await refreshAllData();

                // Show welcome dialog since user data is now cleared
                // Give a small delay to ensure database is ready
                setTimeout(() => {
                  setShowWelcome(true);
                }, 100);

                Alert.alert(
                  "Success",
                  "Database has been completely reset! All tables were dropped and recreated fresh. Navigate to other tabs to see them refresh with empty data. Welcome back!",
                );
              } catch (error) {
                console.error("Failed to reset database:", error);
                Alert.alert(
                  "Error",
                  "Failed to reset database. Please try again.",
                );
              }
            },
          },
        ],
      );
    } catch (error) {
      console.error("Failed to show confirmation dialog:", error);
    }
  };

  const getRecentEntries = () => {
    const entries: Array<{
      type: string;
      value: string;
      time: string;
      color: string;
      timestamp: string;
    }> = [];

    // Add today's mood logs from local state
    todayMoodLogs.forEach((log: MoodLog) => {
      const timeAgo = getTimeAgo(log.timestamp);
      const moodEmoji = getMoodEmoji(log.mood);
      entries.push({
        type: "mood",
        value: `${moodEmoji} Mood: ${log.mood}/5`,
        time: timeAgo,
        color: "bg-blue-50 border-blue-200",
        timestamp: log.timestamp,
      });
    });

    // Add today's sleep from local state
    if (todaySleep) {
      const timeAgo = getTimeAgo(todaySleep.timestamp);
      entries.push({
        type: "sleep",
        value: `😴 ${todaySleep.sleepDurationHours.toFixed(1)}h sleep`,
        time: timeAgo,
        color: "bg-purple-50 border-purple-200",
        timestamp: todaySleep.timestamp,
      });
    }

    // Add today's journal from local state
    if (todayJournal) {
      const timeAgo = getTimeAgo(todayJournal.createdAt);
      const cleanContent = stripHtml(todayJournal.content || "");
      const excerpt =
        cleanContent.length > 30
          ? cleanContent.substring(0, 30) + "..."
          : cleanContent || "Journal entry";
      entries.push({
        type: "journal",
        value: `📖 "${excerpt}"`,
        time: timeAgo,
        color: "bg-green-50 border-green-200",
        timestamp: todayJournal.createdAt,
      });
    }

    // Add recent mood logs from dashboard data (for previous days)
    if (dashboardData?.recentMoodLogs) {
      const today = new Date().toISOString().split("T")[0];
      dashboardData.recentMoodLogs
        .filter((log: any) => log.timestamp && !log.timestamp.startsWith(today)) // Exclude today's logs to avoid duplicates
        .slice(0, 1)
        .forEach((log: any) => {
          const timeAgo = getTimeAgo(log.timestamp);
          const moodEmoji = getMoodEmoji(log.mood);
          entries.push({
            type: "mood",
            value: `${moodEmoji} Mood: ${log.mood}/5`,
            time: timeAgo,
            color: "bg-blue-50 border-blue-200",
            timestamp: log.timestamp,
          });
        });
    }

    // Add recent sleep logs (exclude today's to avoid duplicates with local state)
    if (dashboardData?.recentSleepLogs) {
      const today = new Date().toISOString().split("T")[0];
      dashboardData.recentSleepLogs
        .filter((log: any) => log.timestamp && !log.timestamp.startsWith(today)) // Exclude today's logs to avoid duplicates
        .slice(0, 1)
        .forEach((log: any) => {
          const timeAgo = getTimeAgo(log.timestamp);
          entries.push({
            type: "sleep",
            value: `😴 ${log.sleepDurationHours.toFixed(1)}h sleep`,
            time: timeAgo,
            color: "bg-purple-50 border-purple-200",
            timestamp: log.timestamp,
          });
        });
    }

    // Add recent addiction logs (all types)
    if (dashboardData?.recentAddictionLogs) {
      dashboardData.recentAddictionLogs
        .slice(0, 3) // Show up to 3 recent addiction logs
        .forEach((log: any) => {
          const timeAgo = getTimeAgo(log.timestamp || log.createdAt);
          let value = "";
          let emoji = "";
          let colorClass = "bg-orange-50 border-orange-200";

          // Customize display based on event type
          if (log.eventType === "urge") {
            if (log.wasResisted) {
              emoji = "🎯";
              value = `Resisted ${log.addictionType || "urge"}`;
              colorClass = "bg-green-50 border-green-200"; // Green for victories
            } else {
              emoji = "⚡";
              value = `Urge: ${log.addictionType || "addiction"}`;
              colorClass = "bg-yellow-50 border-yellow-200"; // Yellow for urges
            }
          } else if (log.eventType === "milestone") {
            emoji = "🏆";
            value = `${log.addictionType || "recovery"} milestone`;
            colorClass = "bg-purple-50 border-purple-200"; // Purple for achievements
          }

          entries.push({
            type: "addiction",
            value: `${emoji} ${value}`,
            time: timeAgo,
            color: colorClass,
            timestamp: log.timestamp || log.createdAt,
          });
        });
    }

    // Add today's and recent habit completions
    if (dashboardData?.recentHabitCompletions && habits?.length) {
      const habitMap: Record<string, any> = {};
      habits.forEach((h: any) => (habitMap[h.id] = h));
      const today = new Date().toISOString().split("T")[0];
      const categoryEmoji: Record<string, string> = {
        physical: "🏃",
        mental: "📘",
        social: "🤝",
        spiritual: "🧘",
        productivity: "⚡",
      };
      const categoryColor: Record<string, string> = {
        physical: "bg-emerald-50 border-emerald-200",
        mental: "bg-indigo-50 border-indigo-200",
        social: "bg-rose-50 border-rose-200",
        spiritual: "bg-violet-50 border-violet-200",
        productivity: "bg-amber-50 border-amber-200",
      };

      dashboardData.recentHabitCompletions
        .filter((c: any) => c.completed)
        .slice(0, 4)
        .forEach((c: any) => {
          const habit = habitMap[c.habitId];
            if (!habit) return;
          const timestamp = c.updatedAt || c.createdAt || `${c.date}T00:00:00.000Z`;
          const timeAgo = getTimeAgo(timestamp);
          const cat = habit.category || "productivity";
          const emoji = categoryEmoji[cat] || "✅";
          const colorClass = categoryColor[cat] || "bg-green-50 border-green-200";
          // Avoid duplicate if same timestamp/type already present
          if (!entries.find(e => e.type === "habit" && e.timestamp === timestamp)) {
            entries.push({
              type: "habit",
              value: `${emoji} ${habit.name}${habit.trackingType !== 'completion' && habit.targetValue ? ` (${c.currentValue}${habit.unit ? ' '+habit.unit : ''}/${habit.targetValue})` : ''}`,
              time: c.date === today ? timeAgo : (c.date === today ? timeAgo : "Yesterday"),
              color: colorClass,
              timestamp,
            });
          }
        });
    }

    // Sort by most recent timestamp and return top 4
    return entries
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 4);
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const logTime = new Date(timestamp);
    const diffMs = now.getTime() - logTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours === 0) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return "Yesterday";
    }
  };

  const getQuickActions = () => {
    return [
      {
        id: "mood",
        title: "Mood Check",
        icon: Smile,
        description: "How are you feeling?",
        color: "bg-blue-50 border-blue-200",
        action: () => handleQuickLog("mood"),
      },
      {
        id: "sleep",
        title: "Sleep Log",
        icon: Moon,
        description: "Hours & quality",
        color: "bg-purple-50 border-purple-200",
        action: () => handleQuickLog("sleep"),
      },
      {
        id: "addiction",
        title: "Urge/Win",
        icon: Target,
        description: "Log resistance/slip",
        color: "bg-orange-50 border-orange-200",
        action: () => handleQuickLog("addiction"),
      },
      {
        id: "habit",
        title: "Habit",
        icon: Flame,
        description: "Mark complete",
        color: "bg-red-50 border-red-200",
        action: () => handleQuickLog("habit"),
      },
      {
        id: "journal",
        title: "Journal",
        icon: BookOpen,
        description: "Quick thoughts",
        color: "bg-amber-50 border-amber-200",
        action: () => handleQuickLog("journal"),
      },
    ];
  };

  const getCurrentTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getStreakIcon = (behaviorType: string) => {
    const icons = {
      // Addiction/resistance streaks
      addiction_recovery: Shield,
      porn: Shield,
      reels: Smartphone,
      binge: UtensilsCrossed,
      smoke: Cigarette,
      weed: Leaf,
      internet: Monitor,
      social_media: Smartphone,
      alcohol: UtensilsCrossed,
      smoking: Cigarette,
      gambling: Target,
      shopping: UtensilsCrossed,
      gaming: Monitor,
      other: Shield,
      // Positive habit streaks
      mood_logging: Smile,
      journal: BookOpen,
      exercise: Activity,
      meditation: Star,
      sleep: Moon,
      hydration: Activity,
  reading: BookOpen,
  gratitude: Star,
  deep_work: Zap,
  steps: Activity,
    };
    return icons[behaviorType as keyof typeof icons] || Target;
  };

  const getStreakStyle = (behaviorType: string, isDark: boolean = false) => {
    const styles = {
      // Addiction/resistance streaks - orange/red theme (challenging behaviors to resist)
      addiction_recovery: {
        colors: isDark
          ? (["#431407", "#7c2d12"] as const)
          : (["#fed7aa", "#fecaca"] as const),
        border: "border-orange-200 dark:border-orange-800",
      },
      porn: {
        colors: isDark
          ? (["#431407", "#7c2d12"] as const)
          : (["#fed7aa", "#fecaca"] as const),
        border: "border-orange-200 dark:border-orange-800",
      },
      reels: {
        colors: isDark
          ? (["#431407", "#7c2d12"] as const)
          : (["#fed7aa", "#fecaca"] as const),
        border: "border-orange-200 dark:border-orange-800",
      },
      binge: {
        colors: isDark
          ? (["#431407", "#7c2d12"] as const)
          : (["#fed7aa", "#fecaca"] as const),
        border: "border-orange-200 dark:border-orange-800",
      },
      smoke: {
        colors: isDark
          ? (["#431407", "#7c2d12"] as const)
          : (["#fed7aa", "#fecaca"] as const),
        border: "border-orange-200 dark:border-orange-800",
      },
      weed: {
        colors: isDark
          ? (["#431407", "#7c2d12"] as const)
          : (["#fed7aa", "#fecaca"] as const),
        border: "border-orange-200 dark:border-orange-800",
      },
      internet: {
        colors: isDark
          ? (["#431407", "#7c2d12"] as const)
          : (["#fed7aa", "#fecaca"] as const),
        border: "border-orange-200 dark:border-orange-800",
      },
      social_media: {
        colors: isDark
          ? (["#431407", "#7c2d12"] as const)
          : (["#fed7aa", "#fecaca"] as const),
        border: "border-orange-200 dark:border-orange-800",
      },
      alcohol: {
        colors: isDark
          ? (["#431407", "#7c2d12"] as const)
          : (["#fed7aa", "#fecaca"] as const),
        border: "border-orange-200 dark:border-orange-800",
      },
      smoking: {
        colors: isDark
          ? (["#431407", "#7c2d12"] as const)
          : (["#fed7aa", "#fecaca"] as const),
        border: "border-orange-200 dark:border-orange-800",
      },
      gambling: {
        colors: isDark
          ? (["#431407", "#7c2d12"] as const)
          : (["#fed7aa", "#fecaca"] as const),
        border: "border-orange-200 dark:border-orange-800",
      },
      shopping: {
        colors: isDark
          ? (["#431407", "#7c2d12"] as const)
          : (["#fed7aa", "#fecaca"] as const),
        border: "border-orange-200 dark:border-orange-800",
      },
      gaming: {
        colors: isDark
          ? (["#431407", "#7c2d12"] as const)
          : (["#fed7aa", "#fecaca"] as const),
        border: "border-orange-200 dark:border-orange-800",
      },
      other: {
        colors: isDark
          ? (["#431407", "#7c2d12"] as const)
          : (["#fed7aa", "#fecaca"] as const),
        border: "border-orange-200 dark:border-orange-800",
      },
      // Positive habit streaks - green/blue theme (healthy behaviors to maintain)
      mood_logging: {
        colors: isDark
          ? (["#1e3a8a", "#3730a3"] as const)
          : (["#dbeafe", "#e9d5ff"] as const),
        border: "border-blue-200 dark:border-blue-800",
      },
      journal: {
        colors: isDark
          ? (["#14532d", "#166534"] as const)
          : (["#dcfce7", "#d1fae5"] as const),
        border: "border-green-200 dark:border-green-800",
      },
      exercise: {
        colors: isDark
          ? (["#134e4a", "#0f766e"] as const)
          : (["#ccfbf1", "#cffafe"] as const),
        border: "border-teal-200 dark:border-teal-800",
      },
      meditation: {
        colors: isDark
          ? (["#581c87", "#6b21a8"] as const)
          : (["#e9d5ff", "#e0e7ff"] as const),
        border: "border-purple-200 dark:border-purple-800",
      },
      sleep: {
        colors: isDark
          ? (["#312e81", "#3730a3"] as const)
          : (["#e0e7ff", "#e9d5ff"] as const),
        border: "border-indigo-200 dark:border-indigo-800",
      },
      hydration: {
        colors: isDark
          ? (["#155e75", "#0e7490"] as const)
          : (["#cffafe", "#dbeafe"] as const),
        border: "border-cyan-200 dark:border-cyan-800",
      },
      reading: {
        colors: isDark ? (["#312e81", "#3730a3"] as const) : (["#e0e7ff", "#dbeafe"] as const),
        border: "border-indigo-200 dark:border-indigo-800",
      },
      gratitude: {
        colors: isDark ? (["#581c87", "#6b21a8"] as const) : (["#f5d0fe", "#e9d5ff"] as const),
        border: "border-purple-200 dark:border-purple-800",
      },
      deep_work: {
        colors: isDark ? (["#064e3b", "#065f46"] as const) : (["#d1fae5", "#a7f3d0"] as const),
        border: "border-emerald-200 dark:border-emerald-800",
      },
      steps: {
        colors: isDark ? (["#134e4a", "#0f766e"] as const) : (["#ccfbf1", "#99f6e4"] as const),
        border: "border-teal-200 dark:border-teal-800",
      },
    };
    return (
      styles[behaviorType as keyof typeof styles] || {
        colors: isDark
          ? (["#431407", "#7c2d12"] as const)
          : (["#fed7aa", "#fef3c7"] as const),
        border: "border-orange-200 dark:border-orange-800",
      }
    );
  };

  const getStreakTextColor = (behaviorType: string) => {
    const colors = {
      // Addiction/resistance streaks
      addiction_recovery: "text-orange-600 dark:text-orange-400",
      porn: "text-orange-600 dark:text-orange-400",
      reels: "text-orange-600 dark:text-orange-400",
      binge: "text-orange-600 dark:text-orange-400",
      smoke: "text-orange-600 dark:text-orange-400",
      weed: "text-orange-600 dark:text-orange-400",
      internet: "text-orange-600 dark:text-orange-400",
      social_media: "text-orange-600 dark:text-orange-400",
      alcohol: "text-orange-600 dark:text-orange-400",
      smoking: "text-orange-600 dark:text-orange-400",
      gambling: "text-orange-600 dark:text-orange-400",
      shopping: "text-orange-600 dark:text-orange-400",
      gaming: "text-orange-600 dark:text-orange-400",
      other: "text-orange-600 dark:text-orange-400",
      // Positive habit streaks
      mood_logging: "text-blue-600 dark:text-blue-400",
      journal: "text-green-600 dark:text-green-400",
      exercise: "text-teal-600 dark:text-teal-400",
      meditation: "text-purple-600 dark:text-purple-400",
      sleep: "text-indigo-600 dark:text-indigo-400",
      hydration: "text-cyan-600 dark:text-cyan-400",
  reading: "text-indigo-600 dark:text-indigo-400",
  gratitude: "text-purple-600 dark:text-purple-400",
  deep_work: "text-emerald-600 dark:text-emerald-400",
  steps: "text-teal-600 dark:text-teal-400",
    };
    return (
      colors[behaviorType as keyof typeof colors] ||
      "text-orange-600 dark:text-orange-400"
    );
  };

  const getStreakDisplayName = (behaviorType: string) => {
    const names = {
      // Addiction/resistance streaks
      addiction_recovery: "Recovery",
      porn: "Porn Free",
      social_media: "Social Media",
      alcohol: "Alcohol Free",
      smoking: "Smoke Free",
      gambling: "Gamble Free",
      shopping: "Shop Free",
      gaming: "Game Free",
      other: "Clean",
      // Positive habit streaks
      mood_logging: "Mood Check",
      journal: "Journal",
      exercise: "Exercise",
      meditation: "Meditation",
      sleep: "Sleep",
      hydration: "Hydration",
  reading: "Reading",
  gratitude: "Gratitude",
  deep_work: "Deep Work",
  steps: "Steps",
    };
    return (
      names[behaviorType as keyof typeof names] ||
      behaviorType.replace("_", " ")
    );
  };

  const getCardGradient = (
    theme:
      | "welcome"
      | "celebration"
      | "quickActions"
      | "progress"
      | "timeline"
      | "streaks"
      | "journal",
    isDark: boolean = false,
  ) => {
    const gradients = {
      welcome: isDark
        ? (["#064e3b", "#1e40af"] as const)
        : (["#f0fdf4", "#dbeafe"] as const),
      celebration: isDark
        ? (["#451a03", "#7c2d12"] as const)
        : (["#fefce8", "#fed7aa"] as const),
      quickActions: isDark
        ? (["#581c87", "#6b21a8"] as const)
        : (["#faf5ff", "#e9d5ff"] as const),
      progress: isDark
        ? (["#831843", "#be185d"] as const)
        : (["#fdf2f8", "#fce7f3"] as const),
      timeline: isDark
        ? (["#312e81", "#3730a3"] as const)
        : (["#eef2ff", "#e0e7ff"] as const),
      streaks: isDark
        ? (["#451a03", "#78350f"] as const)
        : (["#fffbeb", "#fef3c7"] as const),
      journal: isDark
        ? (["#064e3b", "#065f46"] as const)
        : (["#ecfdf5", "#d1fae5"] as const),
    };
    return gradients[theme];
  };

  const getMoodEmoji = (mood: number) => {
    const moods = ["😢", "😕", "😐", "😊", "😄"];
    return moods[mood - 1] || "😐";
  };

  // Strip HTML tags from content
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  const getWellnessScore = () => {
    let score = 0;
    const todayStr = new Date().toISOString().split("T")[0];

    // Weights (total 100)
    const weights = {
      mood: 35,
      sleep: 25,
      habits: 20,
      addiction: 20,
    };

    // Mood (average mood 1-5)
    if (todayMoodLogs.length > 0) {
      const avgMood = todayMoodLogs.reduce((sum, log) => sum + log.mood, 0) / todayMoodLogs.length;
      score += (avgMood / 5) * weights.mood;
    }

    // Sleep (duration + quality)
    if (todaySleep) {
      const sleepScore = Math.min(todaySleep.sleepDurationHours / 8, 1) * 0.7 + (todaySleep.sleepQuality / 5) * 0.3;
      score += sleepScore * weights.sleep;
    }

    // Habits (percentage of active habits completed today)
    if (dashboardData?.recentHabitCompletions && dashboardData?.recentHabitCompletions.length > 0 && habits?.length) {
      const todaysCompletions = dashboardData.recentHabitCompletions.filter((c: any) => c.date === todayStr && c.completed);
      const activeHabits = habits.length;
      if (activeHabits > 0) {
        const habitCompletionRate = Math.min(todaysCompletions.length / activeHabits, 1);
        score += habitCompletionRate * weights.habits;
      }
    }

    // Addiction resistance (urges resisted today)
    if (dashboardData?.recentAddictionLogs) {
      const todayAddictionLogs = dashboardData.recentAddictionLogs.filter((log: any) => (log.timestamp || log.createdAt)?.startsWith(todayStr));
      const resistedCount = todayAddictionLogs.filter((log: any) => log.eventType === "urge" && log.wasResisted).length;
      score += Math.min(resistedCount / 3, 1) * weights.addiction;
    }

    return Math.round(score);
  };

  if (isInitializing) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-secondary/30">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-lg font-semibold">
          Initializing SelfSync...
        </Text>
        <Text className="text-muted-foreground">
          Setting up your personal wellness tracker
        </Text>
      </SafeAreaView>
    );
  }

  if (dbError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center gap-4 p-6 bg-secondary/30">
        <Text className="text-lg font-semibold text-destructive">
          Database Error
        </Text>
        <Text className="text-center text-muted-foreground">{dbError}</Text>
        <Button onPress={retry}>
          <Text>Retry</Text>
        </Button>
      </SafeAreaView>
    );
  }

  if (!isInitialized) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-secondary/30">
        <Text className="text-lg font-semibold">Database not ready</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-secondary/30" edges={["left", "right"]}>
      <WelcomeDialog visible={showWelcome} onComplete={handleWelcomeComplete} />

      {/* Header */}
      <LinearGradient
        colors={
          isDarkColorScheme ? ["#581c87", "#831843"] : ["#a855f7", "#ec4899"]
        } // dark: purple-900 to pink-900, light: purple-500 to pink-500
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="pb-8"
        style={{ paddingTop: 56 }} // Account for status bar height
      >
        <View className="flex-row items-center justify-between mb-6 px-4 mt-4">
          <View className="flex-row items-center gap-2">
            <Star className="w-10 h-10 text-white" />
            <Text className="text-3xl font-bold text-white">SelfSync</Text>
          </View>
          <ThemeToggle />
        </View>

        {/* Personalized Greeting */}
        <View className="mb-4 px-4 min-h-[100px] justify-center">
          {userName && !userLoading ? (
            <>
              <Text className="text-white/90 dark:text-white/80 text-lg leading-6">
                {getCurrentTime()},
              </Text>
              <Text className="text-white text-3xl font-bold leading-10 mt-1">
                {userName}! 🌟
              </Text>
              <Text className="text-white/80 dark:text-white/70 text-base mt-2 leading-6">
                Your wellness journey awaits! ✨
              </Text>
            </>
          ) : !userLoading ? (
            <>
              <Text className="text-white/90 dark:text-white/80 text-lg leading-6">
                {getCurrentTime()}!
              </Text>
              <View className="flex-row items-center gap-2 mt-1">
                <Text className="text-white text-3xl font-bold leading-10 flex-1">
                  Welcome to SelfSync
                </Text>
                <Star className="w-7 h-7 text-white" />
              </View>
              <Text className="text-white/80 dark:text-white/70 text-base mt-2 leading-6">
                Let's start your amazing wellness journey! 🌈
              </Text>
            </>
          ) : (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white text-lg ml-2 leading-6">
                Getting everything ready for you...
              </Text>
            </View>
          )}
        </View>

        {/* Wellness Score */}
        <View className="px-4 mb-4">
          <Card className="bg-white/15 dark:bg-white/10 border-white/30 dark:border-white/20">
            <CardContent className="pt-6">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white/90 dark:text-white/80 text-sm font-medium">
                    Your Wellness Score 🎯
                  </Text>
                  <Text className="text-white text-4xl font-bold">
                    {getWellnessScore()}
                  </Text>
                  <Text className="text-white/70 dark:text-white/60 text-sm">
                    out of 100
                  </Text>
                  <Text className="text-white/80 dark:text-white/70 text-xs mt-1">
                    {getWellnessScore() >= 80
                      ? "You're absolutely crushing it! 🎉"
                      : getWellnessScore() >= 60
                        ? "You're doing amazing! Keep going! 💪"
                        : getWellnessScore() >= 40
                          ? "Great progress! Every step counts! 🌱"
                          : "You're here, and that's what matters! 💚"}
                  </Text>
                </View>
                <View className="items-center ml-4">
                  <Progress value={getWellnessScore()} className="w-16 h-16" />
                  <Text className="text-white/90 dark:text-white/80 text-xs mt-2 text-center">
                    {getWellnessScore() >= 80
                      ? "🎉 Amazing"
                      : getWellnessScore() >= 60
                        ? "😊 Great"
                        : getWellnessScore() >= 40
                          ? "🌱 Growing"
                          : "Starting"}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1 bg-secondary/30"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 32,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B5CF6"
            colors={["#8B5CF6"]}
          />
        }
      >
        <View className="gap-4">
          {/* Motivational Welcome Card */}
          {todayMoodLogs.length === 0 && !todaySleep && !todayJournal && (
            <Card className="w-full shadow-sm border-green-200 dark:border-green-800">
              <LinearGradient
                colors={getCardGradient("welcome", isDarkColorScheme)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-lg"
              >
                <CardContent className="pt-4">
                  <View className="items-center py-4">
                    <Text className="text-6xl mb-4">🌱</Text>
                    <Text className="text-green-800 dark:text-green-200 text-lg font-bold text-center mb-2">
                      Ready to bloom today? 🌸
                    </Text>
                    <Text className="text-green-600 dark:text-green-400 text-center text-sm">
                      Start tracking your wellness journey! ✨
                    </Text>
                  </View>
                </CardContent>
              </LinearGradient>
            </Card>
          )}

          {/* Progress Celebration Card */}
          {(todayMoodLogs.length > 0 || todaySleep || todayJournal) && (
            <Card className="w-full shadow-sm border-yellow-200 dark:border-yellow-800">
              <LinearGradient
                colors={getCardGradient("celebration", isDarkColorScheme)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-lg"
              >
                <CardContent className="pt-4">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-3xl">🎉</Text>
                    <View className="flex-1">
                      <Text className="text-yellow-800 dark:text-yellow-200 font-bold text-base">
                        You're doing incredible today!
                      </Text>
                      <Text className="text-yellow-600 dark:text-yellow-400 text-sm mt-1">
                        {todayMoodLogs.length > 0 && "Mood check ✓ "}
                        {todaySleep && "Sleep logged ✓ "}
                        {todayJournal && "Journal entry ✓ "}
                        Keep it up! 🌟
                      </Text>
                    </View>
                  </View>
                </CardContent>
              </LinearGradient>
            </Card>
          )}

          {/* Quick Tracker Actions - Mobile Optimized */}
          <Card className="w-full shadow-sm border-2 border-purple-200 dark:border-purple-800 overflow-hidden">
            <LinearGradient
              colors={getCardGradient("quickActions", isDarkColorScheme)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-lg overflow-hidden"
            >
              <CardHeader className="pb-2 px-4">
                <CardTitle className="flex-row items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <View className="flex-1">
                    <Text className="text-purple-800 dark:text-purple-200 font-semibold leading-6">
                      Share Your Day 💝
                    </Text>
                  </View>
                </CardTitle>
                <Text className="text-sm text-purple-600 dark:text-purple-400">
                  What's happening today? ✨
                </Text>
              </CardHeader>
              <CardContent className="pt-0 pb-16 px-4">
                <View className="gap-2">
                  {getQuickActions().map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <Button
                        key={action.id}
                        variant="outline"
                        onPress={action.action}
                        className={`w-full min-h-[50px] flex-row justify-start items-center gap-3 px-3 py-3 border-2 ${action.color.replace("bg-", "bg-").replace("border-", "border-")} dark:bg-muted/20 dark:border-muted`}
                      >
                        <IconComponent className="w-5 h-5 text-foreground flex-shrink-0" />
                        <View className="flex-1 items-start">
                          <Text className="text-sm font-bold text-foreground">
                            {action.title}
                          </Text>
                          <Text className="text-xs text-muted-foreground">
                            {action.description}
                          </Text>
                        </View>
                      </Button>
                    );
                  })}
                </View>
              </CardContent>
            </LinearGradient>
          </Card>

          {/* Today's Progress Overview */}
          <Card className="w-full shadow-sm border-2 border-pink-200 dark:border-pink-800">
            <LinearGradient
              colors={getCardGradient("progress", isDarkColorScheme)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-lg"
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex-row items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  <View className="flex-1">
                    <Text className="text-pink-800 dark:text-pink-200 font-semibold leading-6">
                      Your Beautiful Progress Today 🌸
                    </Text>
                  </View>
                </CardTitle>
                <Text className="text-sm text-pink-600 dark:text-pink-400">
                  Your daily wellness at a glance 💖
                </Text>
              </CardHeader>
              <CardContent className="pt-0">
                <View className="flex-row gap-2">
                  <Card className="flex-1 items-center p-3 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800">
                    <Smile className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                    <Text className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                      Mood
                    </Text>
                    <Text className="font-bold text-lg text-blue-800 dark:text-blue-200">
                      {todayMoodLogs.length > 0
                        ? (
                            todayMoodLogs.reduce(
                              (sum, log) => sum + log.mood,
                              0,
                            ) / todayMoodLogs.length
                          ).toFixed(1)
                        : "-"}
                    </Text>
                    <Text className="text-xs text-blue-500 dark:text-blue-400 text-center">
                      {todayMoodLogs.length > 0
                        ? `${todayMoodLogs.length} check-ins! 🌟`
                        : "Ready to share? 💫"}
                    </Text>
                  </Card>
                  <Card className="flex-1 items-center p-3 bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-200 dark:border-purple-800">
                    <Moon className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
                    <Text className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                      Sleep
                    </Text>
                    <Text className="font-bold text-lg text-purple-800 dark:text-purple-200">
                      {todaySleep?.sleepDurationHours?.toFixed(1) || "-"}h
                    </Text>
                    <Text className="text-xs text-purple-500 dark:text-purple-400 text-center">
                      {todaySleep
                        ? "Rest well logged! 😴"
                        : "Sweet dreams await! 🌙"}
                    </Text>
                  </Card>
                </View>
                <View className="flex-row gap-2 mt-2">
                  <Card className="flex-1 items-center p-3 bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800">
                    <Activity className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
                    <Text className="text-xs text-green-600 dark:text-green-400 font-bold">
                      Total Logs
                    </Text>
                    <Text className="font-bold text-lg text-green-800 dark:text-green-200">
                      {todayMoodLogs.length +
                        (todaySleep ? 1 : 0) +
                        (todayJournal ? 1 : 0)}
                    </Text>
                    <Text className="text-xs text-green-500 dark:text-green-400 text-center">
                      Amazing dedication! 🎯
                    </Text>
                  </Card>
                  <Card className="flex-1 items-center p-3 bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-200 dark:border-orange-800">
                    <Target className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-2" />
                    <Text className="text-xs text-orange-600 dark:text-orange-400 font-bold">
                      Wins Today
                    </Text>
                    <Text className="font-bold text-lg text-orange-800 dark:text-orange-200">
                      {dashboardData?.recentAddictionLogs?.filter(
                        (log: any) => {
                          const today = new Date().toISOString().split("T")[0];
                          return (
                            (log.timestamp || log.createdAt)?.startsWith(
                              today,
                            ) &&
                            log.eventType === "urge" &&
                            log.wasResisted
                          );
                        },
                      ).length || 0}
                    </Text>
                    <Text className="text-xs text-orange-500 dark:text-orange-400 text-center">
                      You're so strong! 💪
                    </Text>
                  </Card>
                </View>
              </CardContent>
            </LinearGradient>
          </Card>

          {/* Recent Activity Timeline */}
          <Card className="w-full shadow-sm border-2 border-indigo-200 dark:border-indigo-800">
            <LinearGradient
              colors={getCardGradient("timeline", isDarkColorScheme)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-lg"
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <View className="flex-1">
                      <Text className="text-indigo-800 dark:text-indigo-200 font-semibold leading-6">
                        Your Daily Story 📖
                      </Text>
                    </View>
                  </View>
                </CardTitle>
                <Text className="text-sm text-indigo-600 dark:text-indigo-400">
                  Your recent activity & progress 🌱
                </Text>
              </CardHeader>
              <CardContent className="pt-0">
                <View className="gap-3">
                  {getRecentEntries()
                    .slice(0, 4)
                    .map((entry, index) => (
                      <View
                        key={index}
                        className="flex-row items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border-2 border-indigo-100 dark:border-indigo-800"
                      >
                        <View className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 items-center justify-center border-2 border-indigo-200 dark:border-indigo-700">
                          <Text className="text-sm">
                            {entry.type === "mood"
                              ? "😊"
                              : entry.type === "sleep"
                                ? "😴"
                                : entry.type === "habit"
                                  ? "✅"
                                  : entry.type === "activity"
                                    ? "🏃"
                                    : "🎯"}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="font-semibold text-sm text-indigo-800 dark:text-indigo-200">
                            {entry.value}
                          </Text>
                          <Text className="text-xs text-indigo-600 dark:text-indigo-400">
                            {entry.time} ✨
                          </Text>
                        </View>
                      </View>
                    ))}

                  {getRecentEntries().length === 0 && (
                    <View className="items-center py-6 bg-rose-50 dark:bg-rose-950/30 rounded-lg border-2 border-rose-200 dark:border-rose-800">
                      <Star className="w-12 h-12 text-rose-600 dark:text-rose-400 mb-2" />
                      <Text className="font-bold mb-1 text-rose-800 dark:text-rose-200">
                        Start Your Journey! 🌟
                      </Text>
                      <Text className="text-sm text-rose-600 dark:text-rose-400 text-center">
                        Begin tracking to create your timeline! 💫
                      </Text>
                    </View>
                  )}
                </View>
              </CardContent>
            </LinearGradient>
          </Card>

          {/* Active Streaks */}
          <Card className="w-full shadow-sm border-2 border-yellow-200 dark:border-yellow-800">
            <LinearGradient
              colors={getCardGradient("streaks", isDarkColorScheme)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-lg"
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Flame className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <View className="flex-1">
                      <Text className="text-yellow-800 dark:text-yellow-200 font-semibold leading-6">
                        Your Amazing Streaks 🔥
                      </Text>
                    </View>
                  </View>
                </CardTitle>
                <Text className="text-sm text-yellow-600 dark:text-yellow-400">
                  Building healthy habits, one day at a time ✨
                </Text>
              </CardHeader>
              <CardContent className="pt-0">
                {streaksLoading ? (
                  <View className="items-center py-4">
                    <ActivityIndicator />
                    <Text className="text-yellow-600 dark:text-yellow-400 mt-2">
                      Loading your amazing progress...
                    </Text>
                  </View>
                ) : streaks.length > 0 ? (
                  <View className="flex-row gap-2 flex-wrap">
                    {streaks
                      .filter((s) => s.currentStreak > 0)
                      .slice(0, 6)
                      .map((streak) => {
                        const IconComponent = getStreakIcon(
                          streak.behaviorType,
                        );
                        const streakStyle = getStreakStyle(
                          streak.behaviorType,
                          isDarkColorScheme,
                        );
                        const textColor = getStreakTextColor(
                          streak.behaviorType,
                        );
                        const displayName = getStreakDisplayName(
                          streak.behaviorType,
                        );
                        return (
                          <View key={streak.id} className="w-[48%] mb-2">
                            <LinearGradient
                              colors={streakStyle.colors}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              className="rounded-lg px-3 py-2 min-h-[50px]"
                              style={{
                                borderRadius: 12,
                                borderWidth: 2,
                                borderColor: streakStyle.border.includes(
                                  "orange",
                                )
                                  ? isDarkColorScheme
                                    ? "#ea580c"
                                    : "#fed7aa"
                                  : streakStyle.border.includes("blue")
                                    ? isDarkColorScheme
                                      ? "#3b82f6"
                                      : "#dbeafe"
                                    : streakStyle.border.includes("green")
                                      ? isDarkColorScheme
                                        ? "#16a34a"
                                        : "#dcfce7"
                                      : streakStyle.border.includes("purple")
                                        ? isDarkColorScheme
                                          ? "#9333ea"
                                          : "#e9d5ff"
                                        : streakStyle.border.includes("indigo")
                                          ? isDarkColorScheme
                                            ? "#6366f1"
                                            : "#e0e7ff"
                                          : streakStyle.border.includes("teal")
                                            ? isDarkColorScheme
                                              ? "#0d9488"
                                              : "#ccfbf1"
                                            : streakStyle.border.includes(
                                                  "cyan",
                                                )
                                              ? isDarkColorScheme
                                                ? "#0891b2"
                                                : "#cffafe"
                                              : isDarkColorScheme
                                                ? "#ea580c"
                                                : "#fed7aa",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 4,
                              }}
                            >
                              <View className="flex-row items-center gap-2">
                                <IconComponent
                                  className={`w-4 h-4 ${textColor}`}
                                />
                                <Text
                                  className={`text-xs font-medium ${textColor}`}
                                  numberOfLines={1}
                                >
                                  {displayName}
                                </Text>
                              </View>
                              <View className="flex-row items-center gap-1">
                                <Text
                                  className={`text-lg font-bold ${textColor}`}
                                >
                                  {streak.currentStreak}
                                </Text>
                                <Text className={`text-xs ${textColor}`}>
                                  {streak.currentStreak === 1
                                    ? "day 🎉"
                                    : "days 🚀"}
                                </Text>
                              </View>
                            </LinearGradient>
                          </View>
                        );
                      })}
                  </View>
                ) : (
                  <View className="items-center py-6 bg-pink-50 dark:bg-pink-950/30 rounded-lg border-2 border-pink-200 dark:border-pink-800">
                    <Star className="w-12 h-12 text-pink-600 dark:text-pink-400 mb-2" />
                    <Text className="font-bold mb-1 text-pink-800 dark:text-pink-200">
                      Ready for Your First Streak? 🌈
                    </Text>
                    <Text className="text-sm text-pink-600 dark:text-pink-400 text-center">
                      Start building healthy habits today! 💪
                    </Text>
                  </View>
                )}
              </CardContent>
            </LinearGradient>
          </Card>

          {/* Quick Journal Entry */}
          <Card className="w-full shadow-sm border-2 border-emerald-200 dark:border-emerald-800">
            <LinearGradient
              colors={getCardGradient("journal", isDarkColorScheme)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-lg"
            >
              <CardContent className="pt-4">
                <View className="flex-row items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <Text className="font-bold text-emerald-800 dark:text-emerald-200">
                    Share Your Heart Today 💚
                  </Text>
                </View>
                <Text className="text-sm text-emerald-600 dark:text-emerald-400 mb-3">
                  {todayJournal
                    ? "You've shared your thoughts today! ✨"
                    : "Capture your thoughts and feelings 🌟"}
                </Text>
                <Button
                  variant={todayJournal ? "secondary" : "default"}
                  className={`w-full h-12 ${
                    todayJournal
                      ? "bg-emerald-100 dark:bg-emerald-900/50 border-2 border-emerald-300 dark:border-emerald-700"
                      : "bg-emerald-500 border-2 border-emerald-400"
                  }`}
                  onPress={() => router.push("/(tabs)/journal")}
                >
                  <View className="flex-row items-center gap-2">
                    <FileText
                      className={`w-4 h-4 ${
                        todayJournal
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-white"
                      }`}
                    />
                    <Text
                      className={`font-semibold ${
                        todayJournal
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-white"
                      }`}
                    >
                      {todayJournal
                        ? "View Your Entry 💖"
                        : "Start Journaling ✍️"}
                    </Text>
                  </View>
                </Button>
              </CardContent>
            </LinearGradient>
          </Card>

          {/* Crisis Support - Minimal */}
          <Card className="w-full shadow-sm bg-red-50/30 dark:bg-red-950/30 border-red-200 dark:border-red-800">
            <CardContent className="pt-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <Text className="font-semibold text-red-800 dark:text-red-300">
                      Need Support?
                    </Text>
                  </View>
                  <Text className="text-sm text-red-600 dark:text-red-400">
                    Crisis resources & coping tools
                  </Text>
                </View>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 dark:border-red-700"
                >
                  <Text className="text-red-700 dark:text-red-300">Help</Text>
                </Button>
              </View>
            </CardContent>
          </Card>

          {/* Database Management - Development Only */}
          <Card className="w-full shadow-sm bg-gray-50/30 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800">
            <CardContent className="pt-4">
              <View className="items-center gap-3">
                <View className="flex-row items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <Text className="font-semibold text-gray-800 dark:text-gray-300">
                    Database Reset (Dev Tool)
                  </Text>
                </View>
                <Text className="text-sm text-gray-600 dark:text-gray-400 text-center mb-3">
                  Completely resets database - drops all tables & recreates fresh
                </Text>
                <Button
                  variant="destructive"
                  className="w-full h-12 bg-red-600 border-2 border-red-500"
                  onPress={handleClearDatabase}
                >
                  <View className="flex-row items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-white" />
                    <Text className="font-semibold text-white">
                      Reset Database Tables
                    </Text>
                  </View>
                </Button>
                <Text className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Drops all tables and recreates them fresh (perfect for testing schema changes)
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* Bottom spacing for navigation */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
