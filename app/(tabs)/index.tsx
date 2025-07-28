import * as React from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import { Text } from '~/components/ui/text';
import { ThemeToggle } from '~/components/ThemeToggle';
import { WelcomeDialog } from '~/components/WelcomeDialog';
import { useDatabase, useStreaks, useMoodLogs, useSleepLogs, useUserSettings, useAddictionLogs, useDashboardData, useJournal } from '~/lib/hooks/useDatabase'
import type { MoodLog, SleepLog } from '~/lib/database/types';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
// Import configured icons
import { Star } from '~/lib/icons/Star';
import { Smile } from '~/lib/icons/Smile';
import { Moon } from '~/lib/icons/Moon';
import { Activity } from '~/lib/icons/Activity';
import { Target } from '~/lib/icons/Target';
import { Shield } from '~/lib/icons/Shield';
import { Smartphone } from '~/lib/icons/Smartphone';
import { UtensilsCrossed } from '~/lib/icons/UtensilsCrossed';
import { Cigarette } from '~/lib/icons/Cigarette';
import { Leaf } from '~/lib/icons/Leaf';
import { Monitor } from '~/lib/icons/Monitor';
import { BookOpen } from '~/lib/icons/BookOpen';
import { AlertTriangle } from '~/lib/icons/AlertTriangle';
import { FileText } from '~/lib/icons/FileText';
import { Zap } from '~/lib/icons/Zap';
import { BarChart3 } from '~/lib/icons/BarChart3';
import { Flame } from '~/lib/icons/Flame';
import { ClipboardList } from '~/lib/icons/ClipboardList';

