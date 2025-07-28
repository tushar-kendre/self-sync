import * as React from 'react';
import { View, ScrollView, Pressable, TextInput, FlatList } from 'react-native';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Text } from '~/components/ui/text';
import type { MoodLog } from '~/lib/database/types';
import { Smile } from '~/lib/icons/Smile';
import { BarChart3 } from '~/lib/icons/BarChart3';
import { Activity } from '~/lib/icons/Activity';
import { AlertTriangle } from '~/lib/icons/AlertTriangle';
import { FileText } from '~/lib/icons/FileText';
import { Star } from '~/lib/icons/Star';
import { Zap } from '~/lib/icons/Zap';
import { router } from 'expo-router';
import { useDatabase, useMoodLogs } from '~/lib/hooks/useDatabase';
import { ClipboardList } from '~/lib/icons/ClipboardList';

const moodOptions = [
  { value: 1, emoji: '😢', label: 'Very Bad', color: 'bg-red-100 border-red-300 dark:bg-red-950/30 dark:border-red-800' },
  { value: 2, emoji: '😕', label: 'Bad', color: 'bg-orange-100 border-orange-300 dark:bg-orange-950/30 dark:border-orange-800' },
  { value: 3, emoji: '😐', label: 'Okay', color: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-800' },
  { value: 4, emoji: '😊', label: 'Good', color: 'bg-green-100 border-green-300 dark:bg-green-950/30 dark:border-green-800' },
  { value: 5, emoji: '😄', label: 'Great', color: 'bg-blue-100 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800' },
];

const stressLevelOptions = [
  { value: 1, label: 'Very Low', color: 'bg-green-50 dark:bg-green-950/20' },
  { value: 2, label: 'Low', color: 'bg-blue-50 dark:bg-blue-950/20' },
  { value: 3, label: 'Medium', color: 'bg-yellow-50 dark:bg-yellow-950/20' },
  { value: 4, label: 'High', color: 'bg-orange-50 dark:bg-orange-950/20' },
  { value: 5, label: 'Very High', color: 'bg-red-50 dark:bg-red-950/20' },
];

const energyLevelOptions = [
  { value: 1, label: 'Exhausted', color: 'bg-red-50 dark:bg-red-950/20' },
  { value: 2, label: 'Low', color: 'bg-orange-50 dark:bg-orange-950/20' },
  { value: 3, label: 'Moderate', color: 'bg-yellow-50 dark:bg-yellow-950/20' },
  { value: 4, label: 'High', color: 'bg-green-50 dark:bg-green-950/20' },
  { value: 5, label: 'Energized', color: 'bg-blue-50 dark:bg-blue-950/20' },
];

const contextOptions = [
  'Work', 'Home', 'Social', 'Exercise', 'Commute', 'Sleep', 'Meal', 'Break', 'Outdoors', 'Other'
];

const getMoodBasedTags = (moodLevel: number | null) => {
  if (moodLevel === null) return [];
  
  if (moodLevel <= 2) {
    // Difficult/challenging mood tags
    return [
      'Overwhelmed', 'Anxious', 'Sad', 'Frustrated', 'Tired', 'Stressed', 
      'Lonely', 'Worried', 'Disappointed', 'Irritated', 'Confused', 'Drained'
    ];
  } else if (moodLevel === 3) {
    // Neutral/balanced mood tags
    return [
      'Calm', 'Focused', 'Peaceful', 'Steady', 'Balanced', 'Thoughtful',
      'Reflective', 'Content', 'Mindful', 'Present', 'Grounded', 'Stable'
    ];
  } else {
    // Positive/uplifting mood tags
    return [
      'Happy', 'Grateful', 'Energized', 'Motivated', 'Excited', 'Confident',
      'Joyful', 'Optimistic', 'Inspired', 'Creative', 'Accomplished', 'Loved'
    ];
  }
};

export default function MoodCheckScreen() {
  const { isInitialized } = useDatabase();
  const { createMoodLog, getTodayMoodLogs, getMoodStreak, loading: moodLoading } = useMoodLogs();
  
  // Form state
  const [selectedMood, setSelectedMood] = React.useState<number | null>(null);
  const [selectedStress, setSelectedStress] = React.useState<number | null>(null);
  const [selectedEnergy, setSelectedEnergy] = React.useState<number | null>(null);
  const [selectedContext, setSelectedContext] = React.useState<string>('');
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [notes, setNotes] = React.useState<string>('');
  
  // App state
  const [isLoading, setIsLoading] = React.useState(false);
  const [todayLogs, setTodayLogs] = React.useState<MoodLog[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const [moodStreak, setMoodStreak] = React.useState<number>(0);

  // Load today's logs when component mounts or database is ready
  React.useEffect(() => {
    if (isInitialized) {
      loadTodayLogs();
      loadMoodStreak();
    }
  }, [isInitialized]);

  const loadTodayLogs = async () => {
    try {
      const logs = await getTodayMoodLogs();
      setTodayLogs(logs);
    } catch (error) {
      console.error('Error loading today\'s mood logs:', error);
    }
  };

  const loadMoodStreak = async () => {
    try {
      const streak = await getMoodStreak();
      setMoodStreak(streak);
    } catch (error) {
      console.error('Error loading mood streak:', error);
    }
  };

  const handleSave = async () => {
    if (selectedMood === null) {
      return; // Require mood selection
    }

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
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
        "🌸 Beautiful! Self-care looks good on you!"
      ];
      
      const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
      setSuccessMessage(randomMessage);
      setShowSuccessMessage(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccessMessage(false), 3000);

      // Reset form
      setSelectedMood(null);
      setSelectedStress(null);
      setSelectedEnergy(null);
      setSelectedContext('');
      setSelectedTags([]);
      setNotes('');
      setShowForm(false);

      // Reload today's logs and mood streak
      await loadTodayLogs();
      await loadMoodStreak();
    } catch (error) {
      console.error('Error saving mood log:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoodSelection = (moodValue: number) => {
    setSelectedMood(moodValue);
    // Clear selected tags when mood changes since available tags will be different
    setSelectedTags([]);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const renderMoodLogItem = ({ item }: { item: MoodLog }) => {
    const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const moodOption = moodOptions.find(m => m.value === item.mood);
    
    return (
      <Card className="mb-3 border-l-4 border-l-green-400 dark:border-l-green-500">
        <CardContent className="pt-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl">{moodOption?.emoji}</Text>
              <View>
                <Text className="font-semibold text-foreground">{moodOption?.label}</Text>
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
              <Text className="text-sm text-foreground">Energy: {item.energy}/5</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <Text className="text-sm text-foreground">Stress: {item.stress}/5</Text>
            </View>
          </View>

          {item.context && (
            <Text className="text-sm text-muted-foreground mb-1">📍 {item.context}</Text>
          )}

          {item.tags && item.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-1 mb-2">
              {item.tags.map((tag, index) => (
                <View key={index} className="bg-blue-100 dark:bg-blue-950/30 px-2 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                  <Text className="text-xs text-blue-700 dark:text-blue-300">{tag}</Text>
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
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMotivationalMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Good morning! ☀️ How are you starting your day?";
    } else if (hour < 17) {
      return "Good afternoon! 🌤️ Take a moment to check in with yourself";
    } else {
      return "Good evening! 🌙 How has your day been treating you?";
    }
  };

  const getStreakMessage = () => {
    if (moodStreak === 0) {
      return "Start your mood tracking journey! 🌱";
    } else if (moodStreak === 1) {
      return "Day 1 complete! You're building a healthy habit! 🚀";
    } else if (moodStreak === 2) {
      return "2 days strong! Momentum is building! �";
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
  };

  if (!showForm) {
    // Show loading state while database is initializing
    if (!isInitialized) {
      return (
        <View className="flex-1 justify-center items-center bg-background">
          <Smile className="w-12 h-12 text-blue-500 mb-4" />
          <Text className="text-lg font-semibold text-foreground">Getting ready...</Text>
          <Text className="text-muted-foreground">Setting up your mood tracker</Text>
        </View>
      );
    }

    return (
      <ScrollView className="flex-1 bg-background">
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
        <View className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-900 dark:to-purple-900 px-6 py-8 pb-12">
          <View className="flex-row items-center gap-3 mb-4">
            <Smile className="w-6 h-6 text-white" />
            <Text className="text-2xl font-bold text-white">Mood Tracking</Text>
          </View>
          <Text className="text-white/90 dark:text-white/80 text-lg mb-2">
            {getMotivationalMessage()}
          </Text>
          <Text className="text-white/70 dark:text-white/60 text-sm">
            {getCurrentTime()} • {new Date().toLocaleDateString()}
          </Text>
        </View>

        <View className="gap-6 p-6 -mt-4">
          {/* Motivational Card */}
          <Card className="w-full shadow-sm bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-4">
              <View className="flex-row items-center gap-3">
                <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
                <Text className="flex-1 text-green-800 dark:text-green-200 font-medium">
                  {getStreakMessage()}
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* Quick Add Button */}
          <Button 
            onPress={() => setShowForm(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 border-0"
          >
            <View className="flex-row items-center gap-2">
              <Smile className="w-5 h-5 text-white" />
              <Text className="font-semibold text-white">✨ Log Current Mood</Text>
            </View>
          </Button>

          {/* Today's Summary */}
          {todayLogs.length > 0 && (
            <Card className="w-full shadow-sm bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex-row items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <Text className="text-yellow-800 dark:text-yellow-200">Today's Amazing Progress! 🎯</Text>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-yellow-700 dark:text-yellow-300">
                    🏆 {todayLogs.length} check-in{todayLogs.length !== 1 ? 's' : ''} completed
                  </Text>
                  <Text className="text-sm text-yellow-700 dark:text-yellow-300">
                    📊 Avg: {(todayLogs.reduce((sum, log) => sum + log.mood, 0) / todayLogs.length).toFixed(1)}/5
                  </Text>
                </View>
                <Text className="text-xs text-yellow-600 dark:text-yellow-400">
                  You're building incredible self-awareness! 🌟
                </Text>
              </CardContent>
            </Card>
          )}

          {/* Today's Logs */}
          <Card className="w-full shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex-row items-center gap-2">
                <FileText className="w-5 h-5" />
                <Text>Your Mood Journey Today 📖</Text>
              </CardTitle>
              <Text className="text-sm text-muted-foreground">
                Every entry is a step towards better mental wellness! 💚
              </Text>
            </CardHeader>
            <CardContent className="pt-0">
              {todayLogs.length === 0 ? (
                <View className="py-8 items-center">
                  <Text className="text-6xl mb-4">🌱</Text>
                  <Text className="text-muted-foreground text-center text-lg font-medium mb-2">
                    Ready to start your wellness journey?
                  </Text>
                  <Text className="text-muted-foreground text-center">
                    Tap "Log Current Mood" to plant the first seed! 🌟
                  </Text>
                </View>
              ) : (
                <View>
                  <View className="flex-row items-center gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <Text className="text-blue-800 dark:text-blue-200 font-medium">
                      You're doing amazing! Keep up the great work! 🚀
                    </Text>
                  </View>
                  <FlatList
                    data={todayLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())}
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
    );
  }
  // Mood Entry Form
  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-gradient-to-r from-green-500 to-blue-500 dark:from-green-900 dark:to-blue-900 px-6 py-8 pb-12">
        <View className="flex-row items-center gap-3 mb-4">
          <Smile className="w-6 h-6 text-white" />
          <Text className="text-2xl font-bold text-white">✨ Share Your Feelings</Text>
        </View>
        <Text className="text-white/90 dark:text-white/80 text-lg mb-2">
          You're taking an amazing step for your wellbeing! 🌟
        </Text>
        <Text className="text-white/70 dark:text-white/60 text-sm">
          {getCurrentTime()} • {new Date().toLocaleDateString()}
        </Text>
      </View>

      <View className="gap-6 p-6 -mt-4">
        {/* Encouragement Card */}
        <Card className="w-full shadow-sm bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-pink-200 dark:border-pink-800">
          <CardContent className="pt-4">
            <View className="flex-row items-center gap-3">
              <Star className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              <Text className="flex-1 text-pink-800 dark:text-pink-200 font-medium">
                Every feeling is valid and important. You're doing great! 💖
              </Text>
            </View>
          </CardContent>
        </Card>
        {/* Mood Selection */}
        <Card className="w-full shadow-sm border-2 border-pink-200 dark:border-pink-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex-row items-center gap-2">
              <Text className="text-lg">How are you feeling? 💝</Text>
              <Text className="text-destructive">*</Text>
            </CardTitle>
            <Text className="text-sm text-muted-foreground">
              Take a moment to connect with your emotions ✨
            </Text>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Compact Mood Selector - Fixed Layout */}
            <View className="flex-row justify-center items-center mb-4">
              <View className="flex-row flex-wrap justify-center gap-3 max-w-full">
                {moodOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => handleMoodSelection(option.value)}
                    className={`items-center justify-center p-3 rounded-2xl border-2 ${
                      selectedMood === option.value 
                        ? 'border-pink-400 bg-pink-50 dark:bg-pink-950/30 shadow-lg' 
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50'
                    }`}
                    style={{ 
                      width: 65,
                      height: 80,
                      marginHorizontal: 2
                    }}
                  >
                    <Text className={`text-2xl mb-1 ${
                      selectedMood === option.value ? 'transform scale-110' : ''
                    }`}>
                      {option.emoji}
                    </Text>
                    <Text className={`text-xs font-medium text-center leading-tight ${
                      selectedMood === option.value 
                        ? 'text-pink-700 dark:text-pink-300' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {option.label}
                    </Text>
                    <Text className={`text-xs ${
                      selectedMood === option.value 
                        ? 'text-pink-600 dark:text-pink-400' 
                        : 'text-gray-500 dark:text-gray-500'
                    }`}>
                      {option.value}/5
                    </Text>
                    {selectedMood === option.value && (
                      <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 items-center justify-center">
                        <Text className="text-white text-xs">✓</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Contextual Response to Mood Selection */}
            {selectedMood && (
              <Card className={`mt-4 border-0 ${
                selectedMood <= 2 
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20' 
                  : selectedMood === 3
                  ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20'
                  : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20'
              }`}>
                <CardContent className="pt-4">
                  <View className="flex-row items-center gap-3">
                    {selectedMood <= 2 ? (
                      <>
                        <View className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 items-center justify-center">
                          <Text className="text-2xl">🤗</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-purple-800 dark:text-purple-200 font-bold text-base">
                            I hear you, and your feelings are completely valid 💜
                          </Text>
                          <Text className="text-purple-600 dark:text-purple-300 text-sm mt-1 leading-relaxed">
                            It takes courage to acknowledge difficult feelings. You're not alone in this journey.
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
                            Every day has its moments. You're doing wonderfully by being mindful.
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
                            Your positive energy is beautiful. Keep shining bright!
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Energy Level */}
        <Card className="w-full shadow-sm border border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 items-center justify-center">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </View>
              <Text className="text-lg">Energy Level ⚡</Text>
            </CardTitle>
            <Text className="text-sm text-muted-foreground">
              How is your energy feeling right now?
            </Text>
          </CardHeader>
          <CardContent className="pt-0">
            <View className="flex-row justify-center">
              <View className="flex-row flex-wrap justify-center gap-2 max-w-full">
                {energyLevelOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setSelectedEnergy(option.value)}
                    className={`items-center justify-center p-3 rounded-xl border-2 ${
                      selectedEnergy === option.value 
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30 shadow-md' 
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50'
                    }`}
                    style={{ 
                      width: 60,
                      height: 65,
                      marginHorizontal: 1
                    }}
                  >
                    <Text className={`text-center font-bold text-xs leading-tight ${
                      selectedEnergy === option.value 
                        ? 'text-blue-700 dark:text-blue-300' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {option.label}
                    </Text>
                    <Text className={`text-center text-xs mt-1 ${
                      selectedEnergy === option.value 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-500 dark:text-gray-500'
                    }`}>
                      {option.value}/5
                    </Text>
                    {selectedEnergy === option.value && (
                      <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 items-center justify-center">
                        <Text className="text-white text-xs">✓</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Stress Level */}
        <Card className="w-full shadow-sm border border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </View>
              <Text className="text-lg">Stress Level 🧘‍♀️</Text>
            </CardTitle>
            <Text className="text-sm text-muted-foreground">
              What's your stress level like today?
            </Text>
          </CardHeader>
          <CardContent className="pt-0">
            <View className="flex-row justify-center">
              <View className="flex-row flex-wrap justify-center gap-2 max-w-full">
                {stressLevelOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setSelectedStress(option.value)}
                    className={`items-center justify-center p-3 rounded-xl border-2 ${
                      selectedStress === option.value 
                        ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/30 shadow-md' 
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50'
                    }`}
                    style={{ 
                      width: 60,
                      height: 65,
                      marginHorizontal: 1
                    }}
                  >
                    <Text className={`text-center font-bold text-xs leading-tight ${
                      selectedStress === option.value 
                        ? 'text-orange-700 dark:text-orange-300' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {option.label}
                    </Text>
                    <Text className={`text-center text-xs mt-1 ${
                      selectedStress === option.value 
                        ? 'text-orange-600 dark:text-orange-400' 
                        : 'text-gray-500 dark:text-gray-500'
                    }`}>
                      {option.value}/5
                    </Text>
                    {selectedStress === option.value && (
                      <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 items-center justify-center">
                        <Text className="text-white text-xs">✓</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Context Selection */}
        <Card className="w-full shadow-sm border border-green-200 dark:border-green-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 items-center justify-center">
                <ClipboardList className="w-4 h-4 text-green-600 dark:text-green-400" />
              </View>
              <Text className="text-lg">What's happening? 🌟</Text>
            </CardTitle>
            <Text className="text-sm text-muted-foreground">
              What are you up to right now? (Optional)
            </Text>
          </CardHeader>
          <CardContent className="pt-0">
            <View className="flex-row flex-wrap gap-2">
              {contextOptions.map((context) => (
                <Pressable
                  key={context}
                  onPress={() => setSelectedContext(selectedContext === context ? '' : context)}
                  className={`flex-row items-center px-4 py-2 rounded-full border-2 ${
                    selectedContext === context
                      ? 'border-green-400 bg-green-50 dark:bg-green-950/30 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50'
                  }`} 
                >
                  <Text className={`text-sm font-medium ${
                    selectedContext === context
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {context}
                  </Text>
                  {selectedContext === context && (
                    <View className="ml-2 w-4 h-4 rounded-full bg-green-500 items-center justify-center">
                      <Text className="text-white text-xs">✓</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Tags Selection */}
        <Card className="w-full shadow-sm border border-indigo-200 dark:border-indigo-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 items-center justify-center">
                <Star className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </View>
              <Text className="text-lg">Feeling vibes 🏷️</Text>
            </CardTitle>
            <Text className="text-sm text-muted-foreground">
              {selectedMood === null 
                ? "Select a mood first to see relevant feeling words ✨" 
                : "Pick words that capture your current energy (Optional)"
              }
            </Text>
          </CardHeader>
          <CardContent className="pt-0">
            {selectedMood === null ? (
              <View className="py-8 items-center">
                <Text className="text-4xl mb-3">🎯</Text>
                <Text className="text-muted-foreground text-center">
                  Choose your mood above and I'll show you relevant feeling words! 💫
                </Text>
              </View>
            ) : (
              <>
                <View className="flex-row gap-2 flex-wrap">
                  {getMoodBasedTags(selectedMood).map((tag) => (
                    <Pressable
                      key={tag}
                      onPress={() => handleTagToggle(tag)}
                      className={`flex-row items-center px-3 py-2 rounded-full border-2 ${
                        selectedTags.includes(tag) 
                          ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 shadow-md' 
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50'
                      }`}
                    >
                      <Text className={`text-sm font-medium ${
                        selectedTags.includes(tag) 
                          ? 'text-indigo-700 dark:text-indigo-300' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {tag}
                      </Text>
                      {selectedTags.includes(tag) && (
                        <View className="ml-2 w-4 h-4 rounded-full bg-indigo-500 items-center justify-center">
                          <Text className="text-white text-xs">✓</Text>
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
                {selectedTags.length > 0 && (
                  <View className="mt-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <Text className="text-indigo-800 dark:text-indigo-200 text-sm font-medium">
                      🎯 Your vibes: {selectedTags.join(', ')} ✨
                    </Text>
                  </View>
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
              <Text className="text-lg">Your thoughts 💭</Text>
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
              style={{ textAlignVertical: 'top' }}
            />
            {notes.trim().length > 0 && (
              <View className="mt-3 p-3 bg-gradient-to-r from-teal-50 to-green-50 dark:from-teal-950/20 dark:to-green-950/20 rounded-lg border border-teal-200 dark:border-teal-800">
                <Text className="text-teal-800 dark:text-teal-200 text-sm font-medium">
                  ✨ Thank you for sharing! Your self-reflection is wonderful.
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <View className="gap-3">
          <Button 
            onPress={handleSave}
            disabled={selectedMood === null || isLoading}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 border-0 py-4"
          >
            <View className="flex-row items-center gap-2">
              <Star className="w-5 h-5 text-white" />
              <Text className="font-semibold text-white text-lg">
                {isLoading ? '✨ Saving Your Journey...' : '🌟 Complete Check-in'}
              </Text>
            </View>
          </Button>
          
          <Button 
            variant="outline"
            onPress={() => setShowForm(false)}
            className="w-full border-2 border-gray-300 dark:border-gray-600"
          >
            <Text className="text-lg">Maybe Later 💙</Text>
          </Button>
        </View>

        {/* Bottom Encouragement */}
        <Card className="w-full shadow-sm bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <Text className="text-center text-blue-800 dark:text-blue-200 font-medium">
              🎉 You're amazing for taking care of your mental health! 
            </Text>
            <Text className="text-center text-blue-600 dark:text-blue-300 text-sm mt-1">
              Small steps lead to big victories! 🏆
            </Text>
          </CardContent>
        </Card>

        {/* Bottom spacing */}
        <View className="h-8" />
      </View>
    </ScrollView>
  );
}
