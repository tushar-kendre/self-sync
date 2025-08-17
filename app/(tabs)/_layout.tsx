import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useColorScheme } from "~/lib/useColorScheme";
import {
  Home,
  AlertTriangle,
  CheckCircle,
  Smile,
  BarChart3,
  Menu,
  MoonStar,
  BookOpen,
} from "lucide-react-native";

export default function TabLayout() {
  const { isDarkColorScheme } = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDarkColorScheme ? "#ffffff" : "#000000",
        tabBarInactiveTintColor: isDarkColorScheme ? "#666666" : "#999999",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDarkColorScheme ? "#1f1f1f" : "#ffffff",
          borderTopColor: isDarkColorScheme ? "#333333" : "#e5e5e5",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mood-check"
        options={{
          title: "Mood",
          tabBarIcon: ({ color, size }) => <Smile size={size} color={color} />,
        }}
      />
      {/* Sleep moved under More tab */}
      <Tabs.Screen
        name="sleep-log"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="addiction-log"
        options={{
          title: "Addiction Log",
          tabBarIcon: ({ color, size }) => (
            <AlertTriangle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="habits-log"
        options={{
          title: "Habits",
          tabBarIcon: ({ color, size }) => (
            <CheckCircle size={size} color={color} />
          ),
        }}
      />
      {/* Journal moved under More tab */}
      <Tabs.Screen
        name="journal"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => <Menu size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
