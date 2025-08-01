import * as React from "react";
import {
  View,
  ScrollView,
  TextInput,
  FlatList,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import type { MoodLog } from "~/lib/database/types";
import { Smile } from "~/lib/icons/Smile";
import { BarChart3 } from "~/lib/icons/BarChart3";
import { Activity } from "~/lib/icons/Activity";
import { AlertTriangle } from "~/lib/icons/AlertTriangle";
import { FileText } from "~/lib/icons/FileText";
import { Star } from "~/lib/icons/Star";
import { Zap } from "~/lib/icons/Zap";
import { useDatabase, useMoodLogs } from "~/lib/hooks/useDatabase";
import { useColorScheme } from "~/lib/useColorScheme";
import { ClipboardList } from "~/lib/icons/ClipboardList";
import { useFocusEffect } from "expo-router";

const moodOptions = [
  {
    value: 1,
    emoji: "😢",
    label: "Very Bad",
    color: "bg-red-100 border-red-300 dark:bg-red-950/30 dark:border-red-800",
  },
  {
    value: 2,
    emoji: "😕",
    label: "Bad",
    color:
      "bg-orange-100 border-orange-300 dark:bg-orange-950/30 dark:border-orange-800",
  },
  {
    value: 3,
    emoji: "😐",
    label: "Okay",
    color:
      "bg-yellow-100 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-800",
  },
  {
    value: 4,
    emoji: "😊",
    label: "Good",
    color:
      "bg-green-100 border-green-300 dark:bg-green-950/30 dark:border-green-800",
  },
  {
    value: 5,
    emoji: "😄",
    label: "Great",
    color:
      "bg-blue-100 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800",
  },
];

const stressLevelOptions = [
  { value: 1, label: "Very Low", color: "bg-green-50 dark:bg-green-950/20" },
  { value: 2, label: "Low", color: "bg-blue-50 dark:bg-blue-950/20" },
  { value: 3, label: "Medium", color: "bg-yellow-50 dark:bg-yellow-950/20" },
  { value: 4, label: "High", color: "bg-orange-50 dark:bg-orange-950/20" },
  { value: 5, label: "Very High", color: "bg-red-50 dark:bg-red-950/20" },
];

const energyLevelOptions = [
  { value: 1, label: "Exhausted", color: "bg-red-50 dark:bg-red-950/20" },
  { value: 2, label: "Low", color: "bg-orange-50 dark:bg-orange-950/20" },
  { value: 3, label: "Moderate", color: "bg-yellow-50 dark:bg-yellow-950/20" },
  { value: 4, label: "High", color: "bg-green-50 dark:bg-green-950/20" },
  { value: 5, label: "Energized", color: "bg-blue-50 dark:bg-blue-950/20" },
];

const contextOptions = [
  "Work",
  "Home",
  "Social",
  "Exercise",
  "Commute",
  "Sleep",
  "Meal",
  "Break",
  "Outdoors",
  "Other",
];

// Memoized component for tag items to prevent navigation context issues
const TagItem = React.memo(
  ({
    tag,
    isSelected,
    onPress,
  }: {
    tag: string;
    isSelected: boolean;
    onPress: () => void;
  }) => {
    const handlePress = React.useCallback(() => {
      console.log("TagItem TouchableOpacity pressed for:", tag);
      try {
        // Simple direct call - let the parent handle timing
        onPress();
      } catch (error) {
        console.error("Error in tag press:", error);
      }
    }, [onPress, tag]);

    // Use React Native's StyleSheet instead of NativeWind for critical components
    const containerStyle = React.useMemo(
      () => ({
        flexDirection: "row" as const,
        alignItems: "center" as const,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: isSelected ? "#818cf8" : "#d1d5db",
        backgroundColor: isSelected ? "#eef2ff" : "#ffffff",
        shadowColor: isSelected ? "#000" : "transparent",
        shadowOffset: isSelected
          ? { width: 0, height: 2 }
          : { width: 0, height: 0 },
        shadowOpacity: isSelected ? 0.1 : 0,
        shadowRadius: isSelected ? 4 : 0,
        elevation: isSelected ? 2 : 0,
      }),
      [isSelected],
    );

    const textStyle = React.useMemo(
      () => ({
        fontSize: 14,
        fontWeight: "500" as const,
        color: isSelected ? "#4f46e5" : "#6b7280",
      }),
      [isSelected],
    );

    const checkIconStyle = React.useMemo(
      () => ({
        marginLeft: 8,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#6366f1",
        alignItems: "center" as const,
        justifyContent: "center" as const,
      }),
      [],
    );

    const checkTextStyle = React.useMemo(
      () => ({
        color: "#ffffff",
        fontSize: 12,
      }),
      [],
    );

    return (
      <TouchableOpacity
        onPress={handlePress}
        style={containerStyle}
        // Add hitSlop for better touch handling on native
        hitSlop={
          Platform.OS !== "web"
            ? { top: 8, bottom: 8, left: 8, right: 8 }
            : undefined
        }
      >
        <Text style={textStyle}>{tag}</Text>
        {isSelected && (
          <View style={checkIconStyle}>
            <Text style={checkTextStyle}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  },
);

export default function MoodCheckScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const { isInitialized } = useDatabase();
  const {
    createMoodLog,
    getTodayMoodLogs,
    getMoodStreak,
    loading: moodLoading,
  } = useMoodLogs();

  // Ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = React.useRef(true);

  // Form state
  const [selectedMood, setSelectedMood] = React.useState<number | null>(null);
  const [selectedStress, setSelectedStress] = React.useState<number | null>(
    null,
  );
  const [selectedEnergy, setSelectedEnergy] = React.useState<number | null>(
    null,
  );
  const [selectedContext, setSelectedContext] = React.useState<string>("");
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [notes, setNotes] = React.useState<string>("");

  // App state
  const [isLoading, setIsLoading] = React.useState(false);
  const [todayLogs, setTodayLogs] = React.useState<MoodLog[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState("");
  const [moodStreak, setMoodStreak] = React.useState<number>(0);

  // Cleanup ref on unmount
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
      setShowForm(false);
    };
  }, []);

  // Close form when navigating away from this tab
  useFocusEffect(
    React.useCallback(() => {
      // When screen comes into focus, do nothing for now
      return () => {
        // When screen loses focus (user navigates away), close the form
        setShowForm(false);
      };
    }, []),
  );

  const getMoodBasedTags = React.useCallback((moodLevel: number | null) => {
    if (moodLevel === null) return [];

    if (moodLevel <= 2) {
      // Difficult/challenging mood tags
      return [
        "Overwhelmed",
        "Anxious",
        "Sad",
        "Frustrated",
        "Tired",
        "Stressed",
        "Lonely",
        "Worried",
        "Disappointed",
        "Irritated",
        "Confused",
        "Drained",
      ];
    } else if (moodLevel === 3) {
      // Neutral/balanced mood tags
      return [
        "Calm",
        "Focused",
        "Peaceful",
        "Steady",
        "Balanced",
        "Thoughtful",
        "Reflective",
        "Content",
        "Mindful",
        "Present",
        "Grounded",
        "Stable",
      ];
    } else {
      // Positive/uplifting mood tags
      return [
        "Happy",
        "Grateful",
        "Energized",
        "Motivated",
        "Excited",
        "Confident",
        "Joyful",
        "Optimistic",
        "Inspired",
        "Creative",
        "Accomplished",
        "Loved",
      ];
    }
  }, []);

  // Memoize the available tags based on selected mood
  const availableTags = React.useMemo(() => {
    return getMoodBasedTags(selectedMood);
  }, [selectedMood, getMoodBasedTags]);

  // Helper function for theme-aware gradients
  const getGradientColors = React.useCallback(
    (
      type:
        | "header"
        | "formHeader"
        | "motivational"
        | "summary"
        | "encouragement"
        | "moodResponse"
        | "tagsSelected"
        | "notesInput"
        | "bottomEncouragement"
        | "quickAdd",
      isDark: boolean = false,
    ) => {
      const gradients = {
        header: isDark
          ? (["#1e3a8a", "#581c87"] as const)
          : (["#3b82f6", "#8b5cf6"] as const),
        formHeader: isDark
          ? (["#166534", "#1e40af"] as const)
          : (["#10b981", "#3b82f6"] as const),
        motivational: isDark
          ? (["#166534", "#1e40af"] as const)
          : (["#ecfdf5", "#dbeafe"] as const),
        summary: isDark
          ? (["#854d0e", "#ea580c"] as const)
          : (["#fefce8", "#fed7aa"] as const),
        encouragement: isDark
          ? (["#be185d", "#7c3aed"] as const)
          : (["#fdf2f8", "#f3e8ff"] as const),
        moodResponse: isDark
          ? (["#581c87", "#be185d"] as const)
          : (["#faf5ff", "#fdf2f8"] as const),
        tagsSelected: isDark
          ? (["#3730a3", "#7c3aed"] as const)
          : (["#eef2ff", "#f3e8ff"] as const),
        notesInput: isDark
          ? (["#0f766e", "#166534"] as const)
          : (["#f0fdfa", "#f0fdf4"] as const),
        bottomEncouragement: isDark
          ? (["#1e40af", "#3730a3"] as const)
          : (["#dbeafe", "#e0e7ff"] as const),
        quickAdd: isDark
          ? (["#3b82f6", "#8b5cf6"] as const)
          : (["#3b82f6", "#8b5cf6"] as const),
      };
      return gradients[type];
    },
    [],
  );

  const loadTodayLogs = React.useCallback(async () => {
    try {
      const logs = await getTodayMoodLogs();
      setTodayLogs(logs);
    } catch (error) {
      console.error("Error loading today's mood logs:", error);
    }
  }, [getTodayMoodLogs]);

  const loadMoodStreak = React.useCallback(async () => {
    try {
      const streak = await getMoodStreak();
      setMoodStreak(streak);
    } catch (error) {
      console.error("Error loading mood streak:", error);
    }
  }, [getMoodStreak]);

  // Load today's logs when component mounts or database is ready
  React.useEffect(() => {
    if (isInitialized) {
      loadTodayLogs();
      loadMoodStreak();
    }
  }, [isInitialized, loadTodayLogs, loadMoodStreak]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (isInitialized) {
        loadTodayLogs();
        loadMoodStreak();
      }
    }, [isInitialized, loadTodayLogs, loadMoodStreak]),
  );

  const handleSave = React.useCallback(async () => {
    if (selectedMood === null) {
      return; // Require mood selection
    }

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      await createMoodLog({
        date: today,
        mood: selectedMood,
        energy: selectedEnergy || 3,
        stress: selectedStress || 3,
        context: selectedContext,
        tags: selectedTags,
        notes: notes.trim(),
        timestamp: new Date().toISOString(),
      });

      // Show positive reinforcement message
      const encouragingMessages = [
        "🌟 Amazing! You're building great self-awareness!",
        "🎉 Well done! Taking care of your mental health is a superpower!",
        "✨ Fantastic! Every check-in is a step toward better wellbeing!",
        "🌈 Awesome! You're creating positive habits that matter!",
        "💪 Great job! Your commitment to tracking is inspiring!",
        "🌻 Wonderful! Small steps lead to big changes!",
        "🚀 Excellent! You're investing in your best self!",
        "🌸 Beautiful! Self-care looks good on you!",
      ];

      const randomMessage =
        encouragingMessages[
          Math.floor(Math.random() * encouragingMessages.length)
        ];
      setSuccessMessage(randomMessage);
      setShowSuccessMessage(true);

      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccessMessage(false), 3000);

      // Reset form
      setSelectedMood(null);
      setSelectedStress(null);
      setSelectedEnergy(null);
      setSelectedContext("");
      setSelectedTags([]);
      setNotes("");
      setShowForm(false);

      // Reload today's logs and mood streak
      await loadTodayLogs();
      await loadMoodStreak();
    } catch (error) {
      console.error("Error saving mood log:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedMood,
    selectedEnergy,
    selectedStress,
    selectedContext,
    selectedTags,
    notes,
    createMoodLog,
    loadTodayLogs,
    loadMoodStreak,
  ]);

  const handleMoodSelection = React.useCallback((moodValue: number) => {
    setSelectedMood(moodValue);
    // Clear selected tags when mood changes since available tags will be different
    setSelectedTags([]);
  }, []);

  const handleTagToggle = React.useCallback((tag: string) => {
    console.log(
      "handleTagToggle called for tag:",
      tag,
      "at timestamp:",
      Date.now(),
    );

    try {
      setSelectedTags((prev) => {
        const newTags = prev.includes(tag)
          ? prev.filter((t) => t !== tag)
          : [...prev, tag];

        console.log("Tag toggle (direct):", tag, "New tags:", newTags);
        return newTags;
      });
    } catch (error) {
      console.error("Error in tag update:", error);
    }
  }, []);

  const renderMoodLogItem = React.useCallback(({ item }: { item: MoodLog }) => {
    const time = new Date(item.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const moodOption = moodOptions.find((m) => m.value === item.mood);

    return (
      <Card className="mb-3 border-l-4 border-l-green-400 dark:border-l-green-500">
        <CardContent className="pt-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl">{moodOption?.emoji}</Text>
              <View>
                <Text className="font-semibold text-foreground">
                  {moodOption?.label}
                </Text>
                <Text className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Great job checking in! ✨
                </Text>
              </View>
            </View>
            <Text className="text-sm text-muted-foreground">{time}</Text>
          </View>

          <View className="flex-row gap-4 mb-2">
            <View className="flex-row items-center gap-1">
              <Activity className="w-4 h-4 text-blue-500" />
              <Text className="text-sm text-foreground">
                Energy: {item.energy}/5
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <Text className="text-sm text-foreground">
                Stress: {item.stress}/5
              </Text>
            </View>
          </View>

          {item.context && (
            <Text className="text-sm text-muted-foreground mb-1">
              📍 {item.context}
            </Text>
          )}

          {item.tags && item.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-1 mb-2">
              {item.tags.map((tag, index) => (
                <View
                  key={`${item.id}-tag-${index}-${tag}`}
                  className="bg-blue-100 dark:bg-blue-950/30 px-2 py-1 rounded-full border border-blue-200 dark:border-blue-800"
                >
                  <Text className="text-xs text-blue-700 dark:text-blue-300">
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {item.notes && (
            <Text className="text-sm text-foreground italic bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
              💭 "{item.notes}"
            </Text>
          )}
        </CardContent>
      </Card>
    );
  }, []);

  const getCurrentTime = React.useCallback(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, []);

  const getMotivationalMessage = React.useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Good morning! ☀️ How are you starting your day?";
    } else if (hour < 17) {
      return "Good afternoon! 🌤️ Take a moment to check in with yourself";
    } else {
      return "Good evening! 🌙 How has your day been treating you?";
    }
  }, []);

  const getStreakMessage = React.useCallback(() => {
    if (moodStreak === 0) {
      return "Start your mood tracking journey! 🌱";
    } else if (moodStreak === 1) {
      return "Day 1 complete! You're building a healthy habit! 🚀";
    } else if (moodStreak === 2) {
      return "2 days strong! Momentum is building! ⭐";
    } else if (moodStreak === 3) {
      return "3 days in a row! You're on fire! 🔥";
    } else if (moodStreak < 7) {
      return `${moodStreak} day streak! Keep it going! ⭐`;
    } else if (moodStreak < 14) {
      return `${moodStreak} days strong! You're building resilience! 🌟`;
    } else if (moodStreak < 30) {
      return `${moodStreak} day streak! You're a wellness champion! 🏆`;
    } else {
      return `${moodStreak} days! Incredible dedication to self-care! 👑`;
    }
  }, [moodStreak]);

  if (!showForm) {
    // Show loading state while database is initializing
    if (!isInitialized) {
      return (
        <SafeAreaView className="flex-1 justify-center items-center bg-background">
          <Smile className="w-12 h-12 text-blue-500 mb-4" />
          <Text className="text-lg font-semibold text-foreground">
            Getting ready...
          </Text>
          <Text className="text-muted-foreground">
            Setting up your mood tracker
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
                <Smile className="w-6 h-6 text-white" />
                <Text className="text-2xl font-bold text-white">
                  Mood Tracking
                </Text>
              </View>
              <Text className="text-white/90 dark:text-white/80 text-lg mb-2">
                Check in with yourself! 💚
              </Text>
              <Text className="text-white/70 dark:text-white/60 text-sm">
                {getCurrentTime()} • {new Date().toLocaleDateString()}
              </Text>
            </View>
          </LinearGradient>

          <View className="gap-6 p-6 -mt-4">
            {/* Motivational Card */}
            <Card className="w-full shadow-sm border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
              <LinearGradient
                colors={getGradientColors("motivational", isDarkColorScheme)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-lg"
              >
                <CardContent className="pt-4">
                  <View className="flex-row items-center gap-3">
                    <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <Text className="flex-1 text-green-800 dark:text-green-200 font-medium">
                      {getStreakMessage()}
                    </Text>
                  </View>
                </CardContent>
              </LinearGradient>
            </Card>

            {/* Quick Add Button */}
            <TouchableOpacity
              onPress={() => setShowForm(true)}
              className="w-full shadow-lg rounded-lg overflow-hidden"
              style={{
                shadowColor: "#8b5cf6",
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
                  <Smile className="w-6 h-6 text-white" />
                  <Text className="font-bold text-white text-lg text-center">
                    ✨ Log Current Mood
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Today's Summary */}
            {todayLogs.length > 0 && (
              <Card className="w-full shadow-sm border-yellow-200 dark:border-yellow-800">
                <LinearGradient
                  colors={getGradientColors("summary", isDarkColorScheme)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-lg"
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="flex-row items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      <Text className="text-yellow-800 dark:text-yellow-200">
                        Today's Amazing Progress! 🎯
                      </Text>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-sm text-yellow-700 dark:text-yellow-300">
                        🏆 {todayLogs.length} check-in
                        {todayLogs.length !== 1 ? "s" : ""} completed
                      </Text>
                      <Text className="text-sm text-yellow-700 dark:text-yellow-300">
                        📊 Avg:{" "}
                        {(
                          todayLogs.reduce((sum, log) => sum + log.mood, 0) /
                          todayLogs.length
                        ).toFixed(1)}
                        /5
                      </Text>
                    </View>
                    <Text className="text-xs text-yellow-600 dark:text-yellow-400">
                      You're building incredible self-awareness! 🌟
                    </Text>
                  </CardContent>
                </LinearGradient>
              </Card>
            )}

            {/* Today's Logs */}
            <Card className="w-full shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex-row items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <View className="flex-1">
                    <Text className="text-lg font-semibold leading-6">
                      Your Mood Journey Today 📖
                    </Text>
                  </View>
                </CardTitle>
                <Text className="text-sm text-muted-foreground">
                  Your wellness journey today! 💚
                </Text>
              </CardHeader>
              <CardContent className="pt-0">
                {todayLogs.length === 0 ? (
                  <View className="py-8 items-center">
                    <Text className="text-6xl mb-4">🌱</Text>
                    <Text className="text-muted-foreground text-center text-lg font-medium mb-2">
                      Ready to start your day?
                    </Text>
                    <Text className="text-muted-foreground text-center">
                      Log your mood to begin! 🌟
                    </Text>
                  </View>
                ) : (
                  <View>
                    <View className="flex-row items-center gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <Text className="text-blue-800 dark:text-blue-200 font-medium">
                        You're doing great! Keep it up! 🚀
                      </Text>
                    </View>
                    <FlatList
                      data={todayLogs.sort(
                        (a, b) =>
                          new Date(b.timestamp).getTime() -
                          new Date(a.timestamp).getTime(),
                      )}
                      renderItem={renderMoodLogItem}
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
  // Mood Entry Form
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
              <Smile className="w-6 h-6 text-white" />
              <Text className="text-2xl font-bold text-white">
                ✨ Share Your Feelings
              </Text>
            </View>
            <Text className="text-white/90 dark:text-white/80 text-lg mb-2">
              You're taking an amazing step for your wellbeing! 🌟
            </Text>
            <Text className="text-white/70 dark:text-white/60 text-sm">
              {getCurrentTime()} • {new Date().toLocaleDateString()}
            </Text>
          </View>
        </LinearGradient>

        <View className="gap-6 p-6 -mt-4">
          {/* Encouragement Card */}
          <Card className="w-full shadow-sm border-pink-200 dark:border-pink-800">
            <LinearGradient
              colors={getGradientColors("encouragement", isDarkColorScheme)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-lg"
            >
              <CardContent className="pt-4">
                <View className="flex-row items-center gap-3">
                  <Star className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  <Text className="flex-1 text-pink-800 dark:text-pink-200 font-medium">
                    Your feelings matter! You're doing great! 💖
                  </Text>
                </View>
              </CardContent>
            </LinearGradient>
          </Card>
          {/* Mood Selection */}
          <Card className="w-full shadow-sm border-2 border-pink-200 dark:border-pink-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex-row items-center gap-3">
                <Text className="text-lg">How are you feeling? 💝</Text>
                <Text className="text-destructive">*</Text>
              </CardTitle>
              <Text className="text-sm text-muted-foreground">
                Connect with your emotions ✨
              </Text>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Mobile-Optimized Mood Selector with Visual Feedback */}
              <View className="mb-4">
                {/* Current Selection Display */}
                {selectedMood && (
                  <View className="items-center mb-4 p-3 bg-pink-50 dark:bg-pink-950/20 rounded-xl">
                    <Text className="text-3xl mb-1">
                      {moodOptions.find((m) => m.value === selectedMood)?.emoji}
                    </Text>
                    <Text className="font-medium text-pink-800 dark:text-pink-200">
                      {moodOptions.find((m) => m.value === selectedMood)?.label}
                    </Text>
                    <Text className="text-sm text-pink-600 dark:text-pink-400">
                      {selectedMood}/5 - You're doing great! 💖
                    </Text>
                  </View>
                )}

                {/* Compact Visual Scale */}
                <View className="px-2">
                  <View className="flex-row justify-between items-center mb-3">
                    {moodOptions.map((option) => {
                      const isSelected = selectedMood === option.value;
                      const moodButtonClass = isSelected
                        ? "items-center justify-center rounded-full bg-pink-100 dark:bg-pink-950/40 border-2 border-pink-400"
                        : "items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700";
                      const moodTextClass = isSelected
                        ? "text-xl transform scale-110"
                        : "text-xl transform scale-100";

                      return (
                        <TouchableOpacity
                          key={`mood-${option.value}`}
                          onPress={() => handleMoodSelection(option.value)}
                          className={moodButtonClass}
                          style={{
                            width: 50,
                            height: 50,
                          }}
                        >
                          <Text className={moodTextClass}>{option.emoji}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Labels below */}
                  <View className="flex-row justify-between">
                    {moodOptions.map((option) => (
                      <View
                        key={`mood-label-${option.value}`}
                        className="items-center"
                        style={{ width: 50 }}
                      >
                        <Text
                          className={`text-xs text-center ${
                            selectedMood === option.value
                              ? "text-pink-700 dark:text-pink-300 font-medium"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {option.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* Contextual Response to Mood Selection */}
              {selectedMood && (
                <Card className={`mt-4 border-0`}>
                  <LinearGradient
                    colors={
                      selectedMood <= 2
                        ? getGradientColors("moodResponse", isDarkColorScheme)
                        : selectedMood === 3
                          ? getGradientColors("motivational", isDarkColorScheme)
                          : getGradientColors(
                              "encouragement",
                              isDarkColorScheme,
                            )
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="rounded-lg"
                  >
                    <CardContent className="pt-4">
                      <View className="flex-row items-center gap-3">
                        {selectedMood <= 2 ? (
                          <>
                            <View className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 items-center justify-center">
                              <Text className="text-2xl">🤗</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-purple-800 dark:text-purple-200 font-bold text-base">
                                I hear you, and your feelings are completely
                                valid 💜
                              </Text>
                              <Text className="text-purple-600 dark:text-purple-300 text-sm mt-1 leading-relaxed">
                                It takes courage to acknowledge difficult
                                feelings. You're not alone in this journey.
                              </Text>
                            </View>
                          </>
                        ) : selectedMood === 3 ? (
                          <>
                            <View className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 items-center justify-center">
                              <Text className="text-2xl">🌟</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-blue-800 dark:text-blue-200 font-bold text-base">
                                Thank you for checking in with yourself! 💙
                              </Text>
                              <Text className="text-blue-600 dark:text-blue-300 text-sm mt-1 leading-relaxed">
                                Every day has its moments. You're doing
                                wonderfully by being mindful.
                              </Text>
                            </View>
                          </>
                        ) : (
                          <>
                            <View className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 items-center justify-center">
                              <Text className="text-2xl">🎉</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-green-800 dark:text-green-200 font-bold text-base">
                                That's wonderful! I'm so happy for you! 💚
                              </Text>
                              <Text className="text-green-600 dark:text-green-300 text-sm mt-1 leading-relaxed">
                                Your positive energy is beautiful. Keep shining
                                bright!
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                    </CardContent>
                  </LinearGradient>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Energy Level */}
          <Card className="w-full shadow-sm border border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold leading-6">
                    Energy Level ⚡
                  </Text>
                </View>
              </CardTitle>
              <Text className="text-sm text-muted-foreground">
                How is your energy feeling right now?
              </Text>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Compact Energy Level Slider */}
              <View className="px-2">
                {/* Current Selection Display */}
                {selectedEnergy && (
                  <View className="items-center mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                    <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-1" />
                    <Text className="font-medium text-blue-800 dark:text-blue-200">
                      {
                        energyLevelOptions.find(
                          (e) => e.value === selectedEnergy,
                        )?.label
                      }
                    </Text>
                    <Text className="text-sm text-blue-600 dark:text-blue-400">
                      {selectedEnergy}/5 - Your energy matters! ⚡
                    </Text>
                  </View>
                )}

                {/* Interactive Scale */}
                <View className="mb-3">
                  <View className="flex-row justify-between items-center mb-2 relative">
                    {energyLevelOptions.map((option, index) => (
                      <View
                        key={`energy-${option.value}`}
                        className="items-center flex-1 relative"
                      >
                        <TouchableOpacity
                          onPress={() => setSelectedEnergy(option.value)}
                          className="items-center"
                        >
                          <View
                            className={`w-8 h-8 rounded-full items-center justify-center mb-1 ${
                              selectedEnergy === option.value
                                ? "bg-blue-500"
                                : selectedEnergy &&
                                    selectedEnergy >= option.value
                                  ? "bg-blue-300 dark:bg-blue-600"
                                  : "bg-gray-200 dark:bg-gray-700"
                            }`}
                          >
                            <Text
                              className={`text-xs font-bold ${
                                selectedEnergy === option.value
                                  ? "text-white"
                                  : selectedEnergy &&
                                      selectedEnergy >= option.value
                                    ? "text-white"
                                    : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {option.value}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        {/* Connecting line */}
                        {index < energyLevelOptions.length - 1 && (
                          <View
                            className={`absolute top-4 h-0.5 ${
                              selectedEnergy && selectedEnergy > option.value
                                ? "bg-blue-300 dark:bg-blue-600"
                                : "bg-gray-200 dark:bg-gray-700"
                            }`}
                            style={{
                              left: "50%",
                              right: "-50%",
                              zIndex: -1,
                            }}
                          />
                        )}
                      </View>
                    ))}
                  </View>

                  {/* Labels */}
                  <View className="flex-row justify-between mt-2">
                    {energyLevelOptions.map((option) => (
                      <View
                        key={`energy-label-${option.value}`}
                        className="flex-1 items-center"
                      >
                        <Text
                          className={`text-xs text-center ${
                            selectedEnergy === option.value
                              ? "text-blue-700 dark:text-blue-300 font-medium"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {option.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Stress Level */}
          <Card className="w-full shadow-sm border border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold leading-6">
                    Stress Level 🧘‍♀️
                  </Text>
                </View>
              </CardTitle>
              <Text className="text-sm text-muted-foreground">
                What's your stress level like today?
              </Text>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Compact Stress Level Slider */}
              <View className="px-2">
                {/* Current Selection Display */}
                {selectedStress && (
                  <View className="items-center mb-4 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-1" />
                    <Text className="font-medium text-orange-800 dark:text-orange-200">
                      {
                        stressLevelOptions.find(
                          (s) => s.value === selectedStress,
                        )?.label
                      }
                    </Text>
                    <Text className="text-sm text-orange-600 dark:text-orange-400">
                      {selectedStress}/5 - You're managing well! 🧘‍♀️
                    </Text>
                  </View>
                )}

                {/* Interactive Scale */}
                <View className="mb-3">
                  <View className="flex-row justify-between items-center mb-2 relative">
                    {stressLevelOptions.map((option, index) => (
                      <View
                        key={`stress-${option.value}`}
                        className="items-center flex-1 relative"
                      >
                        <TouchableOpacity
                          onPress={() => setSelectedStress(option.value)}
                          className="items-center"
                        >
                          <View
                            className={`w-8 h-8 rounded-full items-center justify-center mb-1 ${
                              selectedStress === option.value
                                ? "bg-orange-500"
                                : selectedStress &&
                                    selectedStress >= option.value
                                  ? "bg-orange-300 dark:bg-orange-600"
                                  : "bg-gray-200 dark:bg-gray-700"
                            }`}
                          >
                            <Text
                              className={`text-xs font-bold ${
                                selectedStress === option.value
                                  ? "text-white"
                                  : selectedStress &&
                                      selectedStress >= option.value
                                    ? "text-white"
                                    : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {option.value}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        {/* Connecting line */}
                        {index < stressLevelOptions.length - 1 && (
                          <View
                            className={`absolute top-4 h-0.5 ${
                              selectedStress && selectedStress > option.value
                                ? "bg-orange-300 dark:bg-orange-600"
                                : "bg-gray-200 dark:bg-gray-700"
                            }`}
                            style={{
                              left: "50%",
                              right: "-50%",
                              zIndex: -1,
                            }}
                          />
                        )}
                      </View>
                    ))}
                  </View>

                  {/* Labels */}
                  <View className="flex-row justify-between mt-2">
                    {stressLevelOptions.map((option) => (
                      <View
                        key={`stress-label-${option.value}`}
                        className="flex-1 items-center"
                      >
                        <Text
                          className={`text-xs text-center ${
                            selectedStress === option.value
                              ? "text-orange-700 dark:text-orange-300 font-medium"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {option.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Context Selection */}
          <Card className="w-full shadow-sm border border-green-200 dark:border-green-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-green-600 dark:text-green-400" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold leading-6">
                    What's happening? 🌟
                  </Text>
                </View>
              </CardTitle>
              <Text className="text-sm text-muted-foreground">
                What are you up to right now? (Optional)
              </Text>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Current Selection Display */}
              {selectedContext && (
                <View className="items-center mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl">
                  <ClipboardList className="w-6 h-6 text-green-600 dark:text-green-400 mb-1" />
                  <Text className="font-medium text-green-800 dark:text-green-200">
                    {selectedContext}
                  </Text>
                  <Text className="text-sm text-green-600 dark:text-green-400">
                    Context matters! You're being mindful! 🌟
                  </Text>
                </View>
              )}

              {/* Compact Context Grid */}
              <View className="flex-row flex-wrap gap-2">
                {contextOptions.map((context) => {
                  const isSelected = selectedContext === context;
                  const contextButtonClass = isSelected
                    ? "px-3 py-2 rounded-full border border-green-500 bg-green-100 dark:bg-green-950/40"
                    : "px-3 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800";
                  const contextTextClass = isSelected
                    ? "text-sm font-medium text-green-700 dark:text-green-300"
                    : "text-sm font-medium text-gray-600 dark:text-gray-400";

                  return (
                    <TouchableOpacity
                      key={`context-${context}`}
                      onPress={() =>
                        setSelectedContext(
                          selectedContext === context ? "" : context,
                        )
                      }
                      className={contextButtonClass}
                    >
                      <Text className={contextTextClass}>{context}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </CardContent>
          </Card>

          {/* Tags Selection */}
          <Card className="w-full shadow-sm border border-indigo-200 dark:border-indigo-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 items-center justify-center">
                  <Star className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold leading-6">
                    Feeling vibes 🏷️
                  </Text>
                </View>
              </CardTitle>
              <Text className="text-sm text-muted-foreground">
                {selectedMood === null
                  ? "Select a mood first to see relevant feeling words ✨"
                  : "Pick words that capture your current energy (Optional)"}
              </Text>
            </CardHeader>
            <CardContent className="pt-0">
              {selectedMood === null ? (
                <View className="py-8 items-center">
                  <Text className="text-4xl mb-3">🎯</Text>
                  <Text className="text-muted-foreground text-center">
                    Choose your mood above and I'll show you relevant feeling
                    words! 💫
                  </Text>
                </View>
              ) : (
                <>
                  <View className="flex-row gap-2 flex-wrap">
                    {availableTags.map((tag) => (
                      <TagItem
                        key={tag}
                        tag={tag}
                        isSelected={selectedTags.includes(tag)}
                        onPress={() => handleTagToggle(tag)}
                      />
                    ))}
                  </View>
                  {selectedTags.length > 0 && (
                    <LinearGradient
                      colors={getGradientColors(
                        "tagsSelected",
                        isDarkColorScheme,
                      )}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="mt-3 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800"
                    >
                      <Text className="text-indigo-800 dark:text-indigo-200 text-sm font-medium">
                        🎯 Your vibes: {selectedTags.join(", ")} ✨
                      </Text>
                    </LinearGradient>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="w-full shadow-sm border border-teal-200 dark:border-teal-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/50 items-center justify-center">
                  <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold leading-6">
                    Your thoughts 💭
                  </Text>
                </View>
              </CardTitle>
              <Text className="text-sm text-muted-foreground">
                Share what's on your mind - every thought matters! (Optional)
              </Text>
            </CardHeader>
            <CardContent className="pt-0">
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="What's going through your mind right now? Your thoughts are valuable! ✨"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 text-foreground bg-white dark:bg-gray-900/50 min-h-[80px] focus:border-teal-400 dark:focus:border-teal-500"
                style={{ textAlignVertical: "top" }}
              />
              {notes.trim().length > 0 && (
                <LinearGradient
                  colors={getGradientColors("notesInput", isDarkColorScheme)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="mt-3 p-3 rounded-lg border border-teal-200 dark:border-teal-800"
                >
                  <Text className="text-teal-800 dark:text-teal-200 text-sm font-medium">
                    ✨ Thank you for sharing! Your self-reflection is wonderful.
                  </Text>
                </LinearGradient>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={handleSave}
              disabled={selectedMood === null || isLoading}
              className="w-full shadow-lg rounded-xl overflow-hidden"
              style={{
                opacity: selectedMood === null || isLoading ? 0.5 : 1,
                shadowColor: "#3b82f6",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: selectedMood === null || isLoading ? 0 : 0.3,
                shadowRadius: 8,
              }}
            >
              <LinearGradient
                colors={getGradientColors("quickAdd", isDarkColorScheme)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="w-full items-center justify-center rounded-xl"
                style={{
                  minHeight: 60,
                  paddingHorizontal: 24,
                  paddingVertical: 18,
                }}
              >
                <View className="flex-row items-center justify-center gap-3">
                  <Star className="w-6 h-6 text-white" />
                  <Text className="font-bold text-white text-lg text-center">
                    {isLoading
                      ? "✨ Saving Your Journey..."
                      : "🌟 Complete Check-in"}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <Button
              variant="outline"
              onPress={() => setShowForm(false)}
              className="w-full border-2 border-gray-300 dark:border-gray-600 min-h-[50px] items-center justify-center"
            >
              <Text className="text-lg text-center">Maybe Later 💙</Text>
            </Button>
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
                <Text className="text-center text-blue-800 dark:text-blue-200 font-medium">
                  🎉 You're amazing for taking care of your mental health!
                </Text>
                <Text className="text-center text-blue-600 dark:text-blue-300 text-sm mt-1">
                  Small steps lead to big victories! 🏆
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
