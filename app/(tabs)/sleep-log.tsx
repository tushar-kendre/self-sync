import React from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useDatabase, useSleepLogs } from '../../lib/hooks/useDatabase';
import { useColorScheme } from '../../lib/useColorScheme';
import { SleepLog } from '../../lib/database/types';
import { Moon } from '../../lib/icons/Moon';
import { MoonStar } from '../../lib/icons/MoonStar';
import { Star } from '../../lib/icons/Star';
import { Sun } from '../../lib/icons/Sun';
import { Zap } from '../../lib/icons/Zap';
import { Activity } from '../../lib/icons/Activity';
import { Shield } from '../../lib/icons/Shield';

const sleepQualityOptions = [
  { value: 1, emoji: '😴', label: 'Poor', description: 'Restless night', color: 'bg-red-100 border-red-300 dark:bg-red-950/30 dark:border-red-800' },
  { value: 2, emoji: '😪', label: 'Fair', description: 'Some disruptions', color: 'bg-orange-100 border-orange-300 dark:bg-orange-950/30 dark:border-orange-800' },
  { value: 3, emoji: '😊', label: 'Good', description: 'Decent rest', color: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-800' },
  { value: 4, emoji: '😌', label: 'Great', description: 'Refreshing sleep', color: 'bg-green-100 border-green-300 dark:bg-green-950/30 dark:border-green-800' },
  { value: 5, emoji: '🌟', label: 'Perfect', description: 'Amazing rest', color: 'bg-blue-100 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800' },
];

const environmentOptions = [
  'Bedroom', 'Hotel', 'Guest Room', 'Couch', 'Car', 'Plane', 'Outdoors', 'Other'
];

const getSleepDurationColor = (hours: number) => {
  if (hours < 6) return 'text-red-600 dark:text-red-400';
  if (hours < 7) return 'text-orange-600 dark:text-orange-400';
  if (hours >= 7 && hours <= 9) return 'text-green-600 dark:text-green-400';
  return 'text-blue-600 dark:text-blue-400';
};

const getSleepQualityIcon = (quality: number) => {
  if (quality <= 2) return <Moon className="w-5 h-5 text-red-500" />;
  if (quality === 3) return <Moon className="w-5 h-5 text-yellow-500" />;
  return <MoonStar className="w-5 h-5 text-blue-500" />;
};

export default function SleepLogScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const { isInitialized } = useDatabase();
  const { createSleepLog, getTodaySleepLog, getSleepStreak, loading: sleepLoading } = useSleepLogs();
  
  // Form state
  const [bedTime, setBedTime] = React.useState<string>('');
  const [wakeTime, setWakeTime] = React.useState<string>('');
  const [sleepQuality, setSleepQuality] = React.useState<number | null>(null);
  const [sleepInterruptions, setSleepInterruptions] = React.useState<number>(0);
  const [dreamRecall, setDreamRecall] = React.useState<boolean>(false);
  const [environment, setEnvironment] = React.useState<string>('Bedroom');
  const [notes, setNotes] = React.useState<string>('');
  
  // App state
  const [isLoading, setIsLoading] = React.useState(false);
  const [todaySleepLog, setTodaySleepLog] = React.useState<SleepLog | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const [sleepStreak, setSleepStreak] = React.useState<number>(0);

  // Helper function for theme-aware gradients
  const getGradientColors = (type: 'header' | 'formHeader' | 'motivational' | 'summary' | 'encouragement' | 'sleepLogged' | 'sleepTips' | 'quickAdd' | 'bottomEncouragement' | 'insights', isDark: boolean = false) => {
    const gradients = {
      header: isDark ? ['#312e81', '#581c87'] as const : ['#6366f1', '#8b5cf6'] as const,
      formHeader: isDark ? ['#581c87', '#312e81'] as const : ['#8b5cf6', '#6366f1'] as const,
      motivational: isDark ? ['#581c87', '#312e81'] as const : ['#f3e8ff', '#e0e7ff'] as const,
      summary: isDark ? ['#1e40af', '#581c87'] as const : ['#dbeafe', '#f3e8ff'] as const,
      encouragement: isDark ? ['#be185d', '#ec4899'] as const : ['#fdf2f8', '#fce7f3'] as const,
      sleepLogged: isDark ? ['#166534', '#0f766e'] as const : ['#f0fdf4', '#f0fdfa'] as const,
      sleepTips: isDark ? ['#0f766e', '#0891b2'] as const : ['#f0fdfa', '#ecfeff'] as const,
      quickAdd: isDark ? ['#312e81', '#581c87'] as const : ['#6366f1', '#8b5cf6'] as const,
      bottomEncouragement: isDark ? ['#581c87', '#7c3aed'] as const : ['#f3e8ff', '#ede9fe'] as const,
      insights: isDark ? ['#16a34a', '#059669'] as const : ['#dcfce7', '#d1fae5'] as const
    };
    return gradients[type];
  };

  // Load today's sleep log when component mounts or database is ready
  React.useEffect(() => {
    if (isInitialized) {
      loadTodaySleepLog();
      loadSleepStreak();
    }
  }, [isInitialized]);

  const loadTodaySleepLog = async () => {
    try {
      const log = await getTodaySleepLog();
      setTodaySleepLog(log);
    } catch (error) {
      console.error('Error loading today\'s sleep log:', error);
    }
  };

  const loadSleepStreak = async () => {
    try {
      const streak = await getSleepStreak();
      setSleepStreak(streak);
    } catch (error) {
      console.error('Error loading sleep streak:', error);
    }
  };

  const calculateSleepDuration = (bedTime: string, wakeTime: string): number => {
    if (!bedTime || !wakeTime) return 0;
    
    const bed = new Date(`1970-01-01T${bedTime}`);
    let wake = new Date(`1970-01-01T${wakeTime}`);
    
    // If wake time is earlier than bed time, assume it's the next day
    if (wake < bed) {
      wake = new Date(`1970-01-02T${wakeTime}`);
    }
    
    const durationMs = wake.getTime() - bed.getTime();
    return durationMs / (1000 * 60 * 60); // Convert to hours
  };

  const handleSave = async () => {
    if (!bedTime || !wakeTime || sleepQuality === null) {
      return; // Require essential fields
    }

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const sleepDurationHours = calculateSleepDuration(bedTime, wakeTime);
      
      await createSleepLog({
        date: today,
        bedTime,
        wakeTime,
        sleepDurationHours,
        sleepQuality,
        sleepInterruptions,
        dreamRecall,
        environment,
        notes: notes.trim(),
        timestamp: new Date().toISOString(),
      });

      // Show positive reinforcement message
      const encouragingMessages = [
        "🌙 Wonderful! Tracking your sleep is key to better health!",
        "✨ Amazing! You're building healthy sleep awareness!",
        "🌟 Fantastic! Every night logged is progress toward better rest!",
        "💤 Great job! Sleep tracking shows you care about wellness!",
        "🦋 Beautiful! You're creating positive sleep habits!",
        "🌸 Excellent! Sweet dreams start with good tracking!",
        "🌺 Wonderful! Your commitment to sleep health is inspiring!",
        "⭐ Outstanding! You're investing in restorative rest!"
      ];
      
      const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
      setSuccessMessage(randomMessage);
      setShowSuccessMessage(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccessMessage(false), 3000);

      // Reset form
      setBedTime('');
      setWakeTime('');
      setSleepQuality(null);
      setSleepInterruptions(0);
      setDreamRecall(false);
      setEnvironment('Bedroom');
      setNotes('');
      setShowForm(false);

      // Reload today's sleep log and streak
      await loadTodaySleepLog();
      await loadSleepStreak();
    } catch (error) {
      console.error('Error saving sleep log:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMotivationalMessage = () => {
    const hour = new Date().getHours();
    if (hour < 6) {
      return "Still up? 🌙 Time to wind down and prepare for restful sleep";
    } else if (hour < 12) {
      return "Good morning! ☀️ How was your sleep last night?";
    } else if (hour < 18) {
      return "Good afternoon! 🌤️ Planning for a great night's rest?";
    } else {
      return "Good evening! 🌅 Ready to log your sleep and plan for tonight?";
    }
  };

  const getStreakMessage = () => {
    if (sleepStreak === 0) {
      return "Start tracking your sleep journey! 🌙";
    } else if (sleepStreak === 1) {
      return "Day 1 complete! Building healthy sleep habits! 🌟";
    } else if (sleepStreak === 2) {
      return "2 nights tracked! You're creating awareness! ✨";
    } else if (sleepStreak === 3) {
      return "3 nights strong! Sleep tracking is becoming routine! 🎯";
    } else if (sleepStreak < 7) {
      return `${sleepStreak} nights tracked! Keep building this habit! 🚀`;
    } else if (sleepStreak < 14) {
      return `${sleepStreak} nights strong! You're a sleep wellness champion! 🏆`;
    } else if (sleepStreak < 30) {
      return `${sleepStreak} night streak! Your sleep awareness is incredible! 🌟`;
    } else {
      return `${sleepStreak} nights! You're a sleep tracking master! 👑`;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderSleepSummary = () => {
    if (!todaySleepLog) return null;

    const duration = todaySleepLog.sleepDurationHours;
    const quality = sleepQualityOptions.find(q => q.value === todaySleepLog.sleepQuality);
    
    return (
      <Card className="w-full shadow-sm border-blue-200 dark:border-blue-800">
        <LinearGradient
          colors={getGradientColors('summary', isDarkColorScheme)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className='rounded-lg'
        >
        <CardContent className="pt-4">
          <View className="flex-row items-center gap-3 mb-3">
            <MoonStar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <Text className="text-lg font-semibold text-blue-800 dark:text-blue-200">
              Last Night's Sleep
            </Text>
          </View>
          
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-blue-700 dark:text-blue-300">Bedtime:</Text>
              <Text className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {formatTime(todaySleepLog.bedTime)}
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-sm text-blue-700 dark:text-blue-300">Wake Time:</Text>
              <Text className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {formatTime(todaySleepLog.wakeTime)}
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-sm text-blue-700 dark:text-blue-300">Duration:</Text>
              <Text className={`text-sm font-medium ${getSleepDurationColor(duration)}`}>
                {duration.toFixed(1)} hours
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-blue-700 dark:text-blue-300">Quality:</Text>
              <View className="flex-row items-center gap-2">
                {getSleepQualityIcon(todaySleepLog.sleepQuality)}
                <Text className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {quality?.label} {quality?.emoji}
                </Text>
              </View>
            </View>
          </View>
        </CardContent>
        </LinearGradient>
      </Card>
    );
  };

  if (!showForm) {
    // Show loading state while database is initializing
    if (!isInitialized) {
      return (
        <View className="flex-1 justify-center items-center bg-background">
          <Moon className="w-12 h-12 text-blue-500 mb-4" />
          <Text className="text-lg font-semibold text-foreground">Getting ready...</Text>
          <Text className="text-muted-foreground">Setting up your sleep tracker</Text>
        </View>
      );
    }

    return (
      <ScrollView className="flex-1 bg-background">
        {/* Success Message Overlay */}
        {showSuccessMessage && (
          <View className="absolute top-20 left-6 right-6 z-50">
            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
              <CardContent className="pt-4">
                <Text className="text-center text-blue-800 dark:text-blue-200 font-medium">
                  {successMessage}
                </Text>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Header */}
        <LinearGradient
          colors={getGradientColors('header', isDarkColorScheme)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-6 py-8 pb-12"
        >
          <View className="flex-row items-center gap-3 mb-4">
            <MoonStar className="w-6 h-6 text-white" />
            <Text className="text-2xl font-bold text-white">Sleep Tracking</Text>
          </View>
          <Text className="text-white/90 dark:text-white/80 text-lg mb-2">
            {getMotivationalMessage()}
          </Text>
          <Text className="text-white/70 dark:text-white/60 text-sm">
            {getCurrentTime()} • {new Date().toLocaleDateString()}
          </Text>
        </LinearGradient>

        <View className="gap-6 p-6 -mt-4">
          {/* Motivational Card */}
          <Card className="w-full shadow-sm border-purple-200 dark:border-purple-800">
            <LinearGradient
              colors={getGradientColors('motivational', isDarkColorScheme)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className='rounded-lg'
            >
            <CardContent className="pt-4">
              <View className="flex-row items-center gap-3 mb-2">
                <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <Text className="text-lg font-semibold text-purple-800 dark:text-purple-200">
                  {getStreakMessage()}
                </Text>
              </View>
              <Text className="text-purple-700 dark:text-purple-300 text-sm">
                Quality sleep is the foundation of a healthy, happy life! Every night matters. 🌙✨
              </Text>
            </CardContent>
            </LinearGradient>
          </Card>

          {/* Today's Sleep Summary */}
          {todaySleepLog && renderSleepSummary()}

          {/* Quick Add Button */}
          <Pressable 
            onPress={() => setShowForm(true)}
            disabled={todaySleepLog !== null}
            className="w-full"
            style={{ opacity: todaySleepLog !== null ? 0.5 : 1 }}
          >
            <LinearGradient
              colors={getGradientColors('quickAdd', isDarkColorScheme)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className='w-full h-14 items-center justify-center rounded-lg'
            >
              <View className="flex-row items-center gap-2">
                <Moon className="w-5 h-5 text-white" />
                <Text className="text-white text-lg font-medium">
                  {todaySleepLog ? "Sleep Already Logged Today! 🌟" : "Log Last Night's Sleep 💤"}
                </Text>
              </View>
            </LinearGradient>
          </Pressable>

          {todaySleepLog && (
            <Card className="w-full shadow-sm border-green-200 dark:border-green-800">
              <LinearGradient
                colors={getGradientColors('sleepLogged', isDarkColorScheme)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className='rounded-lg'
              >
              <CardContent className="pt-4">
                <View className="flex-row items-center gap-3 mb-2">
                  <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <Text className="text-lg font-semibold text-green-800 dark:text-green-200">
                    Sleep Logged! 🎉
                  </Text>
                </View>
                <Text className="text-green-700 dark:text-green-300 text-sm">
                  Fantastic! You've already tracked your sleep today. Keep building those healthy habits! Tomorrow's another opportunity for great rest! 🌟
                </Text>
              </CardContent>
              </LinearGradient>
            </Card>
          )}

          {/* Sleep Tips Card */}
          <Card className="w-full shadow-sm border-teal-200 dark:border-teal-800">
            <LinearGradient
              colors={getGradientColors('sleepTips', isDarkColorScheme)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className='rounded-lg'
            >
            <CardContent className="pt-4">
              <View className="flex-row items-center gap-3 mb-3">
                <Sun className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                <Text className="text-lg font-semibold text-teal-800 dark:text-teal-200">
                  Sleep Well Tonight! 🌙
                </Text>
              </View>
              <View className="gap-2">
                <Text className="text-teal-700 dark:text-teal-300 text-sm">
                  💡 Create a bedtime routine 30 minutes before sleep
                </Text>
                <Text className="text-teal-700 dark:text-teal-300 text-sm">
                  📱 Put devices away 1 hour before bed for better rest
                </Text>
                <Text className="text-teal-700 dark:text-teal-300 text-sm">
                  🌡️ Keep your room cool (60-67°F) for optimal sleep
                </Text>
                <Text className="text-teal-700 dark:text-teal-300 text-sm">
                  🧘 Try deep breathing or meditation to wind down
                </Text>
              </View>
            </CardContent>
            </LinearGradient>
          </Card>

          {/* Bottom spacing */}
          <View className="h-8" />
        </View>
      </ScrollView>
    );
  }

  // Sleep Entry Form
  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header */}
      <LinearGradient
        colors={getGradientColors('formHeader', isDarkColorScheme)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="px-6 py-8 pb-12"
      >
        <View className="flex-row items-center gap-3 mb-4">
          <MoonStar className="w-6 h-6 text-white" />
          <Text className="text-2xl font-bold text-white">✨ Track Your Sleep</Text>
        </View>
        <Text className="text-white/90 dark:text-white/80 text-lg mb-2">
          Every night of rest you track brings you closer to better health! 🌟
        </Text>
        <Text className="text-white/70 dark:text-white/60 text-sm">
          {getCurrentTime()} • {new Date().toLocaleDateString()}
        </Text>
      </LinearGradient>

      <View className="gap-6 p-6 -mt-4">
        {/* Encouragement Card */}
        <Card className="w-full shadow-sm border-pink-200 dark:border-pink-800">
          <LinearGradient
            colors={getGradientColors('encouragement', isDarkColorScheme)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className='rounded-lg'
          >
          <CardContent className="pt-4">
            <View className="flex-row items-center gap-3">
              <Star className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              <Text className="text-lg font-semibold text-pink-800 dark:text-pink-200">
                You're Amazing! 🌸
              </Text>
            </View>
            <Text className="text-pink-700 dark:text-pink-300 text-sm mt-2">
              Taking time to track your sleep shows incredible self-care! Every detail helps build better rest habits. 💤✨
            </Text>
          </CardContent>
          </LinearGradient>
        </Card>

        {/* Sleep Times */}
        <Card className="w-full shadow-sm border-2 border-indigo-200 dark:border-indigo-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex-row items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <Text className="text-lg font-semibold text-indigo-800 dark:text-indigo-200">
                Sleep Times 🕘
              </Text>
            </CardTitle>
            <Text className="text-sm text-muted-foreground">
              When did you go to bed and wake up?
            </Text>
          </CardHeader>
          <CardContent className="pt-0 gap-4">
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Bedtime *</Text>
              <TextInput
                value={bedTime}
                onChangeText={setBedTime}
                placeholder="22:30"
                placeholderTextColor="#9ca3af"
                className="border-2 border-indigo-200 dark:border-indigo-700 rounded-xl p-4 text-foreground bg-white dark:bg-gray-900/50 focus:border-indigo-400 dark:focus:border-indigo-500"
              />
            </View>
            
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Wake Time *</Text>
              <TextInput
                value={wakeTime}
                onChangeText={setWakeTime}
                placeholder="07:00"
                placeholderTextColor="#9ca3af"
                className="border-2 border-indigo-200 dark:border-indigo-700 rounded-xl p-4 text-foreground bg-white dark:bg-gray-900/50 focus:border-indigo-400 dark:focus:border-indigo-500"
              />
            </View>

            {bedTime && wakeTime && (
              <View className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl">
                <Text className="text-center text-indigo-800 dark:text-indigo-200 font-medium">
                  Sleep Duration: {calculateSleepDuration(bedTime, wakeTime).toFixed(1)} hours
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Sleep Quality */}
        <Card className="w-full shadow-sm border-2 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex-row items-center gap-2">
              <MoonStar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <Text className="text-lg font-semibold text-purple-800 dark:text-purple-200">
                Sleep Quality ⭐
              </Text>
            </CardTitle>
            <Text className="text-sm text-muted-foreground">
              How well did you sleep? Every assessment helps! *
            </Text>
          </CardHeader>
          <CardContent className="pt-0">
            <View className="flex-row flex-wrap justify-center gap-3">
              {sleepQualityOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setSleepQuality(option.value)}
                  className={`p-4 rounded-xl border-2 items-center min-w-[80px] ${
                    sleepQuality === option.value
                      ? option.color
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700'
                  }`}
                >
                  <Text className="text-2xl mb-1">{option.emoji}</Text>
                  <Text className={`text-sm font-medium ${
                    sleepQuality === option.value ? 'text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {option.label}
                  </Text>
                  <Text className={`text-xs text-center ${
                    sleepQuality === option.value ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'
                  }`}>
                    {option.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Sleep Interruptions */}
        <Card className="w-full shadow-sm border border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex-row items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <Text className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                Sleep Interruptions 🔄
              </Text>
            </CardTitle>
            <Text className="text-sm text-muted-foreground">
              How many times did you wake up during the night?
            </Text>
          </CardHeader>
          <CardContent className="pt-0">
            <View className="flex-row justify-center gap-3">
              {[0, 1, 2, 3, 4, 5].map((num) => (
                <Pressable
                  key={num}
                  onPress={() => setSleepInterruptions(num)}
                  className={`w-12 h-12 rounded-full border-2 items-center justify-center ${
                    sleepInterruptions === num
                      ? 'bg-orange-100 border-orange-400 dark:bg-orange-950/30 dark:border-orange-600'
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700'
                  }`}
                >
                  <Text className={`font-semibold ${
                    sleepInterruptions === num ? 'text-orange-700 dark:text-orange-300' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {num === 5 ? '5+' : num}
                  </Text>
                </Pressable>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Dream Recall & Environment */}
        <Card className="w-full shadow-sm border border-teal-200 dark:border-teal-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex-row items-center gap-2">
              <Zap className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <Text className="text-lg font-semibold text-teal-800 dark:text-teal-200">
                Details 📝
              </Text>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 gap-4">
            {/* Dream Recall */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Dream Recall</Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setDreamRecall(true)}
                  className={`flex-1 p-3 rounded-xl border-2 items-center ${
                    dreamRecall
                      ? 'bg-teal-100 border-teal-400 dark:bg-teal-950/30 dark:border-teal-600'
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700'
                  }`}
                >
                  <Text className={`font-medium ${
                    dreamRecall ? 'text-teal-700 dark:text-teal-300' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    🌈 Yes, I remember
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={() => setDreamRecall(false)}
                  className={`flex-1 p-3 rounded-xl border-2 items-center ${
                    !dreamRecall
                      ? 'bg-gray-100 border-gray-400 dark:bg-gray-800/50 dark:border-gray-600'
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700'
                  }`}
                >
                  <Text className={`font-medium ${
                    !dreamRecall ? 'text-gray-700 dark:text-gray-300' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    🌙 No dreams recalled
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Environment */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Sleep Environment</Text>
              <View className="flex-row flex-wrap gap-2">
                {environmentOptions.map((env) => (
                  <Pressable
                    key={env}
                    onPress={() => setEnvironment(env)}
                    className={`px-4 py-2 rounded-full border-2 ${
                      environment === env
                        ? 'bg-teal-100 border-teal-400 dark:bg-teal-950/30 dark:border-teal-600'
                        : 'bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${
                      environment === env ? 'text-teal-700 dark:text-teal-300' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {env}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="w-full shadow-sm border border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex-row items-center gap-2">
              <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <Text className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                Sleep Notes 💭
              </Text>
            </CardTitle>
            <Text className="text-sm text-muted-foreground">
              Any thoughts about your sleep? Everything you notice matters! (Optional)
            </Text>
          </CardHeader>
          <CardContent className="pt-0">
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="How did you feel when you woke up? Any factors that affected your sleep? ✨"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              className="border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 text-foreground bg-white dark:bg-gray-900/50 min-h-[80px] focus:border-blue-400 dark:focus:border-blue-500"
              style={{ textAlignVertical: 'top' }}
            />
            {notes.trim().length > 0 && (
              <Text className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                ✨ Your observations are valuable for better sleep! 
              </Text>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <View className="gap-3">
          <Pressable 
            onPress={handleSave}
            disabled={!bedTime || !wakeTime || sleepQuality === null || isLoading}
            className="w-full"
            style={{ opacity: !bedTime || !wakeTime || sleepQuality === null || isLoading ? 0.5 : 1 }}
          >
            <LinearGradient
              colors={getGradientColors('quickAdd', isDarkColorScheme)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className='w-full h-14 items-center justify-center rounded-lg'
            >
              <View className="flex-row items-center gap-2">
                <MoonStar className="w-5 h-5 text-white" />
                <Text className="text-white text-lg font-medium">
                  {isLoading ? "Saving Your Sleep... 💤" : "Save Sleep Log 🌟"}
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
          
          <Pressable 
            onPress={() => setShowForm(false)}
            className="w-full"
          >
            <View className="w-full border-2 border-gray-300 dark:border-gray-600 py-3 rounded-lg items-center justify-center bg-white dark:bg-gray-900/50">
              <Text className="text-lg text-gray-700 dark:text-gray-300">Maybe Later 💙</Text>
            </View>
          </Pressable>
        </View>

        {/* Bottom Encouragement */}
        <LinearGradient
          colors={getGradientColors('insights', isDarkColorScheme)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className='w-full shadow-sm p-4 rounded-lg'
        >
          <Text className={`text-center font-medium ${isDarkColorScheme ? 'text-white' : 'text-green-800'}`}>
            🎉 You're incredible for prioritizing your sleep health! 
          </Text>
          <Text className={`text-center text-sm mt-1 ${isDarkColorScheme ? 'text-white/90' : 'text-green-700'}`}>
            Every night tracked is a step toward better rest and wellness! 🌙⭐
          </Text>
        </LinearGradient>

        {/* Bottom spacing */}
        <View className="h-8" />
      </View>
    </ScrollView>
  );
}
