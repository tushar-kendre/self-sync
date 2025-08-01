import React from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { useDatabase, useAddictionLogs } from "../../lib/hooks/useDatabase";
import { useColorScheme } from "../../lib/useColorScheme";
import { AddictionLog } from "../../lib/database/types";
import { Shield } from "../../lib/icons/Shield";
import { Target } from "../../lib/icons/Target";
import { Star } from "../../lib/icons/Star";
import { AlertTriangle } from "../../lib/icons/AlertTriangle";
import { Activity } from "../../lib/icons/Activity";
import { Flame } from "../../lib/icons/Flame";
import { Zap } from "../../lib/icons/Zap";
import { useFocusEffect } from "expo-router";

const addictionTypes = [
  {
    value: "porn",
    label: "Pornography",
    icon: "❌",
    description: "Adult content addiction",
  },
  {
    value: "social_media",
    label: "Social Media",
    icon: "📱",
    description: "Social media platforms",
  },
  {
    value: "alcohol",
    label: "Alcohol",
    icon: "🥃",
    description: "Alcohol consumption",
  },
  {
    value: "smoking",
    label: "Smoking",
    icon: "🚬",
    description: "Cigarettes, vaping, tobacco",
  },
  {
    value: "gambling",
    label: "Gambling",
    icon: "🎰",
    description: "Betting, casinos, lottery",
  },
  {
    value: "shopping",
    label: "Shopping",
    icon: "🛍️",
    description: "Compulsive shopping",
  },
  {
    value: "gaming",
    label: "Gaming",
    icon: "🎮",
    description: "Video games addiction",
  },
  {
    value: "other",
    label: "Other",
    icon: "💭",
    description: "Other addiction type",
  },
];

const eventTypes = [
  {
    value: "urge",
    label: "Urge",
    emoji: "⚡",
    description: "Felt an urge or craving",
    color:
      "bg-yellow-100 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-800",
  },
];

const urgeIntensityOptions = [
  {
    value: 1,
    label: "Very Mild",
    emoji: "😌",
    description: "Barely noticeable",
  },
  { value: 2, label: "Mild", emoji: "😐", description: "Manageable urge" },
  { value: 3, label: "Moderate", emoji: "😰", description: "Noticeable urge" },
  {
    value: 4,
    label: "Strong",
    emoji: "😣",
    description: "Difficult to resist",
  },
  {
    value: 5,
    label: "Overwhelming",
    emoji: "😵",
    description: "Very intense urge",
  },
];

