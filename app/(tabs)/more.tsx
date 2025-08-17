import * as React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '~/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { useColorScheme } from '~/lib/useColorScheme';
import { useRouter } from 'expo-router';
import { MoonStar, BookOpen, Settings, Sparkles, Star, Target } from 'lucide-react-native';

interface MoreItem { id: string; title: string; description?: string; icon: React.ComponentType<any>; onPress: () => void; }

export default function MoreScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const router = useRouter();

  const items: MoreItem[] = [
    { id: 'sleep', title: 'Sleep Log', description: 'Track sleep duration & quality', icon: MoonStar, onPress: () => router.push('/(tabs)/sleep-log') },
    { id: 'journal', title: 'Journal', description: 'Reflect & write entries', icon: BookOpen, onPress: () => router.push('/(tabs)/journal') },
  ];

  const upcoming: MoreItem[] = [
    { id: 'settings', title: 'Settings (soon)', description: 'Personalization & preferences', icon: Settings, onPress: () => {} },
    { id: 'ai', title: 'AI Insights (soon)', description: 'Deeper patterns & coaching', icon: Sparkles, onPress: () => {} },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left','right']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={isDarkColorScheme ? ['#0f766e','#3730a3'] : ['#14b8a6','#6366f1']}
        start={{x:0,y:0}} end={{x:1,y:0}}
  className="pb-8 pr-6 pl-8"
        style={{ paddingTop: 56 }}
      >
        <View className="flex-row items-center gap-3 mb-3 mt-4">
          <Star size={28} color="#ffffff" />
          <Text className="text-2xl font-bold text-white">More</Text>
        </View>
        <Text className="text-white/85 text-base leading-6">Less frequent logs & upcoming features ✨</Text>
      </LinearGradient>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 48, paddingTop: 16 }}>
        <View className="px-6 gap-6">
          {/* Active Extra Logs */}
          <Card className="w-full shadow-sm border-2 border-indigo-200 dark:border-indigo-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex-row items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <Text className="text-indigo-800 dark:text-indigo-200 font-semibold">Logs & Activities</Text>
              </CardTitle>
              <Text className="text-sm text-indigo-600 dark:text-indigo-400">Access additional tracking screens</Text>
            </CardHeader>
            <CardContent className="pt-0 gap-4">
              {items.map(item => { const Icon = item.icon; return (
                <TouchableOpacity
                  key={item.id}
                  onPress={item.onPress}
                  className="p-4 rounded-xl border-2 flex-row items-center gap-4 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-800"
                  activeOpacity={0.75}
                >
                  <View className="w-10 h-10 rounded-full bg-white/60 dark:bg-indigo-900/40 items-center justify-center border border-indigo-200 dark:border-indigo-700">
                    <Icon size={20} color={isDarkColorScheme? '#cbd5e1':'#4338ca'} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-indigo-800 dark:text-indigo-200">{item.title}</Text>
                    {item.description && <Text className="text-xs text-indigo-600 dark:text-indigo-400">{item.description}</Text>}
                  </View>
                </TouchableOpacity>
              ); })}
            </CardContent>
          </Card>

          {/* Upcoming Features */}
            <Card className="w-full shadow-sm border-2 border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex-row items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <Text className="text-purple-800 dark:text-purple-200 font-semibold">Coming Soon</Text>
                </CardTitle>
                <Text className="text-sm text-purple-600 dark:text-purple-400">Preview of what's next</Text>
              </CardHeader>
              <CardContent className="pt-0 gap-4">
                {upcoming.map(item => { const Icon = item.icon; return (
                  <View
                    key={item.id}
                    className="p-4 rounded-xl border-2 flex-row items-center gap-4 border-purple-100 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/30"
                  >
                    <View className="w-10 h-10 rounded-full bg-white/60 dark:bg-purple-900/30 items-center justify-center border border-purple-200 dark:border-purple-700">
                      <Icon size={20} color={isDarkColorScheme? '#e9d5ff':'#6b21a8'} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-purple-800 dark:text-purple-200">{item.title}</Text>
                      {item.description && <Text className="text-xs text-purple-600 dark:text-purple-400">{item.description}</Text>}
                    </View>
                  </View>
                ); })}
                <View className="p-3 rounded-lg border border-dashed border-purple-300 dark:border-purple-700 bg-transparent">
                  <Text className="text-xs text-purple-600 dark:text-purple-300">Have ideas? Log them in your Journal or watch for AI Insights soon.</Text>
                </View>
              </CardContent>
            </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
