import * as React from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { H2, H3, P, Small} from "~/components/ui/typography";
import { SimpleHtmlRenderer } from "../../components/ui/simple-html-renderer";
import { useDatabase, useJournal } from "~/lib/hooks/useDatabase";
import { useColorScheme } from "~/lib/useColorScheme";
import type { JournalEntry } from "~/lib/database/types";
import { router, useFocusEffect } from "expo-router";
import { BookOpen } from "~/lib/icons/BookOpen";

const ITEMS_PER_PAGE = 10;

const moodEmojis = {
  1: "😢",
  2: "😕", 
  3: "😐",
  4: "😊",
  5: "😄",
};

const encouragingMessages = [
  "Your thoughts matter. Share what's on your mind today.",
  "Every entry is a step towards self-discovery.",
  "Take a moment to reflect and grow.",
  "Your journey is unique and valuable.",
  "Express yourself freely in this safe space.",
  "Celebrate your progress, no matter how small.",
];

export default function JournalScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const { isInitialized } = useDatabase();
  const {
    entries,
    loadRecentEntries,
    loading,
    error,
    deleteEntry,
  } = useJournal();

  const [encouragingMessage] = React.useState(
    encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)]
  );

  // Load entries when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (isInitialized) {
        loadRecentEntries(ITEMS_PER_PAGE);
      }
    }, [isInitialized])
  );

  const handleDeleteEntry = (entry: JournalEntry) => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this journal entry? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteEntry(entry.id),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (!isInitialized || loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
          <Text className="text-muted-foreground mt-4">Loading journal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
      <ScrollView className="flex-1">
        {/* Header with LinearGradient */}
        <LinearGradient
          colors={
            isDarkColorScheme
              ? ["#166534", "#1e40af"]
              : ["#10b981", "#3b82f6"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="py-8 pb-12"
          style={{ paddingTop: 48 }}
        >
          <View className="px-6 pb-6">
            <View className="flex-row items-center gap-3 mb-4 mt-12">
              <BookOpen className="w-6 h-6 text-white" />
              <Text className="text-2xl font-bold text-white">Your Journal</Text>
            </View>
            <Text className="text-white/90 dark:text-white/80 text-lg mb-2">
              {encouragingMessage}
            </Text>
            <Text className="text-white/70 dark:text-white/60 text-sm">
              Document your thoughts and track your growth ✨
            </Text>
          </View>
        </LinearGradient>

        <View className="gap-6 p-6 -mt-4">
          {/* Stats Card */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Small className="text-muted-foreground mb-1">
                    Total Entries
                  </Small>
                  <H3 className="text-foreground">{entries.length}</H3>
                </View>
                <View className="flex-1">
                  <Small className="text-muted-foreground mb-1">
                    Words Written
                  </Small>
                  <H3 className="text-foreground">
                    {entries.reduce((total, entry) => total + entry.wordCount, 0).toLocaleString()}
                  </H3>
                </View>
                <View className="items-end">
                  <Button
                    onPress={() => router.push("/journal-entry" as any)}
                    size="sm"
                    className="bg-primary"
                  >
                    <Text className="text-primary-foreground font-medium">
                      New Entry
                    </Text>
                  </Button>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Entries List */}
          {entries.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6 py-12">
              <BookOpen className="w-24 h-24 text-muted-foreground mb-6" />
              <H2 className="text-foreground text-center mb-4">
                Start Your Journal Journey
              </H2>
              <P className="text-muted-foreground text-center mb-6 leading-6">
                Welcome to your personal space for reflection and growth. Your first
                entry is just a tap away!
              </P>
              <Button
                onPress={() => router.push("/journal-entry" as any)}
                className="bg-primary w-full"
              >
                <Text className="text-primary-foreground font-medium">
                  Write Your First Entry
                </Text>
              </Button>
            </View>
          ) : (
            <View className="flex-1">
              {entries.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push({ pathname: "/journal-entry", params: { id: item.id } })}
                  className="mb-4"
                >
                  <Card className="bg-card border-border">
                    <CardHeader className="pb-3">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          {item.title && (
                            <H3 className="text-card-foreground mb-1" numberOfLines={1}>
                              {item.title}
                            </H3>
                          )}
                          <Small className="text-muted-foreground">
                            {formatDate(item.date)} • {formatTime(item.createdAt)}
                          </Small>
                        </View>
                        <View className="flex-row items-center space-x-2">
                          {item.mood && (
                            <Text className="text-lg">
                              {moodEmojis[item.mood as keyof typeof moodEmojis]}
                            </Text>
                          )}
                          <TouchableOpacity
                            onPress={() => handleDeleteEntry(item)}
                            className="p-1"
                          >
                            <Text className="text-red-500 text-sm">×</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <View className="mb-3">
                        <SimpleHtmlRenderer 
                          html={item.content}
                          className="text-card-foreground"
                        />
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Small className="text-muted-foreground">
                          {item.wordCount} words
                        </Small>
                        {item.tags && JSON.parse(item.tags).length > 0 && (
                          <View className="flex-row flex-wrap">
                            {JSON.parse(item.tags).slice(0, 2).map((tag: string, index: number) => (
                              <View
                                key={index}
                                className="bg-primary/10 rounded-full px-2 py-1 mr-1"
                              >
                                <Small className="text-primary text-xs">#{tag}</Small>
                              </View>
                            ))}
                            {JSON.parse(item.tags).length > 2 && (
                              <Small className="text-muted-foreground">
                                +{JSON.parse(item.tags).length - 2} more
                              </Small>
                            )}
                          </View>
                        )}
                      </View>
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {error && (
            <Card className="bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800 mt-4">
              <CardContent className="p-4">
                <P className="text-red-600 dark:text-red-400 text-center">
                  {error}
                </P>
              </CardContent>
            </Card>
          )}

          {/* Bottom spacing */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}