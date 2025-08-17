import * as React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "../../lib/useColorScheme";
import { useDatabase, useHabits, useDashboardData } from "../../lib/hooks/useDatabase";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Text } from "../../components/ui/text";
import { H1, H2, H3, P, Small } from "../../components/ui/typography";
import { Target } from "../../lib/icons/Target";
import { Smile } from "../../lib/icons/Smile";
import { Activity } from "../../lib/icons/Activity";
import { Star } from "../../lib/icons/Star";
import { Flame } from "../../lib/icons/Flame";
import { BarChart3 } from "../../lib/icons/BarChart3";
import { Zap } from "../../lib/icons/Zap";
import { BookOpen } from "../../lib/icons/BookOpen";
import { MoonStar } from "../../lib/icons/MoonStar";
import type { HealthyHabit, HabitCompletion } from "../../lib/database/types";

// Predefined difficulty levels with encouraging messaging
const difficultyLevels = [
  { value: 1, label: "Super Easy", emoji: "😊", color: "bg-green-100 dark:bg-green-950/30" },
  { value: 2, label: "Easy", emoji: "🙂", color: "bg-blue-100 dark:bg-blue-950/30" },
  { value: 3, label: "Moderate", emoji: "😐", color: "bg-yellow-100 dark:bg-yellow-950/30" },
  { value: 4, label: "Challenging", emoji: "😤", color: "bg-orange-100 dark:bg-orange-950/30" },
  { value: 5, label: "Very Hard", emoji: "😅", color: "bg-red-100 dark:bg-red-950/30" },
];

// Category icons - using more appropriate and diverse icons
const categoryIcons = {
  physical: Activity,      // Physical activities - dumbbell/exercise icon
  mental: BookOpen,        // Mental health - book/learning icon  
  social: Smile,          // Social activities - smile/people icon
  spiritual: MoonStar,    // Spiritual practices - moon/star for meditation/reflection
  productivity: Zap,      // Productivity - lightning bolt for energy/efficiency
};

// Category colors - more distinct and thematically appropriate
const categoryColors = {
  physical: "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-700",     // Green for health/fitness
  mental: "bg-indigo-50 border-indigo-300 dark:bg-indigo-950/30 dark:border-indigo-700",          // Indigo for mind/learning
  social: "bg-rose-50 border-rose-300 dark:bg-rose-950/30 dark:border-rose-700",                  // Rose for relationships/love
  spiritual: "bg-violet-50 border-violet-300 dark:bg-violet-950/30 dark:border-violet-700",       // Violet for spirituality/meditation
  productivity: "bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700",        // Amber for energy/productivity
};

// Category icon colors - matching the category themes
const categoryIconColors = {
  physical: "bg-emerald-500",
  mental: "bg-indigo-500", 
  social: "bg-rose-500",
  spiritual: "bg-violet-500",
  productivity: "bg-amber-500",
};

interface HabitCompletionFormProps {
  habit: HealthyHabit;
  existingCompletion: HabitCompletion | null;
  onSave: (completion: Omit<HabitCompletion, "id" | "createdAt">) => void;
  onCancel: () => void;
}