const moodOptions = [
  { value: 1, emoji: "😢", label: "Very Bad" },
  { value: 2, emoji: "😕", label: "Bad" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

const commonTriggers = [
  "Stress",
  "Boredom",
  "Loneliness",
  "Anxiety",
  "Depression",
  "Social Pressure",
  "Anger",
  "Celebration",
  "Habit/Routine",
  "Physical Pain",
  "Insomnia",
  "Work Pressure",
  "Relationship Issues",
  "Financial Worry",
  "Environmental Cues",
];

const commonLocations = [
  "Home",
  "Work",
  "Car",
  "Bar/Restaurant",
  "Friend's Place",
  "Outside",
  "Bedroom",
  "Living Room",
  "Kitchen",
  "Bathroom",
  "Public Place",
  "Online",
];

const copingStrategies = [
  "Deep Breathing",
  "Exercise",
  "Call Support Person",
  "Meditation",
  "Walk Away",
  "Distraction Activity",
  "Journal Writing",
  "Cold Shower",
  "Music",
  "Reading",
  "Progressive Relaxation",
  "Positive Self-Talk",
  "Delay Technique",
];

// Component to display resistance metrics for a specific addiction type
const ResistanceMetricsDisplay: React.FC<{ addictionType: string }> = ({
  addictionType,
}) => {
  const { isDarkColorScheme } = useColorScheme();
  const { getResistanceMetrics } = useAddictionLogs();
  const [metrics, setMetrics] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (addictionType) {
      loadMetrics();
    }
  }, [addictionType]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const result = await getResistanceMetrics(addictionType);
      setMetrics(result);
    } catch (error) {
      console.error("Error loading resistance metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return null;
  }

  const getResistanceLevel = (
    resistanceRate: number,
    totalResisted: number,
  ) => {
    if (resistanceRate >= 90 && totalResisted >= 50) {
      return {
        level: "Master of Resistance",
        badge: "🏆",
        color: "text-yellow-600",
      };
    } else if (resistanceRate >= 80 && totalResisted >= 30) {
      return {
        level: "Resistance Champion",
        badge: "🥇",
        color: "text-yellow-500",
      };
    } else if (resistanceRate >= 70 && totalResisted >= 20) {
      return {
        level: "Determined Fighter",
        badge: "⚔️",
        color: "text-purple-600",
      };
    } else if (resistanceRate >= 60 && totalResisted >= 10) {
      return { level: "Growing Stronger", badge: "💪", color: "text-blue-600" };
    } else if (totalResisted >= 5) {
      return { level: "First Steps", badge: "🌱", color: "text-green-600" };
    } else {
      return { level: "Starting Out", badge: "🎯", color: "text-gray-600" };
    }
  };

  const levelInfo = getResistanceLevel(
    metrics.resistanceRate,
    metrics.totalResisted,
  );

  return (
    <Card className="w-full shadow-sm border-green-200 dark:border-green-800">
      <LinearGradient
        colors={
          isDarkColorScheme ? ["#16a34a", "#059669"] : ["#dcfce7", "#d1fae5"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="rounded-lg"
      >
        <CardContent className="pt-4">
          <View className="flex-row items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            <Text className="text-lg font-semibold text-green-800 dark:text-green-200">
              Your Resistance Power 🛡️
            </Text>
          </View>

          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl">{levelInfo.badge}</Text>
              <Text className={`font-semibold ${levelInfo.color}`}>
                {levelInfo.level}
              </Text>
            </View>
            <Text className="text-2xl font-bold text-green-700 dark:text-green-300">
              {metrics.resistanceRate}%
            </Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-green-700 dark:text-green-300 text-sm">
              Resisted: {metrics.totalResisted}/{metrics.totalUrges} urges
            </Text>
            <Text className="text-green-700 dark:text-green-300 text-sm">
              Score: {metrics.totalResistanceScore} pts
            </Text>
          </View>

          {metrics.consecutiveResistances > 0 && (
            <View className="flex-row items-center gap-1 mt-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <Text className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                {metrics.consecutiveResistances} resistance streak! 🔥
              </Text>
            </View>
          )}
        </CardContent>
      </LinearGradient>
    </Card>
  );
};

export default function AddictionLogScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const { isInitialized } = useDatabase();
  const {
    createAddictionLog,
    getTodayAddictionLogs,
    getAddictionStreak,
    getResistanceMetrics,
    generateResistanceMessage,
    loading: addictionLoading,
  } = useAddictionLogs();

  // Form state
  const [addictionType, setAddictionType] = React.useState<
    | "porn"
    | "social_media"
    | "alcohol"
    | "smoking"
    | "gambling"
    | "shopping"
    | "gaming"
    | "other"
    | ""
  >("");
  const [eventType, setEventType] = React.useState<"urge" | "">("urge"); // Default to urge since it's the only option
  const [wasResisted, setWasResisted] = React.useState<boolean>(false);
  const [urgeIntensity, setUrgeIntensity] = React.useState<number | null>(null);
  const [durationMinutes, setDurationMinutes] = React.useState<number>(0);
  const [trigger, setTrigger] = React.useState<string>("");
  const [location, setLocation] = React.useState<string>("");
  const [moodBefore, setMoodBefore] = React.useState<number>(3);
  const [moodAfter, setMoodAfter] = React.useState<number>(3);
  const [copingStrategy, setCopingStrategy] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");

  // App state
  const [isLoading, setIsLoading] = React.useState(false);
  const [todayLogs, setTodayLogs] = React.useState<AddictionLog[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState("");
  const [addictionStreak, setAddictionStreak] = React.useState<number>(0);

  // Close form when navigating away from this tab
  useFocusEffect(
    React.useCallback(() => {
      // When screen comes into focus, do nothing
      return () => {
        // When screen loses focus (user navigates away), close the form
        setShowForm(false);
      };
    }, []),
  );

  // Helper function for theme-aware gradients
  const getGradientColors = (
    type:
      | "header"
      | "formHeader"
      | "motivational"
      | "summary"
      | "encouragement"
      | "success"
      | "warning"
      | "milestone"
      | "quickAdd"
      | "bottomEncouragement",
    isDark: boolean = false,
  ) => {
    const gradients = {
      header: isDark
        ? (["#dc2626", "#ea580c"] as const)
        : (["#ef4444", "#f97316"] as const),
      formHeader: isDark
        ? (["#ea580c", "#dc2626"] as const)
        : (["#f97316", "#ef4444"] as const),
      motivational: isDark
        ? (["#ea580c", "#dc2626"] as const)
        : (["#fef3c7", "#fed7aa"] as const),
      summary: isDark
        ? (["#16a34a", "#059669"] as const)
        : (["#dcfce7", "#d1fae5"] as const),
      encouragement: isDark
        ? (["#7c3aed", "#be185d"] as const)
        : (["#f3e8ff", "#fdf2f8"] as const),
      success: isDark
        ? (["#16a34a", "#059669"] as const)
        : (["#dcfce7", "#d1fae5"] as const),
      warning: isDark
        ? (["#dc2626", "#991b1b"] as const)
        : (["#fecaca", "#fee2e2"] as const),
      milestone: isDark
        ? (["#1d4ed8", "#7c3aed"] as const)
        : (["#dbeafe", "#e9d5ff"] as const),
      quickAdd: isDark
        ? (["#dc2626", "#ea580c"] as const)
        : (["#ef4444", "#f97316"] as const),
      bottomEncouragement: isDark
        ? (["#16a34a", "#059669"] as const)
        : (["#dcfce7", "#d1fae5"] as const),
    };
    return gradients[type];
  };

  // Load today's logs when component mounts or database is ready
  React.useEffect(() => {
    if (isInitialized) {
      loadTodayLogs();
      loadAddictionStreak();
    }
  }, [isInitialized]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (isInitialized) {
        loadTodayLogs();
        loadAddictionStreak();
      }
    }, [isInitialized]),
  );

  const loadTodayLogs = async () => {
    try {
      const logs = await getTodayAddictionLogs();
      setTodayLogs(logs);
    } catch (error) {
      console.error("Error loading today's addiction logs:", error);
    }
  };

  const loadAddictionStreak = async () => {
    try {
      const streak = await getAddictionStreak();
      setAddictionStreak(streak);
    } catch (error) {
      console.error("Error loading addiction streak:", error);
    }
  };

  const handleSave = async () => {
    if (!addictionType) {
      return; // Only require addiction type since event is always "urge"
    }

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      await createAddictionLog({
        date: today,
        addictionType: addictionType as
          | "porn"
          | "social_media"
          | "alcohol"
          | "smoking"
          | "gambling"
          | "shopping"
          | "gaming"
          | "other",
        eventType: "urge", // Always urge since milestones are auto-awarded
        wasResisted: wasResisted, // This determines if they resisted the urge
        urgeIntensity: urgeIntensity || 3,
        durationMinutes,
        trigger,
        location,
        moodBefore,
        moodAfter,
        copingStrategy,
        notes: notes.trim(),
        timestamp: new Date().toISOString(),
      });

      // Generate enhanced resistance messaging for urges
      const resistanceMessage = await generateResistanceMessage(
        addictionType as string,
        wasResisted,
        urgeIntensity || 3,
      );

      setSuccessMessage(
        `${resistanceMessage.title}\n\n${resistanceMessage.message}\n\n${resistanceMessage.encouragement}`,
      );

      setShowSuccessMessage(true);

      // Hide success message after 4 seconds
      setTimeout(() => setShowSuccessMessage(false), 4000);

      // Reset form
      setAddictionType("");
      setEventType("urge"); // Reset to default urge
      setWasResisted(false);
      setUrgeIntensity(null);
      setDurationMinutes(0);
      setTrigger("");
      setLocation("");
      setMoodBefore(3);
      setMoodAfter(3);
      setCopingStrategy("");
      setNotes("");
      setShowForm(false);

      // Reload today's logs and streak
      await loadTodayLogs();
      await loadAddictionStreak();
    } catch (error) {
      console.error("Error saving addiction log:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getMotivationalMessage = () => {
    const resistedToday = todayLogs.filter(
      (log) => log.eventType === "urge" && log.wasResisted,
    ).length;
    const totalUrges = todayLogs.filter(
      (log) => log.eventType === "urge",
    ).length;

    if (resistedToday > 0) {
      return `Amazing! You've resisted ${resistedToday} urge${resistedToday !== 1 ? "s" : ""} today! 🛡️`;
    } else if (totalUrges > 0) {
      return "You're tracking your patterns - that's huge progress! 🌟";
    } else {
      return "Every moment of awareness is a step toward freedom! 💪";
    }
  };

  const getStreakMessage = () => {
    if (addictionStreak === 0) {
      return "Start your recovery journey! Every step counts! 🌱";
    } else if (addictionStreak === 1) {
      return "Day 1 complete! You're building momentum! 🚀";
    } else if (addictionStreak < 7) {
      return `${addictionStreak} days strong! You're proving your strength! ⭐`;
    } else if (addictionStreak < 30) {
      return `${addictionStreak} days clean! You're a recovery warrior! 🛡️`;
    } else if (addictionStreak < 90) {
      return `${addictionStreak} days! Incredible transformation! 🌟`;
    } else {
      return `${addictionStreak} days! You're a true inspiration! 👑`;
    }
  };

  const renderLogItem = ({ item }: { item: AddictionLog }) => {
    const time = new Date(item.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const eventTypeData = eventTypes.find((e) => e.value === item.eventType);

    return (
      <Card
        className={`mb-3 border-l-4 ${
          item.eventType === "urge" && item.wasResisted
            ? "border-l-green-400 dark:border-l-green-500"
            : item.eventType === "milestone"
              ? "border-l-blue-400 dark:border-l-blue-500"
              : "border-l-yellow-400 dark:border-l-yellow-500"
        }`}
      >
        <CardContent className="pt-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl">{eventTypeData?.emoji}</Text>
              <View>
                <Text className="font-semibold text-foreground">
                  {eventTypeData?.label}
                  {item.eventType === "urge" && item.wasResisted
                    ? " (Resisted)"
                    : ""}
                </Text>
                <Text
                  className={`text-xs font-medium ${
                    item.eventType === "urge" && item.wasResisted
                      ? "text-green-600 dark:text-green-400"
                      : item.eventType === "milestone"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-yellow-600 dark:text-yellow-400"
                  }`}
                >
                  {item.addictionType} • {time}
                </Text>
              </View>
            </View>
          </View>

          {item.urgeIntensity && (
            <View className="flex-row items-center gap-1 mb-1">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <Text className="text-sm text-foreground">
                Intensity: {item.urgeIntensity}/5
              </Text>
            </View>
          )}

          {item.trigger && (
            <Text className="text-sm text-muted-foreground mb-1">
              🎯 Trigger: {item.trigger}
            </Text>
          )}

          {item.location && (
            <Text className="text-sm text-muted-foreground mb-1">
              📍 Location: {item.location}
            </Text>
          )}

          {item.copingStrategy && (
            <Text className="text-sm text-muted-foreground mb-1">
              🛡️ Coping: {item.copingStrategy}
            </Text>
          )}

          {item.notes && (
            <Text className="text-sm text-foreground italic bg-gray-50 dark:bg-gray-900/50 p-2 rounded mt-2">
              💭 "{item.notes}"
            </Text>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!showForm) {
    // Show loading state while database is initializing
    if (!isInitialized) {
      return (
        <SafeAreaView className="flex-1 justify-center items-center bg-background">
          <Shield className="w-12 h-12 text-red-500 mb-4" />
          <Text className="text-lg font-semibold text-foreground">
            Getting ready...
          </Text>
          <Text className="text-muted-foreground">
            Setting up your recovery tracker
          </Text>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
        <ScrollView className="flex-1">
          {/* Success Message Overlay */}
          {showSuccessMessage && (
            <View className="absolute top-20 left-6 right-6 z-50">
              <Card className="bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800">
                <CardContent className="pt-4">
                  <View className="flex-row items-center gap-3">
                    <Star className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <Text className="flex-1 text-green-800 dark:text-green-200 font-medium">
                      {successMessage}
                    </Text>
                  </View>
                </CardContent>
              </Card>
            </View>
          )}

          {/* Header */}
          <LinearGradient
            colors={getGradientColors("header", isDarkColorScheme)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-8 pb-12"
            style={{ paddingTop: 48 }}
          >
            <View className="px-6 pb-6">
              <View className="flex-row items-center gap-3 mb-4 mt-12">
                <Shield className="w-6 h-6 text-white" />
                <Text className="text-2xl font-bold text-white">
                  Recovery Tracking
                </Text>
              </View>
              <Text className="text-white/90 dark:text-white/80 text-lg mb-2">
                {getMotivationalMessage()}
              </Text>
              <Text className="text-white/70 dark:text-white/60 text-sm">
                {getCurrentTime()} • {new Date().toLocaleDateString()}
              </Text>
            </View>
          </LinearGradient>

          <View className="gap-6 px-6 py-6 -mt-4">
            {/* Motivational Card */}
            <Card className="w-full shadow-sm border-orange-200 dark:border-orange-800 rounded-lg overflow-hidden">
              <LinearGradient
                colors={getGradientColors("motivational", isDarkColorScheme)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-lg"
              >
                <CardContent className="pt-4">
                  <View className="flex-row items-center gap-3 mb-2">
                    <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    <Text className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                      {getStreakMessage()}
                    </Text>
                  </View>
                  <Text className="text-orange-700 dark:text-orange-300 text-sm">
                    Recovery is a journey of courage and strength! 💪✨
                  </Text>
                </CardContent>
              </LinearGradient>
            </Card>

            {/* Quick Add Button */}
            <TouchableOpacity
              onPress={() => setShowForm(true)}
              className="w-full shadow-lg rounded-xl overflow-hidden"
              style={{
                shadowColor: "#dc2626",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <LinearGradient
                colors={getGradientColors("quickAdd", isDarkColorScheme)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="w-full items-center justify-center"
                style={{
                  minHeight: 56,
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                }}
              >
                <View className="flex-row items-center justify-center gap-3">
                  <Shield className="w-6 h-6 text-white" />
                  <Text className="font-bold text-white text-lg text-center">
                    ✨ Log Recovery Experience
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Today's Summary */}
            {todayLogs.length > 0 && (
              <Card className="w-full shadow-sm border-green-200 dark:border-green-800">
                <LinearGradient
                  colors={getGradientColors("summary", isDarkColorScheme)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-lg"
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="flex-row items-center gap-2">
                      <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <Text className="text-green-800 dark:text-green-200">
                        Today's Recovery Progress! 🌟
                      </Text>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-sm text-green-700 dark:text-green-300">
                        📊 {todayLogs.length} log
                        {todayLogs.length !== 1 ? "s" : ""} recorded
                      </Text>
                      <Text className="text-sm text-green-700 dark:text-green-300">
                        🛡️{" "}
                        {
                          todayLogs.filter(
                            (log) =>
                              log.eventType === "urge" && log.wasResisted,
                          ).length
                        }{" "}
                        urges resisted
                      </Text>
                    </View>
                    <Text className="text-xs text-green-600 dark:text-green-400">
                      You're building incredible recovery awareness! 🚀
                    </Text>
                  </CardContent>
                </LinearGradient>
              </Card>
            )}

            {/* Today's Logs */}
            <Card className="w-full shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex-row items-center gap-2">
                  <Flame className="w-5 h-5" />
                  <View className="flex-1">
                    <Text className="text-lg font-semibold leading-6">
                      Your Recovery Journey Today 🛡️
                    </Text>
                  </View>
                </CardTitle>
                <Text className="text-sm text-muted-foreground">
                  Every log is a step toward freedom! 💪
                </Text>
              </CardHeader>
              <CardContent className="pt-0">
                {todayLogs.length === 0 ? (
                  <View className="py-8 items-center">
                    <Text className="text-6xl mb-4">🌱</Text>
                    <Text className="text-muted-foreground text-center text-lg font-medium mb-2">
                      Ready to track your journey?
                    </Text>
                    <Text className="text-muted-foreground text-center">
                      Start logging to build awareness! 🌟
                    </Text>
                  </View>
                ) : (
                  <View>
                    <View className="flex-row items-center gap-2 mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <Star className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <Text className="text-green-800 dark:text-green-200 font-medium">
                        Amazing commitment to your recovery! 🚀
                      </Text>
                    </View>
                    <FlatList
                      data={todayLogs.sort(
                        (a, b) =>
                          new Date(b.timestamp).getTime() -
                          new Date(a.timestamp).getTime(),
                      )}
                      renderItem={renderLogItem}
                      keyExtractor={(item) => item.id}
                      scrollEnabled={false}
                    />
                  </View>
                )}
              </CardContent>
            </Card>

            {/* Bottom spacing */}
            <View className="h-8" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Addiction Log Entry Form
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
      <ScrollView className="flex-1">
        {/* Header */}
        <LinearGradient
          colors={getGradientColors("formHeader", isDarkColorScheme)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="py-8 pb-12"
          style={{ paddingTop: 48 }}
        >
          <View className="px-6 pb-6">
            <View className="flex-row items-center gap-3 mb-4 mt-8">
              <Shield className="w-6 h-6 text-white" />
              <Text className="text-2xl font-bold text-white">
                ✨ Track Your Journey
              </Text>
            </View>
            <Text className="text-white/90 dark:text-white/80 text-lg mb-2">
              Every log is a step toward freedom! 🌟
            </Text>
            <Text className="text-white/70 dark:text-white/60 text-sm">
              {getCurrentTime()} • {new Date().toLocaleDateString()}
            </Text>
          </View>
        </LinearGradient>

        <View className="gap-6 px-6 py-6 -mt-4">
          {/* Encouragement Card */}
          <Card className="w-full shadow-sm border-purple-200 dark:border-purple-800">
            <LinearGradient
              colors={getGradientColors("encouragement", isDarkColorScheme)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-lg"
            >
              <CardContent className="pt-4">
                <View className="flex-row items-center gap-3">
                  <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <Text className="text-lg font-semibold text-purple-800 dark:text-purple-200">
                    You're So Brave! 💜
                  </Text>
                </View>
                <Text className="text-purple-700 dark:text-purple-300 text-sm mt-2">
                  Tracking takes courage. You're building real strength! 💪✨
                </Text>
              </CardContent>
            </LinearGradient>
          </Card>

          {/* Resistance Metrics Summary */}
          {addictionType && (
            <ResistanceMetricsDisplay addictionType={addictionType} />
          )}

          {/* Addiction Type */}
          <Card className="w-full shadow-sm border-2 border-red-200 dark:border-red-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex-row items-center gap-2">
                <Target className="w-5 h-5 text-red-600 dark:text-red-400" />
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-red-800 dark:text-red-200 leading-6">
                    What area are you tracking? 🎯
                  </Text>
                </View>
              </CardTitle>
              <Text className="text-sm text-muted-foreground">
                Choose the type that best fits your experience *
              </Text>
            </CardHeader>
            <CardContent className="pt-0">
              <View className="gap-3">
                {addictionTypes.map((type) => (
                  <Pressable
                    key={type.value}
                    onPress={() =>
                      setAddictionType(
                        type.value as
                          | "porn"
                          | "social_media"
                          | "alcohol"
                          | "smoking"
                          | "gambling"
                          | "shopping"
                          | "gaming"
                          | "other",
                      )
                    }
                    className={`p-4 rounded-xl border-2 flex-row items-center gap-3 ${
                      addictionType === type.value
                        ? "bg-red-100 border-red-400 dark:bg-red-950/30 dark:border-red-600"
                        : "bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700"
                    }`}
                  >
                    <Text className="text-2xl">{type.icon}</Text>
                    <View className="flex-1">
                      <Text
                        className={`font-semibold ${
                          addictionType === type.value
                            ? "text-red-700 dark:text-red-300"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {type.label}
                      </Text>
                      <Text
                        className={`text-sm ${
                          addictionType === type.value
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-500 dark:text-gray-500"
                        }`}
                      >
                        {type.description}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Was Resisted */}
          <Card className="w-full shadow-sm border border-green-200 dark:border-green-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex-row items-center gap-2">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-green-800 dark:text-green-200 leading-6">
                    Did you resist this urge? 🛡️
                  </Text>
                </View>
              </CardTitle>
              <Text className="text-sm text-muted-foreground">
                Celebrating your victories, big and small!
              </Text>
            </CardHeader>
            <CardContent className="pt-0">
              <View className="flex-row gap-4">
                <Pressable
                  onPress={() => setWasResisted(true)}
                  className={`flex-1 p-4 rounded-xl border-2 items-center ${
                    wasResisted
                      ? "bg-green-100 border-green-400 dark:bg-green-950/30 dark:border-green-600"
                      : "bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700"
                  }`}
                >
                  <Text className="text-2xl mb-2">🛡️</Text>
                  <Text
                    className={`font-semibold text-center ${
                      wasResisted
                        ? "text-green-700 dark:text-green-300"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Yes, I resisted!
                  </Text>
                  <Text
                    className={`text-sm text-center mt-1 ${
                      wasResisted
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-500 dark:text-gray-500"
                    }`}
                  >
                    Incredible strength!
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setWasResisted(false)}
                  className={`flex-1 p-4 rounded-xl border-2 items-center ${
                    !wasResisted
                      ? "bg-orange-100 border-orange-400 dark:bg-orange-950/30 dark:border-orange-600"
                      : "bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700"
                  }`}
                >
                  <Text className="text-2xl mb-2">⚡</Text>
                  <Text
                    className={`font-semibold text-center ${
                      !wasResisted
                        ? "text-orange-700 dark:text-orange-300"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    No, I gave in
                  </Text>
                  <Text
                    className={`text-sm text-center mt-1 ${
                      !wasResisted
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-gray-500 dark:text-gray-500"
                    }`}
                  >
                    Still learning!
                  </Text>
                </Pressable>
              </View>
            </CardContent>
          </Card>

          {/* Urge Intensity */}
          <Card className="w-full shadow-sm border border-yellow-200 dark:border-yellow-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex-row items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 leading-6">
                    Urge Intensity ⚡
                  </Text>
                </View>
              </CardTitle>
              <Text className="text-sm text-muted-foreground">
                How strong was the urge you experienced?
              </Text>
            </CardHeader>
            <CardContent className="pt-0">
              <View className="flex-row justify-center gap-3">
                {urgeIntensityOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setUrgeIntensity(option.value)}
                    className={`items-center p-3 rounded-xl border-2 min-w-[60px] ${
                      urgeIntensity === option.value
                        ? "bg-yellow-100 border-yellow-400 dark:bg-yellow-950/30 dark:border-yellow-600"
                        : "bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700"
                    }`}
                  >
                    <Text className="text-2xl mb-1">{option.emoji}</Text>
                    <Text
                      className={`text-xs font-bold ${
                        urgeIntensity === option.value
                          ? "text-yellow-700 dark:text-yellow-300"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {option.value}
                    </Text>
                    <Text
                      className={`text-xs text-center ${
                        urgeIntensity === option.value
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-gray-500 dark:text-gray-500"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Trigger */}
          <Card className="w-full shadow-sm border border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex-row items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-purple-800 dark:text-purple-200 leading-6">
                    What triggered this? 🎯
                  </Text>
                </View>
              </CardTitle>
              <Text className="text-sm text-muted-foreground">
                Understanding triggers helps break patterns (Optional)
              </Text>
            </CardHeader>
            <CardContent className="pt-0">
              <View className="flex-row flex-wrap gap-2 mb-3">
                {commonTriggers.map((triggerItem) => (
                  <Pressable
                    key={triggerItem}
                    onPress={() =>
                      setTrigger(trigger === triggerItem ? "" : triggerItem)
                    }
                    className={`px-3 py-2 rounded-full border-2 ${
                      trigger === triggerItem
                        ? "bg-purple-100 border-purple-400 dark:bg-purple-950/30 dark:border-purple-600"
                        : "bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        trigger === triggerItem
                          ? "text-purple-700 dark:text-purple-300"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {triggerItem}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                value={trigger}
                onChangeText={setTrigger}
                placeholder="Or describe your own trigger..."
                placeholderTextColor="#9ca3af"
                className="border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4 text-foreground bg-white dark:bg-gray-900/50"
              />
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="w-full shadow-sm border border-teal-200 dark:border-teal-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex-row items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-teal-800 dark:text-teal-200 leading-6">
                    Where were you? 📍
                  </Text>
                </View>
              </CardTitle>
              <Text className="text-sm text-muted-foreground">
                Location patterns can provide insights (Optional)
              </Text>
            </CardHeader>
            <CardContent className="pt-0">
              <View className="flex-row flex-wrap gap-2">
                {commonLocations.map((locationItem) => (
                  <Pressable
                    key={locationItem}
                    onPress={() =>
                      setLocation(location === locationItem ? "" : locationItem)
                    }
                    className={`px-3 py-2 rounded-full border-2 ${
                      location === locationItem
                        ? "bg-teal-100 border-teal-400 dark:bg-teal-950/30 dark:border-teal-600"
                        : "bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        location === locationItem
                          ? "text-teal-700 dark:text-teal-300"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {locationItem}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Coping Strategy (show only when urge was resisted) */}
          {wasResisted && (
            <Card className="w-full shadow-sm border border-green-200 dark:border-green-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex-row items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-green-800 dark:text-green-200 leading-6">
                      How did you resist? 🛡️
                    </Text>
                  </View>
                </CardTitle>
                <Text className="text-sm text-muted-foreground">
                  Celebrate your coping strategies! (Optional)
                </Text>
              </CardHeader>
              <CardContent className="pt-0">
                <View className="flex-row flex-wrap gap-2">
                  {copingStrategies.map((strategy) => (
                    <Pressable
                      key={strategy}
                      onPress={() =>
                        setCopingStrategy(
                          copingStrategy === strategy ? "" : strategy,
                        )
                      }
                      className={`px-3 py-2 rounded-full border-2 ${
                        copingStrategy === strategy
                          ? "bg-green-100 border-green-400 dark:bg-green-950/30 dark:border-green-600"
                          : "bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          copingStrategy === strategy
                            ? "text-green-700 dark:text-green-300"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {strategy}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </CardContent>
            </Card>
          )}

          {/* Consumption Details (show only when urge was not resisted) */}
          {!wasResisted && (
            <Card className="w-full shadow-sm border border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex-row items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-orange-800 dark:text-orange-200 leading-6">
                      {addictionType === "alcohol" ||
                      addictionType === "smoking"
                        ? "How much did you consume? 📊"
                        : "How long did you engage? ⏱️"}
                    </Text>
                  </View>
                </CardTitle>
                <Text className="text-sm text-muted-foreground">
                  This helps track patterns and progress (Optional)
                </Text>
              </CardHeader>
              <CardContent className="pt-0">
                <TextInput
                  value={durationMinutes > 0 ? durationMinutes.toString() : ""}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 0;
                    setDurationMinutes(value);
                  }}
                  placeholder={
                    addictionType === "alcohol"
                      ? "e.g., 2 (drinks)"
                      : addictionType === "smoking"
                        ? "e.g., 5 (cigarettes)"
                        : "e.g., 30 (minutes)"
                  }
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  className="border-2 border-orange-200 dark:border-orange-700 rounded-xl p-4 text-foreground bg-white dark:bg-gray-900/50"
                />
                <Text className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                  {addictionType === "alcohol"
                    ? "Number of drinks consumed"
                    : addictionType === "smoking"
                      ? "Number of cigarettes smoked"
                      : "Time spent in minutes"}
                </Text>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card className="w-full shadow-sm border border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex-row items-center gap-2">
                <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-blue-800 dark:text-blue-200 leading-6">
                    Your thoughts 💭
                  </Text>
                </View>
              </CardTitle>
              <Text className="text-sm text-muted-foreground">
                Share anything else about this experience (Optional)
              </Text>
            </CardHeader>
            <CardContent className="pt-0">
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="How are you feeling? What insights do you have? Remember, you're doing amazing! ✨"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                className="border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 text-foreground bg-white dark:bg-gray-900/50 min-h-[80px]"
                style={{ textAlignVertical: "top" }}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <View className="gap-4">
            <TouchableOpacity
              onPress={handleSave}
              disabled={!addictionType || isLoading}
              className="w-full shadow-lg rounded-xl overflow-hidden"
              style={{
                opacity: !addictionType || isLoading ? 0.5 : 1,
                shadowColor: "#dc2626",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: !addictionType || isLoading ? 0 : 0.3,
                shadowRadius: 8,
              }}
            >
              <LinearGradient
                colors={getGradientColors("quickAdd", isDarkColorScheme)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="w-full items-center justify-center"
                style={{
                  minHeight: 60,
                  paddingHorizontal: 24,
                  paddingVertical: 18,
                }}
              >
                <View className="flex-row items-center justify-center gap-3">
                  <Shield className="w-6 h-6 text-white" />
                  <Text className="font-bold text-white text-lg text-center">
                    {isLoading
                      ? "Saving Your Journey... 💪"
                      : "Save Recovery Log 🌟"}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowForm(false)}
              className="w-full shadow-sm"
              style={{
                shadowColor: "#6b7280",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }}
            >
              <View
                className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl items-center justify-center bg-white dark:bg-gray-900/50"
                style={{
                  minHeight: 52,
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                }}
              >
                <Text className="font-medium text-lg text-gray-700 dark:text-gray-300 text-center">
                  Maybe Later 💙
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Bottom Encouragement */}
          <Card className="w-full shadow-sm border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
            <LinearGradient
              colors={getGradientColors(
                "bottomEncouragement",
                isDarkColorScheme,
              )}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <CardContent className="pt-4">
                <Text
                  className={`text-center font-medium ${isDarkColorScheme ? "text-white" : "text-green-800"}`}
                >
                  🌟 You're incredibly brave for facing this journey!
                </Text>
                <Text
                  className={`text-center text-sm mt-1 ${isDarkColorScheme ? "text-white/90" : "text-green-700"}`}
                >
                  Every step you take is building a stronger, freer you! 💪✨
                </Text>
              </CardContent>
            </LinearGradient>
          </Card>

          {/* Bottom spacing */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