export default function Screen() {
  const { isInitialized, isInitializing, error: dbError, retry } = useDatabase();
  const { streaks, loadAllStreaks, loading: streaksLoading } = useStreaks();
  const { getTodayMoodLogs } = useMoodLogs();
  const { getTodaySleepLog } = useSleepLogs();
  const { userName, isFirstTime, saveUserName, loading: userLoading } = useUserSettings();
  const { dashboardData, loadDashboardData, loading: dashboardLoading } = useDashboardData();
  const { getEntryByDate } = useJournal();
  const [todayMoodLogs, setTodayMoodLogs] = React.useState<MoodLog[]>([]);
  const [todaySleep, setTodaySleep] = React.useState<SleepLog | null>(null);
  const [todayJournal, setTodayJournal] = React.useState<any>(null);
  const [showWelcome, setShowWelcome] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (isInitialized) {
        loadAllStreaks();
        loadTodayData();
        loadDashboardData();
      }
    }, [isInitialized])
  );

  // Load data when database is ready
  React.useEffect(() => {
    if (isInitialized) {
      loadAllStreaks();
      loadTodayData();
      loadDashboardData();
    }
  }, [isInitialized]);

  // Show welcome dialog for first-time users - check if username is null
  React.useEffect(() => {
    console.log('Welcome check:', { isInitialized, userLoading, userName, showWelcome });
    
    // Show welcome if database is ready, not loading, and no username exists
    if (isInitialized && !userLoading && userName === null && !showWelcome) {
      console.log('Showing welcome dialog - no username found');
      setShowWelcome(true);
    }
  }, [isInitialized, userLoading, userName, showWelcome]);

  const loadTodayData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [moodLogs, sleepLog, journalEntry] = await Promise.all([
        getTodayMoodLogs(),
        getTodaySleepLog(),
        getEntryByDate(today)
      ]);
      setTodayMoodLogs(moodLogs);
      setTodaySleep(sleepLog);
      setTodayJournal(journalEntry);
    } catch (error) {
      console.error('Failed to load today\'s data:', error);
    }
  };

  const refreshAllData = async () => {
    if (isInitialized) {
      await Promise.all([
        loadAllStreaks(),
        loadTodayData(),
        loadDashboardData()
      ]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAllData();
    setRefreshing(false);
  };

  const handleWelcomeComplete = async (name: string) => {
    console.log('Welcome complete called with name:', name);
    const success = await saveUserName(name);
    if (success) {
      console.log('Username saved successfully, hiding welcome dialog');
      setShowWelcome(false);
      // Refresh data after setting up the user
      loadTodayData();
      loadDashboardData();
    } else {
      console.error('Failed to save username');
    }
  };

  const handleQuickLog = async (type: 'mood' | 'sleep' | 'activity' | 'addiction' | 'journal' | 'habit') => {
    try {
      switch (type) {
        case 'mood':
          router.push('/(tabs)/mood-check');
          break;
        case 'sleep':
          // For now, create a simple sleep log - in a real app this would navigate to a form
          console.log('Opening sleep logging screen');
          break;
        case 'addiction':
          router.push('/(tabs)/addiction-log');
          break;
        case 'habit':
          router.push('/(tabs)/habits-log');
          break;
        case 'journal':
          router.push('/(tabs)/journal');
          break;
        default:
          console.log(`Opening ${type} logging screen`);
      }
    } catch (error) {
      console.error(`Failed to handle ${type} quick log:`, error);
    }
  };

  const getRecentEntries = () => {
    const entries: Array<{type: string, value: string, time: string, color: string}> = [];
    
    // Add recent mood logs
    if (dashboardData?.recentMoodLogs) {
      dashboardData.recentMoodLogs.slice(0, 2).forEach((log: any) => {
        const timeAgo = getTimeAgo(log.timestamp);
        const moodEmoji = getMoodEmoji(log.mood);
        entries.push({
          type: 'mood',
          value: `${moodEmoji} Mood: ${log.mood}/5`,
          time: timeAgo,
          color: 'bg-blue-50 border-blue-200'
        });
      });
    }
    
    // Add recent sleep logs
    if (dashboardData?.recentSleepLogs) {
      dashboardData.recentSleepLogs.slice(0, 1).forEach((log: any) => {
        const timeAgo = getTimeAgo(log.timestamp);
        entries.push({
          type: 'sleep',
          value: `� ${log.sleepDurationHours}h sleep`,
          time: timeAgo,
          color: 'bg-purple-50 border-purple-200'
        });
      });
    }
    
    // Add recent addiction logs (wins/resistance)
    if (dashboardData?.recentAddictionLogs) {
      dashboardData.recentAddictionLogs
        .filter((log: any) => log.eventType === 'urge_resisted')
        .slice(0, 2)
        .forEach((log: any) => {
          const timeAgo = getTimeAgo(log.loggedAt);
          entries.push({
            type: 'addiction',
            value: `🎯 Resisted ${log.substanceType || 'urge'}`,
            time: timeAgo,
            color: 'bg-orange-50 border-orange-200'
          });
        });
    }
    
    // Sort by most recent and return top 4
    return entries.slice(0, 4);
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
      return 'Yesterday';
    }
  };

  const getQuickActions = () => {
    return [
      { 
        id: 'mood', 
        title: 'Mood Check', 
        icon: Smile, 
        description: 'How are you feeling?',
        color: 'bg-blue-50 border-blue-200',
        action: () => handleQuickLog('mood')
      },
      { 
        id: 'sleep', 
        title: 'Sleep Log', 
        icon: Moon, 
        description: 'Hours & quality',
        color: 'bg-purple-50 border-purple-200',
        action: () => handleQuickLog('sleep')
      },
      { 
        id: 'addiction', 
        title: 'Urge/Win', 
        icon: Target, 
        description: 'Log resistance/slip',
        color: 'bg-orange-50 border-orange-200',
        action: () => handleQuickLog('addiction')
      },
      { 
        id: 'habit', 
        title: 'Habit', 
        icon: Flame, 
        description: 'Mark complete',
        color: 'bg-red-50 border-red-200',
        action: () => handleQuickLog('habit')
      },
      { 
        id: 'journal', 
        title: 'Journal', 
        icon: BookOpen, 
        description: 'Quick thoughts',
        color: 'bg-amber-50 border-amber-200',
        action: () => handleQuickLog('journal')
      },
    ];
  };

  const getCurrentTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getStreakIcon = (behaviorType: string) => {
    const icons = {
      porn: Shield,
      reels: Smartphone,
      binge: UtensilsCrossed,
      smoke: Cigarette,
      weed: Leaf,
      internet: Monitor
    };
    return icons[behaviorType as keyof typeof icons] || Target;
  };

  const getMoodEmoji = (mood: number) => {
    const moods = ['😢', '😕', '😐', '😊', '😄'];
    return moods[mood - 1] || '😐';
  };

  const getWellnessScore = () => {
    let score = 0;
    
    // Mood contributes 40% (average of today's mood logs)
    if (todayMoodLogs.length > 0) {
      const avgMood = todayMoodLogs.reduce((sum, log) => sum + log.mood, 0) / todayMoodLogs.length;
      score += (avgMood / 5) * 40;
    }
    
    // Sleep contributes 30% (based on sleep duration and quality)
    if (todaySleep) {
      const sleepScore = Math.min(todaySleep.sleepDurationHours / 8, 1) * 0.7 + (todaySleep.sleepQuality / 5) * 0.3;
      score += sleepScore * 30;
    }
    
    // Use dashboard data for addiction resistance (30%)
    if (dashboardData?.recentAddictionLogs) {
      const todayAddictionLogs = dashboardData.recentAddictionLogs.filter((log: any) => {
        const today = new Date().toISOString().split('T')[0];
        return log.loggedAt.startsWith(today);
      });
      const resistedCount = todayAddictionLogs.filter((log: any) => log.eventType === 'urge_resisted').length;
      score += Math.min(resistedCount / 3, 1) * 30;
    }
    
    return Math.round(score);
  };

  if (isInitializing) {
    return (
      <View className='flex-1 justify-center items-center bg-secondary/30'>
        <ActivityIndicator size="large" />
        <Text className='mt-4 text-lg font-semibold'>Initializing SelfSync...</Text>
        <Text className='text-muted-foreground'>Setting up your personal wellness tracker</Text>
      </View>
    );
  }

  if (dbError) {
    return (
      <View className='flex-1 justify-center items-center gap-4 p-6 bg-secondary/30'>
        <Text className='text-lg font-semibold text-destructive'>Database Error</Text>
        <Text className='text-center text-muted-foreground'>{dbError}</Text>
        <Button onPress={retry}>
          <Text>Retry</Text>
        </Button>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View className='flex-1 justify-center items-center bg-secondary/30'>
        <Text className='text-lg font-semibold'>Database not ready</Text>
      </View>
    );
  }

  return (
    <>
      <WelcomeDialog 
        visible={showWelcome} 
        onComplete={handleWelcomeComplete} 
      />
      
      {/* Header */}
      <View className='bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-900 dark:to-pink-900 px-6 py-8 pb-16'>
        <View className='flex-row items-center justify-between mb-6'>
          <View className='flex-row items-center gap-3'>
            <Star className="w-6 h-6 text-white" />
            <Text className='text-2xl font-bold text-white'>SelfSync</Text>
          </View>
          <ThemeToggle />
        </View>
        
        {/* Personalized Greeting */}
        <View className='mb-4'>
          {userName && !userLoading ? (
            <>
              <Text className='text-white/90 dark:text-white/80 text-lg'>
                {getCurrentTime()},
              </Text>
              <Text className='text-white text-3xl font-bold'>
                {userName}! 🌟
              </Text>
              <Text className='text-white/80 dark:text-white/70 text-base mt-1'>
                Your wellness journey awaits! ✨
              </Text>
            </>
          ) : !userLoading ? (
            <>
              <Text className='text-white/90 dark:text-white/80 text-lg'>
                {getCurrentTime()}!
              </Text>
              <View className='flex-row items-center gap-2'>
                <Text className='text-white text-3xl font-bold'>
                  Welcome to SelfSync
                </Text>
                <Star className="w-7 h-7 text-white" />
              </View>
              <Text className='text-white/80 dark:text-white/70 text-base mt-1'>
                Let's start your amazing wellness journey! 🌈
              </Text>
            </>
          ) : (
            <View className='flex-row items-center'>
              <ActivityIndicator size="small" color="white" />
              <Text className='text-white text-lg ml-2'>Getting everything ready for you...</Text>
            </View>
          )}
        </View>

        {/* Wellness Score */}
        <Card className='bg-white/15 dark:bg-white/10 backdrop-blur border-white/30 dark:border-white/20'>
          <CardContent className='pt-6'>
            <View className='flex-row items-center justify-between'>
              <View className='flex-1'>
                <Text className='text-white/90 dark:text-white/80 text-sm font-medium'>Your Wellness Score 🎯</Text>
                <Text className='text-white text-4xl font-bold'>{getWellnessScore()}</Text>
                <Text className='text-white/70 dark:text-white/60 text-sm'>out of 100</Text>
                <Text className='text-white/80 dark:text-white/70 text-xs mt-1'>
                  {getWellnessScore() >= 80 ? 'You\'re absolutely crushing it! 🎉' : 
                   getWellnessScore() >= 60 ? 'You\'re doing amazing! Keep going! 💪' : 
                   getWellnessScore() >= 40 ? 'Great progress! Every step counts! 🌱' : 'You\'re here, and that\'s what matters! 💚'}
                </Text>
              </View>
              <View className='items-center ml-4'>
                <Progress 
                  value={getWellnessScore()} 
                  className='w-16 h-16' 
                />
                <Text className='text-white/90 dark:text-white/80 text-xs mt-2 text-center'>
                  {getWellnessScore() >= 80 ? '🎉 Amazing' : 
                   getWellnessScore() >= 60 ? '😊 Great' : 
                   getWellnessScore() >= 40 ? '🌱 Growing' : '� Starting'}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>
      
      <ScrollView 
        className='flex-1 bg-secondary/30 -mt-8'
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#8B5CF6"
            colors={["#8B5CF6"]}
          />
        }
      >
        <View className='gap-4 p-4 pt-8'>
          
          {/* Motivational Welcome Card */}
          {todayMoodLogs.length === 0 && !todaySleep && !todayJournal && (
            <Card className='w-full shadow-sm bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 border-green-200 dark:border-green-800'>
              <CardContent className='pt-4'>
                <View className='items-center py-4'>
                  <Text className='text-6xl mb-4'>🌱</Text>
                  <Text className='text-green-800 dark:text-green-200 text-lg font-bold text-center mb-2'>
                    Ready to bloom today? 🌸
                  </Text>
                  <Text className='text-green-600 dark:text-green-400 text-center text-sm'>
                    Every small step you take matters. Let's start tracking your beautiful journey together! ✨
                  </Text>
                </View>
              </CardContent>
            </Card>
          )}

          {/* Progress Celebration Card */}
          {(todayMoodLogs.length > 0 || todaySleep || todayJournal) && (
            <Card className='w-full shadow-sm bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200 dark:border-yellow-800'>
              <CardContent className='pt-4'>
                <View className='flex-row items-center gap-3'>
                  <Text className='text-3xl'>🎉</Text>
                  <View className='flex-1'>
                    <Text className='text-yellow-800 dark:text-yellow-200 font-bold text-base'>
                      You're doing incredible today!
                    </Text>
                    <Text className='text-yellow-600 dark:text-yellow-400 text-sm mt-1'>
                      {todayMoodLogs.length > 0 && 'Mood check ✓ '}
                      {todaySleep && 'Sleep logged ✓ '}
                      {todayJournal && 'Journal entry ✓ '}
                      Keep up the amazing work! 🌟
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          )}

          {/* Quick Tracker Actions - Mobile Optimized */}
          <Card className='w-full shadow-sm border-2 border-purple-200 dark:border-purple-800'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex-row items-center gap-2'>
                <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <Text className='text-purple-800 dark:text-purple-200'>Share Your Day 💝</Text>
              </CardTitle>
              <Text className='text-sm text-purple-600 dark:text-purple-400'>
                What's happening in your world right now? Every feeling matters! ✨
              </Text>
            </CardHeader>
            <CardContent className='pt-0'>
              <View className='flex-row flex-wrap gap-2'>
                {getQuickActions().map((action) => {
                  const IconComponent = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      onPress={action.action}
                      className={`flex-1 min-w-[30%] max-w-[48%] h-20 flex-col gap-1 border-2 ${action.color.replace('bg-', 'bg-').replace('border-', 'border-')} dark:bg-muted/20 dark:border-muted hover:scale-105 transform transition-all`}
                    >
                      <IconComponent className="w-6 h-6 text-foreground" />
                      <Text className='text-xs font-bold text-foreground'>{action.title}</Text>
                      <Text className='text-xs text-muted-foreground text-center leading-tight'>{action.description}</Text>
                    </Button>
                  );
                })}
              </View>
            </CardContent>
          </Card>

          {/* Today's Progress Overview */}
          <Card className='w-full shadow-sm border-2 border-pink-200 dark:border-pink-800'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex-row items-center gap-2'>
                <BarChart3 className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                <Text className='text-pink-800 dark:text-pink-200'>Your Beautiful Progress Today 🌸</Text>
              </CardTitle>
              <Text className='text-sm text-pink-600 dark:text-pink-400'>
                Look at all the wonderful things you're tracking! Each one is a gift to yourself 💖
              </Text>
            </CardHeader>
            <CardContent className='pt-0'>
              <View className='flex-row gap-2'>
                <Card className='flex-1 items-center p-3 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-950/50 border-2 border-blue-200 dark:border-blue-800'>
                  <Smile className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                  <Text className='text-xs text-blue-600 dark:text-blue-400 font-bold'>Mood</Text>
                  <Text className='font-bold text-lg text-blue-800 dark:text-blue-200'>
                    {todayMoodLogs.length > 0 
                      ? (todayMoodLogs.reduce((sum, log) => sum + log.mood, 0) / todayMoodLogs.length).toFixed(1)
                      : '-'
                    }
                  </Text>
                  <Text className='text-xs text-blue-500 dark:text-blue-400 text-center'>
                    {todayMoodLogs.length > 0 ? `${todayMoodLogs.length} check-ins! 🌟` : 'Ready to share? 💫'}
                  </Text>
                </Card>
                <Card className='flex-1 items-center p-3 bg-gradient-to-b from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-950/50 border-2 border-purple-200 dark:border-purple-800'>
                  <Moon className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
                  <Text className='text-xs text-purple-600 dark:text-purple-400 font-bold'>Sleep</Text>
                  <Text className='font-bold text-lg text-purple-800 dark:text-purple-200'>
                    {todaySleep?.sleepDurationHours?.toFixed(1) || '-'}h
                  </Text>
                  <Text className='text-xs text-purple-500 dark:text-purple-400 text-center'>
                    {todaySleep ? 'Rest well logged! 😴' : 'Sweet dreams await! 🌙'}
                  </Text>
                </Card>
              </View>
              <View className='flex-row gap-2 mt-2'>
                <Card className='flex-1 items-center p-3 bg-gradient-to-b from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-950/50 border-2 border-green-200 dark:border-green-800'>
                  <Activity className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
                  <Text className='text-xs text-green-600 dark:text-green-400 font-bold'>Total Logs</Text>
                  <Text className='font-bold text-lg text-green-800 dark:text-green-200'>
                    {(todayMoodLogs.length + (todaySleep ? 1 : 0) + (todayJournal ? 1 : 0))}
                  </Text>
                  <Text className='text-xs text-green-500 dark:text-green-400 text-center'>
                    Amazing dedication! 🎯
                  </Text>
                </Card>
                <Card className='flex-1 items-center p-3 bg-gradient-to-b from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-950/50 border-2 border-orange-200 dark:border-orange-800'>
                  <Target className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-2" />
                  <Text className='text-xs text-orange-600 dark:text-orange-400 font-bold'>Wins Today</Text>
                  <Text className='font-bold text-lg text-orange-800 dark:text-orange-200'>
                    {dashboardData?.recentAddictionLogs?.filter((log: any) => {
                      const today = new Date().toISOString().split('T')[0];
                      return log.loggedAt.startsWith(today) && log.eventType === 'urge_resisted';
                    }).length || 0}
                  </Text>
                  <Text className='text-xs text-orange-500 dark:text-orange-400 text-center'>
                    You're so strong! 💪
                  </Text>
                </Card>
              </View>
            </CardContent>
          </Card>

          {/* Recent Activity Timeline */}
          <Card className='w-full shadow-sm border-2 border-indigo-200 dark:border-indigo-800'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex-row items-center justify-between'>
                <View className='flex-row items-center gap-2'>
                  <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <Text className='text-indigo-800 dark:text-indigo-200'>Your Daily Story 📖</Text>
                </View>
                <Button variant="ghost" size="sm">
                  <Text className='text-sm text-indigo-600 dark:text-indigo-400'>All</Text>
                </Button>
              </CardTitle>
              <Text className='text-sm text-indigo-600 dark:text-indigo-400'>
                Every entry tells your beautiful story of growth and self-care! 🌱
              </Text>
            </CardHeader>
            <CardContent className='pt-0'>
              <View className='gap-3'>
                {getRecentEntries().slice(0, 4).map((entry, index) => (
                  <View 
                    key={index}
                    className='flex-row items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-2 border-indigo-100 dark:border-indigo-800'
                  >
                    <View className='w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 items-center justify-center border-2 border-indigo-200 dark:border-indigo-700'>
                      <Text className='text-sm'>{entry.type === 'mood' ? '😊' : 
                                                  entry.type === 'sleep' ? '😴' : 
                                                  entry.type === 'activity' ? '🏃' : '🎯'}</Text>
                    </View>
                    <View className='flex-1'>
                      <Text className='font-semibold text-sm text-indigo-800 dark:text-indigo-200'>{entry.value}</Text>
                      <Text className='text-xs text-indigo-600 dark:text-indigo-400'>{entry.time} ✨</Text>
                    </View>
                    <Button variant="ghost" size="sm" className='px-2 bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700'>
                      <Text className='text-xs text-indigo-700 dark:text-indigo-300'>Edit</Text>
                    </Button>
                  </View>
                ))}
                
                {getRecentEntries().length === 0 && (
                  <View className='items-center py-6 bg-gradient-to-b from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 rounded-lg border-2 border-rose-200 dark:border-rose-800'>
                    <Star className="w-12 h-12 text-rose-600 dark:text-rose-400 mb-2" />
                    <Text className='font-bold mb-1 text-rose-800 dark:text-rose-200'>Your Story Starts Here! 🌟</Text>
                    <Text className='text-sm text-rose-600 dark:text-rose-400 text-center'>
                      Every journey begins with a single step. Start tracking above to create your beautiful timeline! 💫
                    </Text>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>

          {/* Active Streaks */}
          <Card className='w-full shadow-sm border-2 border-yellow-200 dark:border-yellow-800'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex-row items-center justify-between'>
                <View className='flex-row items-center gap-2'>
                  <Flame className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <Text className='text-yellow-800 dark:text-yellow-200'>Your Amazing Streaks 🔥</Text>
                </View>
                <Button variant="ghost" size="sm">
                  <Text className='text-sm text-yellow-600 dark:text-yellow-400'>All</Text>
                </Button>
              </CardTitle>
              <Text className='text-sm text-yellow-600 dark:text-yellow-400'>
                Every day counts! You're building something beautiful, one day at a time ✨
              </Text>
            </CardHeader>
            <CardContent className='pt-0'>
              {streaksLoading ? (
                <View className='items-center py-4'>
                  <ActivityIndicator />
                  <Text className='text-yellow-600 dark:text-yellow-400 mt-2'>Loading your amazing progress...</Text>
                </View>
              ) : streaks.length > 0 ? (
                <View className='flex-row gap-2 flex-wrap'>
                  {streaks
                    .filter(s => s.currentStreak > 0)
                    .slice(0, 6)
                    .map((streak) => {
                      const IconComponent = getStreakIcon(streak.behaviorType);
                      return (
                        <View 
                          key={streak.id} 
                          className='flex-row items-center gap-2 bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-950/50 dark:to-yellow-950/50 border-2 border-orange-200 dark:border-orange-800 rounded-full px-3 py-2 flex-1 min-w-[45%]'
                        >
                          <IconComponent className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          <Text className='text-sm font-bold text-orange-800 dark:text-orange-200'>{streak.currentStreak}</Text>
                          <Text className='text-xs text-orange-600 dark:text-orange-400'>
                            {streak.currentStreak === 1 ? 'day! 🎉' : 'days! 🚀'}
                          </Text>
                        </View>
                      );
                    })}
                </View>
              ) : (
                <View className='items-center py-6 bg-gradient-to-b from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 rounded-lg border-2 border-pink-200 dark:border-pink-800'>
                  <Star className="w-12 h-12 text-pink-600 dark:text-pink-400 mb-2" />
                  <Text className='font-bold mb-1 text-pink-800 dark:text-pink-200'>Ready to Start Your First Streak? 🌈</Text>
                  <Text className='text-sm text-pink-600 dark:text-pink-400 text-center'>
                    Every expert was once a beginner. Your journey starts with the first step! 💪
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>

                    {/* Quick Journal Entry */}
          <Card className='w-full shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-2 border-emerald-200 dark:border-emerald-800'>
            <CardContent className='pt-4'>
              <View className='flex-row items-center gap-2 mb-3'>
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <Text className='font-bold text-emerald-800 dark:text-emerald-200'>Share Your Heart Today 💚</Text>
              </View>
              <Text className='text-sm text-emerald-600 dark:text-emerald-400 mb-3'>
                {todayJournal 
                  ? "Beautiful! You've already shared your thoughts today. Your words matter! ✨" 
                  : "What's on your mind? Your thoughts are precious and worth capturing 🌟"
                }
              </Text>
              <Button 
                variant={todayJournal ? "secondary" : "default"}
                className={`w-full h-12 ${todayJournal 
                  ? 'bg-emerald-100 dark:bg-emerald-900/50 border-2 border-emerald-300 dark:border-emerald-700' 
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 border-2 border-emerald-400'
                }`}
                onPress={() => router.push('/(tabs)/journal')}
              >
                <View className='flex-row items-center gap-2'>
                  <FileText className={`w-4 h-4 ${todayJournal 
                    ? 'text-emerald-700 dark:text-emerald-300' 
                    : 'text-white'
                  }`} />
                  <Text className={`font-semibold ${todayJournal 
                    ? 'text-emerald-700 dark:text-emerald-300' 
                    : 'text-white'
                  }`}>
                    {todayJournal ? 'View Your Beautiful Entry 💖' : 'Start Your Journal Journey ✍️'}
                  </Text>
                </View>
              </Button>
            </CardContent>
          </Card>

          {/* Crisis Support - Minimal */}
          <Card className='w-full shadow-sm bg-red-50/30 dark:bg-red-950/30 border-red-200 dark:border-red-800'>
            <CardContent className='pt-4'>
              <View className='flex-row items-center justify-between'>
                <View className='flex-1'>
                  <View className='flex-row items-center gap-2 mb-1'>
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <Text className='font-semibold text-red-800 dark:text-red-300'>Need Support?</Text>
                  </View>
                  <Text className='text-sm text-red-600 dark:text-red-400'>
                    Crisis resources & coping tools
                  </Text>
                </View>
                <Button variant="outline" size="sm" className='border-red-300 dark:border-red-700'>
                  <Text className='text-red-700 dark:text-red-300'>Help</Text>
                </Button>
              </View>
            </CardContent>
          </Card>

          {/* Bottom spacing for navigation */}
          <View className='h-8' />
        </View>
      </ScrollView>
    </>
  );
}

      