const HabitCompletionForm = React.memo(({ habit, existingCompletion, onSave, onCancel }: HabitCompletionFormProps) => {
  const [currentValue, setCurrentValue] = React.useState(existingCompletion?.currentValue ?? 0);
  const [inputValue, setInputValue] = React.useState((existingCompletion?.currentValue ?? 0).toString());
  const [difficulty, setDifficulty] = React.useState(existingCompletion?.difficulty ?? 3);
  const [notes, setNotes] = React.useState(existingCompletion?.notes ?? "");

  // Calculate completion status based on tracking type
  const isCompleted = React.useMemo(() => {
    if (habit.trackingType === "completion") {
      return currentValue > 0;
    }
    return habit.targetValue ? currentValue >= habit.targetValue : currentValue > 0;
  }, [currentValue, habit.trackingType, habit.targetValue]);

  // Get progress percentage
  const progressPercentage = React.useMemo(() => {
    if (habit.trackingType === "completion") {
      return isCompleted ? 100 : 0;
    }
    if (!habit.targetValue) return 0;
    return Math.min((currentValue / habit.targetValue) * 100, 100);
  }, [currentValue, habit.targetValue, habit.trackingType, isCompleted]);

  const handleSave = React.useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    onSave({
      habitId: habit.id,
      date: today,
      completed: isCompleted,
      currentValue,
      difficulty,
      notes: notes.trim() || null,
      updatedAt: new Date().toISOString(),
    });
  }, [habit.id, isCompleted, currentValue, difficulty, notes, onSave]);

  // Handle manual text input
  const handleInputChange = React.useCallback((text: string) => {
    setInputValue(text);
    const numValue = parseInt(text, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setCurrentValue(numValue);
    }
  }, []);

  // Handle button increments/decrements and sync with input
  const updateValue = React.useCallback((newValue: number) => {
    const finalValue = Math.max(0, newValue);
    setCurrentValue(finalValue);
    setInputValue(finalValue.toString());
  }, []);

  // Sync input value when currentValue changes from buttons
  React.useEffect(() => {
    setInputValue(currentValue.toString());
  }, [currentValue]);

  const getValueDisplayText = () => {
    if (habit.trackingType === "completion") {
      return isCompleted ? "Completed! 🎉" : "Mark as Complete";
    }
    return `${currentValue}${habit.unit ? ` ${habit.unit}` : ""} ${habit.targetValue ? `/ ${habit.targetValue}` : ""}`;
  };

  const getQuickIncrementOptions = () => {
    // Special handling for steps - much larger increments needed
    if (habit.unit === "steps" || habit.name.toLowerCase().includes("steps")) {
      return [500, 1000, 2500, 5000]; // Much bigger increments for steps
    }
    
    // Special handling for water/glasses - medium increments
    if (habit.unit === "glasses" || habit.name.toLowerCase().includes("water")) {
      return [1, 2, 4, 8]; // Good for water intake
    }
    
    // Special handling for pages - medium increments  
    if (habit.unit === "pages" || habit.name.toLowerCase().includes("read")) {
      return [5, 10, 20, 50]; // Good for reading pages
    }
    
    // Special handling for reps/exercises - medium increments
    if (habit.unit === "reps" || habit.name.toLowerCase().includes("exercise")) {
      return [5, 10, 25, 50]; // Good for exercise reps
    }

    // Default handling by tracking type
    switch (habit.trackingType) {
      case "duration":
        return [5, 10, 15, 30, 60]; // minutes
      case "count":
        // Smart defaults based on target value
        if (habit.targetValue && habit.targetValue >= 1000) {
          return [50, 100, 250, 500]; // For large counts
        } else if (habit.targetValue && habit.targetValue >= 100) {
          return [5, 10, 25, 50]; // For medium counts
        } else {
          return [1, 2, 5, 10]; // For small counts
        }
      case "quantity":
        return [1, 5, 10, 25]; // units
      default:
        return [];
    }
  };

  const CategoryIcon = categoryIcons[habit.category];

  return (
    <Card className="w-full shadow-lg border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-900">
      <CardHeader className="pb-4">
        <CardTitle className="flex-row items-center gap-3">
          <CategoryIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <Text className="text-xl font-bold text-foreground">{habit.name}</Text>
        </CardTitle>
        {habit.description && (
          <Text className="text-sm text-muted-foreground">{habit.description}</Text>
        )}
      </CardHeader>
      <CardContent className="pt-0 gap-4 pb-6">
        {/* Progress Display */}
        <View className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-base font-semibold text-foreground">
              {getValueDisplayText()}
            </Text>
            {habit.trackingType !== "completion" && (
              <Text className="text-sm text-muted-foreground">
                {progressPercentage.toFixed(0)}%
              </Text>
            )}
          </View>
          
          {habit.trackingType !== "completion" && (
            <View className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <View 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </View>
          )}
        </View>

        {/* Value Input */}
        {habit.trackingType === "completion" ? (
          <TouchableOpacity
            onPress={() => updateValue(currentValue > 0 ? 0 : 1)}
            className={`p-4 rounded-xl border-2 flex-row items-center justify-between ${
              currentValue > 0
                ? "bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-700" 
                : "bg-gray-50 border-gray-300 dark:bg-gray-950/30 dark:border-gray-700"
            }`}
          >
            <View className="flex-row items-center gap-3">
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                currentValue > 0 ? "bg-green-600 border-green-600" : "border-gray-400"
              }`}>
                {currentValue > 0 && (
                  <Text className="text-white font-bold text-xs">✓</Text>
                )}
              </View>
              <Text className={`text-lg font-semibold ${currentValue > 0 ? "text-green-700 dark:text-green-300" : "text-gray-600 dark:text-gray-400"}`}>
                {currentValue > 0 ? "Completed! 🎉" : "Mark as Complete"}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View>
            <Text className="text-base font-semibold text-foreground mb-3">
              {habit.trackingType === "duration" ? "Time spent" : 
               habit.trackingType === "count" ? "Count" : "Amount"} 
              {habit.unit && ` (${habit.unit})`}
            </Text>
            
            {/* Quick increment buttons */}
            <View className="flex-row flex-wrap gap-2 mb-3">
              {getQuickIncrementOptions().map((increment) => (
                <TouchableOpacity
                  key={increment}
                  onPress={() => updateValue(currentValue + increment)}
                  className="px-4 py-2 rounded-full border border-indigo-300 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-600"
                >
                  <Text className="text-indigo-700 dark:text-indigo-300 font-medium">
                    +{increment}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Manual input */}
            <View className="flex-row items-center gap-2">
              {/* Large decrement for big numbers */}
              {(habit.unit === "steps" || habit.targetValue && habit.targetValue >= 1000) && (
                <TouchableOpacity
                  onPress={() => updateValue(currentValue - 100)}
                  className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center border border-red-300 dark:border-red-700"
                  disabled={currentValue <= 0}
                >
                  <Text className="text-sm font-bold text-red-600 dark:text-red-400">-100</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                onPress={() => updateValue(currentValue - 1)}
                className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center"
                disabled={currentValue <= 0}
              >
                <Text className="text-lg font-bold text-gray-600 dark:text-gray-400">-</Text>
              </TouchableOpacity>
              
              <Input
                value={inputValue}
                onChangeText={handleInputChange}
                keyboardType="numeric"
                className="flex-1 text-center text-lg font-semibold"
                placeholder="0"
              />
              
              <TouchableOpacity
                onPress={() => updateValue(currentValue + 1)}
                className="w-10 h-10 rounded-full bg-indigo-600 items-center justify-center"
              >
                <Text className="text-lg font-bold text-white">+</Text>
              </TouchableOpacity>
              
              {/* Large increment for big numbers */}
              {(habit.unit === "steps" || habit.targetValue && habit.targetValue >= 1000) && (
                <TouchableOpacity
                  onPress={() => updateValue(currentValue + 100)}
                  className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center border border-green-300 dark:border-green-700"
                >
                  <Text className="text-sm font-bold text-green-600 dark:text-green-400">+100</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Difficulty Selection - only show if there's progress */}
        {currentValue > 0 && (
          <View>
            <Text className="text-base font-semibold text-foreground mb-3">
              How did it feel? 💪
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {difficultyLevels.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  onPress={() => setDifficulty(level.value)}
                  className={`px-4 py-2 rounded-full border-2 flex-row items-center gap-2 ${
                    difficulty === level.value
                      ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-600"
                      : "border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-600"
                  }`}
                >
                  <Text className="text-lg">{level.emoji}</Text>
                  <Text className={`text-sm font-medium ${
                    difficulty === level.value ? "text-indigo-700 dark:text-indigo-300" : "text-gray-600 dark:text-gray-400"
                  }`}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Notes - only show if there's progress */}
        {currentValue > 0 && (
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-3">
              How was your experience? ✨ (Optional)
            </Text>
            <Input
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about your experience..."
              className="text-base min-h-[100px] mb-2"
              multiline={true}
              textAlignVertical="top"
              numberOfLines={4}
            />
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <TouchableOpacity
            onPress={handleSave}
            className="flex-1 bg-green-500 dark:bg-green-600 p-4 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Text className="text-white font-bold text-xs">✓</Text>
            <Text className="text-white font-semibold text-lg">
              {existingCompletion ? "Update" : "Save"} Log
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onCancel}
            className="px-6 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 flex-row items-center justify-center"
          >
            <Text className="text-gray-600 dark:text-gray-400 font-medium">Cancel</Text>
          </TouchableOpacity>
        </View>
      </CardContent>
    </Card>
  );
});

export default function HabitsLogScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const { isInitialized } = useDatabase();
  const {
    habits,
    loading,
    loadAllHabits,
    completeHabit,
    getTodayCompletions,
    getCompletionForHabitAndDate,
    initializeDefaultHabits,
  } = useHabits();
  const { loadDashboardData } = useDashboardData();

  // State management
  const [todayCompletions, setTodayCompletions] = React.useState<HabitCompletion[]>([]);
  const [selectedHabit, setSelectedHabit] = React.useState<HealthyHabit | null>(null);
  const [existingCompletion, setExistingCompletion] = React.useState<HabitCompletion | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const today = new Date().toISOString().split("T")[0];

  // Helper function for theme-aware gradients
  const getGradientColors = React.useCallback(
    (type: "header" | "success" | "category" | "stats" | "completion", isDark: boolean = false) => {
      const gradients = {
        header: isDark ? ["#166534", "#059669"] as const : ["#10b981", "#34d399"] as const, // Green theme instead of blue/purple
        success: isDark ? ["#166534", "#1e40af"] as const : ["#10b981", "#3b82f6"] as const,
        category: isDark ? ["#374151", "#4b5563"] as const : ["#f3f4f6", "#e5e7eb"] as const,
        stats: isDark ? ["#581c87", "#be185d"] as const : ["#faf5ff", "#fdf2f8"] as const,
        completion: isDark ? ["#166534", "#0d9488"] as const : ["#ecfdf5", "#f0fdfa"] as const,
      };
      return gradients[type];
    },
    [],
  );

  // Load data
  const loadData = React.useCallback(async () => {
    if (!isInitialized) return;

    try {
      await loadAllHabits();
      const completions = await getTodayCompletions(today);
      setTodayCompletions(completions);
    } catch (error) {
      console.error("Error loading habits data:", error);
    }
  }, [isInitialized, today]); // Removed loadAllHabits and getTodayCompletions from deps

  // Initialize default habits on first load
  React.useEffect(() => {
    if (isInitialized) {
      const initializeData = async () => {
        try {
          await initializeDefaultHabits();
          await loadAllHabits();
          const completions = await getTodayCompletions(today);
          setTodayCompletions(completions);
        } catch (error) {
          console.error("Error initializing habits:", error);
        }
      };
      initializeData();
    }
  }, [isInitialized]); // Removed other dependencies to prevent loops

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (isInitialized) {
        const refreshData = async () => {
          try {
            await loadAllHabits();
            const completions = await getTodayCompletions(today);
            setTodayCompletions(completions);
          } catch (error) {
            console.error("Error refreshing habits data:", error);
          }
        };
        refreshData();
      }
    }, [isInitialized, today]) // Removed function dependencies
  );

  // Handle habit selection for logging
  const handleHabitPress = React.useCallback(async (habit: HealthyHabit) => {
    try {
      const existing = await getCompletionForHabitAndDate(habit.id, today);
      setExistingCompletion(existing);
      setSelectedHabit(habit);
    } catch (error) {
      console.error("Error loading existing completion:", error);
    }
  }, [getCompletionForHabitAndDate, today]);

  // Handle habit completion save
  const handleCompletionSave = React.useCallback(async (completionData: Omit<HabitCompletion, "id" | "createdAt">) => {
    setIsLoading(true);
    try {
      await completeHabit(completionData);
      
      // Show success message
      const encouragingMessages = [
        "🌟 Amazing! You're building incredible habits!",
        "🎉 Fantastic! Your consistency is inspiring!",
        "✨ Well done! Every step counts toward your goals!",
        "🚀 Excellent! You're creating positive change!",
        "💪 Great job! Your dedication is remarkable!",
        "🌈 Wonderful! You're investing in your best self!",
        "🏆 Outstanding! Your commitment is paying off!",
        "🌸 Beautiful! Self-care looks amazing on you!",
      ];

      const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
      setSuccessMessage(randomMessage);
      setShowSuccessMessage(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccessMessage(false), 3000);

      // Reset form and reload data
      setSelectedHabit(null);
      setExistingCompletion(null);
      
      // Refresh data after completion
      await loadAllHabits();
      const completions = await getTodayCompletions(today);
      setTodayCompletions(completions);
  // Refresh dashboard (wellness score, recent logs, streaks)
  loadDashboardData();
    } catch (error) {
      console.error("Error saving habit completion:", error);
    } finally {
      setIsLoading(false);
    }
  }, [completeHabit, today]); // Removed loadData dependency

  // Calculate today's stats (memoized to prevent unnecessary recalculations)
  const todayStats = React.useMemo(() => {
    const completedCount = todayCompletions.filter(c => c.completed).length;
    const totalHabits = habits.length;
    const completionRate = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
    
    return {
      completed: completedCount,
      total: totalHabits,
      rate: completionRate,
    };
  }, [todayCompletions, habits.length]); // Only depend on length to avoid reference changes

  // Get motivational message based on progress
  const getMotivationalMessage = React.useCallback(() => {
    const { rate } = todayStats;
    
    if (rate === 100) {
      return "🏆 Perfect day! You've completed all your habits!";
    } else if (rate >= 80) {
      return "🌟 Amazing progress! You're almost there!";
    } else if (rate >= 60) {
      return "💪 Great work! Keep the momentum going!";
    } else if (rate >= 40) {
      return "🚀 Good start! Every habit counts!";
    } else if (rate > 0) {
      return "✨ You've started! That's the hardest part!";
    } else {
      return "🌱 Ready to build some amazing habits today?";
    }
  }, [todayStats]);

  if (!isInitialized) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-background">
        <Target className="w-12 h-12 text-blue-500 mb-4" />
        <Text className="text-lg font-semibold text-foreground">Getting ready...</Text>
        <Text className="text-muted-foreground">Setting up your habit tracker</Text>
      </SafeAreaView>
    );
  }

  if (selectedHabit) {
    return (
      <View className="flex-1 bg-background">
        {/* Header for Habit Form */}
        <LinearGradient
          colors={getGradientColors("header", isDarkColorScheme)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="py-4 pb-6 relative z-50"
          style={{ paddingTop: 48 }}
        >
          <View className="px-6 pt-2">
            <View className="flex-row items-center gap-3 mb-3 mt-8">
              <Target className="w-6 h-6 text-white" />
              <Text className="text-xl font-bold text-white">Log Your Habit</Text>
            </View>
            <Text className="text-white/90 dark:text-white/80 text-base">
              Track your progress and celebrate your commitment! 🎯
            </Text>
          </View>
        </LinearGradient>
        
        <KeyboardAvoidingView 
          className="flex-1" 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView 
            className="flex-1 p-6 -mt-2"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
          >
            <HabitCompletionForm
              habit={selectedHabit}
              existingCompletion={existingCompletion}
              onSave={handleCompletionSave}
              onCancel={() => {
                setSelectedHabit(null);
                setExistingCompletion(null);
              }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
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
                <Text className="text-green-800 dark:text-green-200 font-semibold text-center">
                  {successMessage}
                </Text>
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
              <Target className="w-6 h-6 text-white" />
              <Text className="text-2xl font-bold text-white">Healthy Habits</Text>
            </View>
            <Text className="text-white/90 dark:text-white/80 text-lg mb-2">
              Build your best self, one habit at a time! 🌟
            </Text>
            <Text className="text-white/70 dark:text-white/60 text-sm">
              {new Date().toLocaleDateString()} • {getMotivationalMessage()}
            </Text>
          </View>
        </LinearGradient>

        <View className="gap-6 p-6 -mt-4">
          {/* Today's Progress */}
          <Card className="w-full shadow-sm border-purple-200 dark:border-purple-800">
            <LinearGradient
              colors={getGradientColors("stats", isDarkColorScheme)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-lg"
            >
              <CardContent className="pt-4">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <Text className="text-xl font-bold text-purple-900 dark:text-purple-100">
                      Today's Progress
                    </Text>
                  </View>
                  <View className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
                    <Text className="text-purple-600 dark:text-purple-400 font-bold">
                      {todayStats.rate}%
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row justify-between items-center">
                  <View className="items-center">
                    <Text className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                      {todayStats.completed}
                    </Text>
                    <Text className="text-purple-700 dark:text-purple-300 text-sm">
                      Completed
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl text-purple-700 dark:text-purple-300">/</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                      {todayStats.total}
                    </Text>
                    <Text className="text-purple-700 dark:text-purple-300 text-sm">
                      Total Habits
                    </Text>
                  </View>
                </View>

                {todayStats.rate === 100 && (
                  <View className="mt-4 flex-row items-center justify-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <Text className="text-purple-900 dark:text-purple-100 font-semibold">
                      Perfect Day Achievement! 🏆
                    </Text>
                  </View>
                )}
              </CardContent>
            </LinearGradient>
          </Card>

          {/* Habits List */}
          <Card className="w-full shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex-row items-center gap-3">
                <Flame className="w-6 h-6 text-orange-500" />
                <Text className="text-xl font-bold text-foreground">Your Habits</Text>
              </CardTitle>
              <Text className="text-sm text-muted-foreground">
                Tap any habit to log your progress
              </Text>
            </CardHeader>
            <CardContent className="pt-0 gap-3">
              {loading ? (
                <View className="items-center py-8">
                  <Text className="text-muted-foreground">Loading your habits...</Text>
                </View>
              ) : habits.length === 0 ? (
                <View className="items-center py-8">
                  <Target className="w-12 h-12 text-muted-foreground mb-2" />
                  <Text className="text-muted-foreground text-center">
                    No habits found. Default habits should load automatically.
                  </Text>
                </View>
              ) : (
                habits.map((habit) => {
                  const completion = todayCompletions.find(c => c.habitId === habit.id);
                  const isCompleted = completion?.completed ?? false;
                  const currentValue = completion?.currentValue ?? 0;
                  const CategoryIcon = categoryIcons[habit.category];
                  
                  // Calculate progress percentage for non-completion habits
                  let progressPercentage = 0;
                  if (habit.trackingType === "completion") {
                    progressPercentage = isCompleted ? 100 : 0;
                  } else if (!habit.targetValue) {
                    progressPercentage = currentValue > 0 ? 50 : 0; // Show some progress if no target
                  } else {
                    progressPercentage = Math.min((currentValue / habit.targetValue) * 100, 100);
                  }
                  
                  return (
                    <TouchableOpacity
                      key={habit.id}
                      onPress={() => handleHabitPress(habit)}
                      className={`rounded-xl border-2 ${categoryColors[habit.category]} ${
                        isCompleted ? "opacity-90" : ""
                      } overflow-hidden`}
                    >
                      {/* Progress Bar Background */}
                      {habit.trackingType !== "completion" && progressPercentage > 0 && (
                        <View className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
                          <View 
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </View>
                      )}
                      
                      <View className="p-4">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1 flex-row items-center gap-3">
                            <View className={`p-2 rounded-full ${
                              isCompleted ? "bg-green-500" : categoryIconColors[habit.category]
                            }`}>
                              {isCompleted ? (
                                <Text className="text-white font-bold text-xs">✓</Text>
                              ) : (
                                <CategoryIcon className="w-5 h-5 text-white" />
                              )}
                            </View>
                            <View className="flex-1">
                              <Text className={`font-semibold text-base ${
                                isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                              }`}>
                                {habit.name}
                              </Text>
                              {habit.description && (
                                <Text className="text-sm text-muted-foreground">
                                  {habit.description}
                                </Text>
                              )}
                              
                              {/* Progress Text for partial completion */}
                              {currentValue > 0 && !isCompleted && habit.trackingType !== "completion" && (
                                <View className="flex-row items-center gap-2 mt-1">
                                  <Text className="text-sm text-blue-600 dark:text-blue-400">📊</Text>
                                  <Text className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                    {currentValue}
                                    {habit.unit ? ` ${habit.unit}` : ""}
                                    {habit.targetValue ? ` / ${habit.targetValue}` : ""}
                                    {` (${progressPercentage.toFixed(0)}%)`}
                                  </Text>
                                </View>
                              )}
                              
                              {completion && isCompleted && (
                                <View className="flex-row items-center gap-2 mt-1">
                                  <Text className="text-sm text-green-600">⏰</Text>
                                  <Text className="text-sm text-green-600">
                                    {habit.trackingType === "completion" 
                                      ? "Completed" 
                                      : `${completion.currentValue}${habit.unit ? ` ${habit.unit}` : ""}`
                                    }
                                  </Text>
                                  {completion.difficulty && (
                                    <>
                                      <Text className="text-sm text-green-600">•</Text>
                                      <Text className="text-sm text-green-600">
                                        {difficultyLevels.find(d => d.value === completion.difficulty)?.emoji} 
                                        {difficultyLevels.find(d => d.value === completion.difficulty)?.label}
                                      </Text>
                                    </>
                                  )}
                                </View>
                              )}
                            </View>
                          </View>
                          
                          {isCompleted ? (
                            <View className="flex-row items-center gap-2">
                              <Star className="w-5 h-5 text-yellow-500" />
                              <Text className="text-green-600 font-semibold">Done!</Text>
                            </View>
                          ) : currentValue > 0 && habit.trackingType !== "completion" ? (
                            <View className="items-center">
                              <View className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-300 dark:border-blue-600">
                                <Text className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                  {progressPercentage.toFixed(0)}%
                                </Text>
                              </View>
                              <Text className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                In Progress
                              </Text>
                            </View>
                          ) : (
                            <View className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600">
                              <Text className="text-xs font-medium text-muted-foreground">
                                Tap to log
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Encouragement Card */}
          <Card className="w-full shadow-sm border-green-200 dark:border-green-800">
            <LinearGradient
              colors={getGradientColors("completion", isDarkColorScheme)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-lg"
            >
              <CardContent className="pt-4">
                <View className="flex-row items-center gap-3 mb-3">
                  <Smile className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <Text className="text-lg font-bold text-green-900 dark:text-green-100">
                    You're Doing Amazing! 
                  </Text>
                </View>
                <Text className="text-green-800 dark:text-green-200 text-sm leading-relaxed">
                  Every habit you build is an investment in your future self. Small, consistent actions create extraordinary results. Keep going! 🌟
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
