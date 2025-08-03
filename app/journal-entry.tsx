import * as React from "react";
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { RichEditor, RichToolbar, actions } from "react-native-pell-rich-editor";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { H1, H2, H3, P, Small, Muted } from "~/components/ui/typography";
import { useDatabase, useJournal } from "~/lib/hooks/useDatabase";
import { useColorScheme } from "~/lib/useColorScheme";
import type { JournalEntry } from "~/lib/database/types";
import { router, useLocalSearchParams } from "expo-router";
import { BookOpen } from "~/lib/icons/BookOpen";
import { X } from "~/lib/icons/X";
import { Smile } from "~/lib/icons/Smile";
import { Star } from "~/lib/icons/Star";

const titleSuggestions = [
  "Today's Reflection", "Grateful Thoughts", "Morning Pages", "Evening Reflection",
  "What I Learned Today", "Mindful Moments", "Progress Notes", "Daily Wins",
];

const promptSuggestions = [
  "What am I grateful for today?",
  "What challenged me today and how did I grow?",
  "Describe a moment that made me smile today.",
  "What's one thing I learned about myself?",
  "How did I show kindness today?",
  "What am I looking forward to?",
];

const moodOptions = [
  { value: 1, emoji: "😢", label: "Very Bad", color: "bg-red-100 border-red-300 dark:bg-red-950/30 dark:border-red-800" },
  { value: 2, emoji: "😕", label: "Bad", color: "bg-orange-100 border-orange-300 dark:bg-orange-950/30 dark:border-orange-800" },
  { value: 3, emoji: "😐", label: "Okay", color: "bg-yellow-100 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-800" },
  { value: 4, emoji: "😊", label: "Good", color: "bg-green-100 border-green-300 dark:bg-green-950/30 dark:border-green-800" },
  { value: 5, emoji: "😄", label: "Great", color: "bg-blue-100 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800" },
];

