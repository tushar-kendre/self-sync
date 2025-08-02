import React from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import * as Haptics from 'expo-haptics';
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { Text } from "./text";
import { Moon } from "../../lib/icons/Moon";
import { Sun } from "../../lib/icons/Sun";
import { MoonStar } from "../../lib/icons/MoonStar";

interface TimePickerProps {
  visible: boolean;
  onClose: () => void;
  onTimeSelect: (time: Date) => void;
  initialTime?: Date;
  title: string;
  icon?: "bedtime" | "waketime";
  isDarkColorScheme?: boolean;
}

const { height: screenHeight } = Dimensions.get("window");

export function TimePicker({
  visible,
  onClose,
  onTimeSelect,
  initialTime = new Date(),
  title,
  icon = "bedtime",
  isDarkColorScheme = false,
}: TimePickerProps) {
  const [selectedHour, setSelectedHour] = React.useState(
    initialTime.getHours()
  );
  const [selectedMinute, setSelectedMinute] = React.useState(
    initialTime.getMinutes()
  );

  // Generate arrays for hours and minutes
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const getGradientColors = () => {
    if (icon === "bedtime") {
      return isDarkColorScheme
        ? (["#312e81", "#581c87"] as const)
        : (["#6366f1", "#8b5cf6"] as const);
    } else {
      return isDarkColorScheme
        ? (["#ea580c", "#dc2626"] as const)
        : (["#f97316", "#ef4444"] as const);
    }
  };

  const getEncouragingMessage = () => {
    if (icon === "bedtime") {
      return "🌙 Choose when you went to bed - every hour matters for your wellness!";
    } else {
      return "☀️ Select your wake time - you're tracking your path to better rest!";
    }
  };

  const handleConfirm = () => {
    const newTime = new Date();
    newTime.setHours(selectedHour);
    newTime.setMinutes(selectedMinute);
    newTime.setSeconds(0);
    onTimeSelect(newTime);
    onClose();
  };

  const renderIcon = () => {
    if (icon === "bedtime") {
      return <Moon className="w-8 h-8 text-white" />;
    } else {
      return <Sun className="w-8 h-8 text-white" />;
    }
  };

  const renderScrollPicker = (
    items: number[],
    selectedValue: number,
    onValueChange: (value: number) => void,
    label: string
  ) => {
    const scrollViewRef = React.useRef<ScrollView>(null);
    const itemHeight = 50;
    const lastHapticIndex = React.useRef<number>(-1);
    const isSnapping = React.useRef<boolean>(false);

    React.useEffect(() => {
      if (visible && scrollViewRef.current) {
        // Scroll to selected item when modal opens
        const targetIndex = items.findIndex(item => item === selectedValue);
        if (targetIndex >= 0) {
          lastHapticIndex.current = targetIndex;
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({
              y: targetIndex * itemHeight,
              animated: false,
            });
          }, 100);
        }
      }
    }, [visible]);

    const handleScrollBeginDrag = () => {
      // Cancel any ongoing snap animation when user starts dragging
      isSnapping.current = false;
    };

    const handleScroll = (event: any) => {
      const y = event.nativeEvent.contentOffset.y;
      const currentIndex = Math.round(y / itemHeight);
      const clampedIndex = Math.max(0, Math.min(currentIndex, items.length - 1));
      
      // Trigger haptic feedback when crossing to a new value
      if (clampedIndex !== lastHapticIndex.current) {
        lastHapticIndex.current = clampedIndex;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    };

    const handleMomentumScrollEnd = (event: any) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / itemHeight);
      const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
      
      // Only snap if we're not already in a snapping state
      if (!isSnapping.current) {
        isSnapping.current = true;
        
        // Snap to the nearest item
        scrollViewRef.current?.scrollTo({
          y: clampedIndex * itemHeight,
          animated: true,
        });
        
        // Reset snapping flag after animation completes
        setTimeout(() => {
          isSnapping.current = false;
        }, 300);
      }
      
      onValueChange(items[clampedIndex]);
    };

    return (
      <View className="flex-1">
        <Text className="text-center text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          {label}
        </Text>
        <View className="relative h-[200px] overflow-hidden rounded-xl bg-white/50 dark:bg-gray-900/50">
          {/* Gradient overlays for fade effect */}
          <LinearGradient
            colors={isDarkColorScheme ? ['rgba(17,24,39,0.9)', 'transparent'] : ['rgba(255,255,255,0.9)', 'transparent']}
            className="absolute top-0 left-0 right-0 h-12 z-10 pointer-events-none"
          />
          <LinearGradient
            colors={isDarkColorScheme ? ['transparent', 'rgba(17,24,39,0.9)'] : ['transparent', 'rgba(255,255,255,0.9)']}
            className="absolute bottom-0 left-0 right-0 h-12 z-10 pointer-events-none"
          />
          
          {/* Selection indicator */}
          <View className="absolute top-[75px] left-2 right-2 h-[50px] border-2 border-blue-400 bg-blue-50/30 dark:bg-blue-950/30 rounded-lg z-10 pointer-events-none" />
          
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            snapToInterval={itemHeight}
            snapToAlignment="center"
            decelerationRate="fast"
            contentContainerStyle={{
              paddingVertical: 75, // Center the first and last items
            }}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleMomentumScrollEnd}
          >
            {items.map((item, index) => (
              <TouchableOpacity
                key={`${label}-${item}`}
                onPress={() => {
                  // Add haptic feedback for direct touch
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onValueChange(item);
                  scrollViewRef.current?.scrollTo({
                    y: index * itemHeight,
                    animated: true,
                  });
                }}
                className="justify-center items-center"
                style={{ height: itemHeight }}
                activeOpacity={0.7}
              >
                <Text
                  className="text-xl font-semibold text-gray-600 dark:text-gray-400"
                  style={{
                    transform: [{ scale: item === selectedValue ? 1.1 : 1 }],
                    color: item === selectedValue 
                      ? (isDarkColorScheme ? '#60a5fa' : '#2563eb')
                      : undefined
                  }}
                >
                  {item.toString().padStart(2, "0")}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={80}
        tint={isDarkColorScheme ? "dark" : "light"}
        className="flex-1 justify-center items-center p-6"
      >
        <TouchableOpacity
          className="absolute inset-0"
          onPress={onClose}
          activeOpacity={1}
        />
        
        <Card className="w-full max-w-sm shadow-2xl border-0 overflow-hidden">
          {/* Header */}
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="px-6 py-8"
          >
            <View className="items-center">
              {renderIcon()}
              <Text className="text-xl font-bold text-white mt-3 text-center">
                {title}
              </Text>
              <Text className="text-white/90 text-sm mt-2 text-center">
                {getEncouragingMessage()}
              </Text>
            </View>
          </LinearGradient>

          <CardContent className="p-6">
            {/* Time Display */}
            <View className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl p-4 mb-6">
              <Text className="text-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                Selected Time
              </Text>
              <View className="flex-row items-center justify-center gap-3">
                <View className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-sm">
                  <Text className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                    {selectedHour.toString().padStart(2, "0")}
                  </Text>
                </View>
                <Text className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                  :
                </Text>
                <View className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-sm">
                  <Text className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                    {selectedMinute.toString().padStart(2, "0")}
                  </Text>
                </View>
              </View>
              <Text className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                {new Date(0, 0, 0, selectedHour, selectedMinute).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            {/* Time Pickers */}
            <View className="flex-row gap-4 mb-6">
              {renderScrollPicker(hours, selectedHour, setSelectedHour, "Hour")}
              {renderScrollPicker(minutes, selectedMinute, setSelectedMinute, "Minutes")}
            </View>

            {/* Action Buttons */}
            <View className="gap-4">
              <TouchableOpacity
                onPress={handleConfirm}
                className="shadow-lg rounded-xl overflow-hidden"
                style={{
                  minHeight: 60,
                  shadowColor: "#8b5cf6",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                }}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={getGradientColors()}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ 
                    width: '100%',
                    minHeight: 60,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    borderRadius: 12,
                  }}
                >
                  <View className="flex-row items-center justify-center gap-3">
                    <MoonStar className="w-6 h-6 text-white" />
                    <Text className="text-white font-bold text-lg">
                      Perfect! Use This Time ✨
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <Button
                onPress={onClose}
                variant="outline"
                size="lg"
                className="bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-gray-300 dark:border-gray-600"
                style={{ minHeight: 52 }}
              >
                <Text className="text-center text-gray-700 dark:text-gray-300 font-medium text-lg">
                  Cancel
                </Text>
              </Button>
            </View>

            {/* Encouraging Footer */}
            <View className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg">
              <Text className="text-center text-sm text-green-700 dark:text-green-300 font-medium">
                🌟 You're amazing for tracking your sleep wellness journey!
              </Text>
            </View>
          </CardContent>
        </Card>
      </BlurView>
    </Modal>
  );
}