export default function JournalEntryScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const { createEntry, updateEntry, getEntryById } = useJournal();
  const { id } = useLocalSearchParams();

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [mood, setMood] = React.useState<number | null>(null);
  const [tags, setTags] = React.useState<string[]>([]);
  const [newTag, setNewTag] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [existingEntry, setExistingEntry] = React.useState<JournalEntry | null>(null);
  const [showTitleSuggestions, setShowTitleSuggestions] = React.useState(false);
  const [showPrompts, setShowPrompts] = React.useState(false);

  const richTextRef = React.useRef<RichEditor>(null);

  React.useEffect(() => {
    if (id && typeof id === "string") {
      loadExistingEntry(id);
    }
  }, [id]);

  const loadExistingEntry = async (entryId: string) => {
    try {
      const entry = await getEntryById(entryId);
      if (entry) {
        setExistingEntry(entry);
        setTitle(entry.title || "");
        setContent(entry.content);
        setMood(entry.mood);
        if (entry.tags) {
          setTags(JSON.parse(entry.tags));
        }
        setTimeout(() => {
          richTextRef.current?.setContentHTML(entry.content);
        }, 100);
      }
    } catch (error) {
      console.error("Failed to load entry:", error);
      Alert.alert("Error", "Failed to load the journal entry.");
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  const handleSave = async () => {
    const cleanContent = stripHtml(content);
    if (!cleanContent.trim()) {
      Alert.alert("Content Required", "Please write something before saving.");
      return;
    }

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      
      const entryData = {
        date: today,
        title: title.trim() || null,
        content: content.trim(),
        mood,
        tags: tags.length > 0 ? JSON.stringify(tags) : null,
        isPrivate: false,
      };

      if (existingEntry) {
        await updateEntry(existingEntry.id, entryData);
      } else {
        await createEntry(entryData);
      }

      router.push("/(tabs)/journal");
    } catch (error) {
      Alert.alert("Error", "Failed to save entry. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTitleSuggestion = (suggestion: string) => {
    setTitle(suggestion);
    setShowTitleSuggestions(false);
  };

  const handlePromptSuggestion = (prompt: string) => {
    richTextRef.current?.insertHTML(`<br><br><strong>${prompt}</strong><br><br>`);
    setShowPrompts(false);
    setTimeout(() => {
      richTextRef.current?.focusContentEditor();
    }, 100);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const wordCount = stripHtml(content).split(/\s+/).filter(word => word.length > 0).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkColorScheme ? '#1a1a1a' : '#ffffff' }}>
      <LinearGradient
        colors={
          isDarkColorScheme
            ? ["#1a1a1a", "#0f0f0f"]
            : ["#ffffff", "#f8fafc"]
        }
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={{ 
            paddingHorizontal: 24, 
            paddingTop: 24, 
            paddingBottom: 16, 
            borderBottomWidth: 1, 
            borderBottomColor: isDarkColorScheme ? '#374151' : '#e5e7eb' 
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => router.push("/(tabs)/journal")} style={{ padding: 8, marginLeft: -8 }}>
                <X className="w-6 h-6 text-foreground" />
              </TouchableOpacity>
              
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '600', 
                color: isDarkColorScheme ? '#f9fafb' : '#111827' 
              }}>
                {existingEntry ? "Edit Entry" : "New Entry"}
              </Text>
              
              <TouchableOpacity
                onPress={handleSave}
                disabled={isLoading || !stripHtml(content).trim()}
                style={{
                  backgroundColor: '#3b82f6',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 6,
                  opacity: (isLoading || !stripHtml(content).trim()) ? 0.5 : 1
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '500' }}>
                  {isLoading ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ padding: 24 }}>
              {/* Encouraging Message */}
              <View style={{
                backgroundColor: isDarkColorScheme ? '#065f4620' : '#dcfce730',
                borderRadius: 8,
                padding: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: isDarkColorScheme ? '#065f46' : '#dcfce7'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                  <Text style={{ 
                    color: isDarkColorScheme ? '#f9fafb' : '#111827', 
                    flex: 1, 
                    lineHeight: 20 
                  }}>
                    Take your time. Every word you write is a step toward understanding yourself better.
                  </Text>
                </View>
              </View>

              {/* Title Section */}
              <View style={{
                backgroundColor: isDarkColorScheme ? '#374151' : '#f9fafb',
                borderRadius: 8,
                padding: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: isDarkColorScheme ? '#4b5563' : '#e5e7eb'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ 
                    color: isDarkColorScheme ? '#9ca3af' : '#6b7280', 
                    fontSize: 12, 
                    fontWeight: '500', 
                    letterSpacing: 0.5 
                  }}>
                    TITLE (OPTIONAL)
                  </Text>
                  <TouchableOpacity onPress={() => setShowTitleSuggestions(!showTitleSuggestions)}>
                    <Text style={{ color: '#3b82f6', fontSize: 12 }}>Suggestions</Text>
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="What's on your mind today?"
                  placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
                  style={{
                    fontSize: 20,
                    fontWeight: '500',
                    padding: 16,
                    backgroundColor: isDarkColorScheme ? '#1f2937' : '#ffffff',
                    borderRadius: 8,
                    color: isDarkColorScheme ? '#f9fafb' : '#111827',
                    borderWidth: 1,
                    borderColor: isDarkColorScheme ? '#374151' : '#d1d5db'
                  }}
                  multiline={false}
                />
                
                {showTitleSuggestions && (
                  <View style={{
                    marginTop: 12,
                    backgroundColor: isDarkColorScheme ? '#1f2937' : '#ffffff',
                    borderRadius: 8,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: isDarkColorScheme ? '#374151' : '#d1d5db'
                  }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      {titleSuggestions.map((suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => handleTitleSuggestion(suggestion)}
                          style={{
                            backgroundColor: isDarkColorScheme ? '#3b82f620' : '#3b82f610',
                            borderRadius: 20,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            marginRight: 8,
                            marginBottom: 8
                          }}
                        >
                          <Text style={{ color: '#3b82f6', fontSize: 12 }}>{suggestion}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Content Section */}
              <View style={{
                backgroundColor: isDarkColorScheme ? '#374151' : '#f9fafb',
                borderRadius: 8,
                padding: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: isDarkColorScheme ? '#4b5563' : '#e5e7eb'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ 
                    color: isDarkColorScheme ? '#9ca3af' : '#6b7280', 
                    fontSize: 12, 
                    fontWeight: '500', 
                    letterSpacing: 0.5 
                  }}>
                    YOUR THOUGHTS
                  </Text>
                  <TouchableOpacity onPress={() => setShowPrompts(!showPrompts)}>
                    <Text style={{ color: '#3b82f6', fontSize: 12 }}>Writing Prompts</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Rich Text Editor with inline styles for compatibility */}
                <View 
                  style={{
                    backgroundColor: isDarkColorScheme ? '#1f2937' : '#ffffff',
                    borderRadius: 8,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: isDarkColorScheme ? '#374151' : '#d1d5db'
                  }}
                >
                  <RichToolbar
                    editor={richTextRef}
                    actions={[
                      actions.setBold,
                      actions.setItalic,
                      actions.setUnderline,
                      actions.heading1,
                      actions.heading2,
                      actions.insertBulletsList,
                      actions.insertOrderedList,
                      actions.blockquote,
                      actions.undo,
                      actions.redo,
                    ]}
                    style={{
                      backgroundColor: isDarkColorScheme ? '#1f2937' : '#ffffff',
                      borderBottomWidth: 1,
                      borderBottomColor: isDarkColorScheme ? '#374151' : '#d1d5db',
                    }}
                    selectedIconTint="#3b82f6"
                  />
                  
                  <RichEditor
                    ref={richTextRef}
                    onChange={setContent}
                    placeholder="Start writing your thoughts..."
                    initialContentHTML={content}
                    style={{
                      backgroundColor: isDarkColorScheme ? '#1f2937' : '#ffffff',
                      minHeight: 200,
                    }}
                    editorStyle={{
                      backgroundColor: isDarkColorScheme ? '#1f2937' : '#ffffff',
                      placeholderColor: isDarkColorScheme ? '#9ca3af' : '#6b7280',
                      contentCSSText: `
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        font-size: 16px;
                        line-height: 1.6;
                        padding: 16px;
                        color: ${isDarkColorScheme ? '#f9fafb' : '#111827'};
                      `,
                    }}
                  />
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <Text style={{ color: isDarkColorScheme ? '#9ca3af' : '#6b7280', fontSize: 12 }}>
                    {wordCount} words
                  </Text>
                  <Text style={{ color: isDarkColorScheme ? '#9ca3af' : '#6b7280', fontSize: 12 }}>
                    {new Date().toLocaleDateString()}
                  </Text>
                </View>

                {showPrompts && (
                  <View style={{
                    marginTop: 12,
                    backgroundColor: isDarkColorScheme ? '#1f2937' : '#ffffff',
                    borderRadius: 8,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: isDarkColorScheme ? '#374151' : '#d1d5db'
                  }}>
                    <Text style={{ 
                      color: isDarkColorScheme ? '#f9fafb' : '#111827', 
                      fontSize: 14, 
                      fontWeight: '500', 
                      marginBottom: 12 
                    }}>
                      Writing Prompts
                    </Text>
                    {promptSuggestions.map((prompt, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handlePromptSuggestion(prompt)}
                        style={{
                          paddingVertical: 12,
                          borderBottomWidth: index < promptSuggestions.length - 1 ? 1 : 0,
                          borderBottomColor: isDarkColorScheme ? '#374151' : '#d1d5db'
                        }}
                      >
                        <Text style={{ color: isDarkColorScheme ? '#f9fafb' : '#111827' }}>{prompt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Mood Section */}
              <View style={{
                backgroundColor: isDarkColorScheme ? '#374151' : '#f9fafb',
                borderRadius: 8,
                padding: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: isDarkColorScheme ? '#4b5563' : '#e5e7eb'
              }}>
                <Text style={{ 
                  color: isDarkColorScheme ? '#9ca3af' : '#6b7280', 
                  fontSize: 12, 
                  fontWeight: '500', 
                  letterSpacing: 0.5,
                  marginBottom: 16
                }}>
                  HOW ARE YOU FEELING?
                </Text>
                
                {/* Mood Buttons */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  {moodOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setMood(mood === option.value ? null : option.value)}
                      style={{
                        width: 52,
                        height: 52,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 26,
                        borderWidth: 2,
                        borderColor: mood === option.value ? '#3b82f6' : (isDarkColorScheme ? '#4b5563' : '#e5e7eb'),
                        backgroundColor: mood === option.value 
                          ? (isDarkColorScheme ? '#3b82f620' : '#3b82f610') 
                          : (isDarkColorScheme ? '#1f2937' : '#ffffff')
                      }}
                    >
                      <Text style={{ 
                        fontSize: mood === option.value ? 24 : 22,
                        lineHeight: mood === option.value ? 28 : 26
                      }}>
                        {option.emoji}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Labels below buttons */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {moodOptions.map((option) => (
                    <View
                      key={`label-${option.value}`}
                      style={{ 
                        width: 52,
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{
                        color: mood === option.value 
                          ? '#3b82f6' 
                          : (isDarkColorScheme ? '#9ca3af' : '#6b7280'),
                        fontSize: 10,
                        textAlign: 'center',
                        fontWeight: mood === option.value ? '500' : '400'
                      }}>
                        {option.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Tags Section */}
              <View style={{
                backgroundColor: isDarkColorScheme ? '#374151' : '#f9fafb',
                borderRadius: 8,
                padding: 16,
                borderWidth: 1,
                borderColor: isDarkColorScheme ? '#4b5563' : '#e5e7eb'
              }}>
                <Text style={{ 
                  color: isDarkColorScheme ? '#9ca3af' : '#6b7280', 
                  fontSize: 12, 
                  fontWeight: '500', 
                  letterSpacing: 0.5,
                  marginBottom: 12
                }}>
                  TAGS (OPTIONAL)
                </Text>
                
                {tags.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                    {tags.map((tag, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => removeTag(tag)}
                        style={{
                          backgroundColor: isDarkColorScheme ? '#3b82f620' : '#3b82f610',
                          borderRadius: 20,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          marginRight: 8,
                          marginBottom: 8,
                          flexDirection: 'row',
                          alignItems: 'center'
                        }}
                      >
                        <Text style={{ color: '#3b82f6', fontSize: 12 }}>#{tag}</Text>
                        <Text style={{ color: '#3b82f6', marginLeft: 4, fontSize: 10 }}>×</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                
                <View style={{ flexDirection: 'row' }}>
                  <TextInput
                    value={newTag}
                    onChangeText={setNewTag}
                    placeholder="Add a tag..."
                    placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
                    style={{
                      flex: 1,
                      color: isDarkColorScheme ? '#f9fafb' : '#111827',
                      padding: 12,
                      backgroundColor: isDarkColorScheme ? '#1f2937' : '#ffffff',
                      borderTopLeftRadius: 8,
                      borderBottomLeftRadius: 8,
                      borderWidth: 1,
                      borderRightWidth: 0,
                      borderColor: isDarkColorScheme ? '#374151' : '#d1d5db'
                    }}
                    onSubmitEditing={addTag}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    onPress={addTag}
                    disabled={!newTag.trim()}
                    style={{
                      backgroundColor: '#3b82f6',
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderTopRightRadius: 8,
                      borderBottomRightRadius: 8,
                      opacity: !newTag.trim() ? 0.5 : 1
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '500' }}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}
