# SelfSync - Personal Wellness Tracker

A comprehensive mobile wellness application built with React Native and Expo, designed to help users track their mental health, habits, and personal growth journey.

## 🌟 Overview

SelfSync is a personal wellness companion that empowers users to monitor their daily mood, track healthy habits, manage addiction recovery, and maintain a personal journal. The app focuses on building self-awareness and promoting positive mental health through consistent tracking and reflection.

## ✨ Features

### Core Tracking

- **Mood Tracking** - Log daily emotions with detailed context, tags, and notes
- **Habit Monitoring** - Track healthy habits and build positive streaks
- **Addiction Recovery** - Log urges, resistance wins, and maintain sobriety streaks
- **Journal Entries** - Capture daily thoughts and reflections
- **Sleep Logging** - Monitor sleep patterns and quality

### Smart Analytics

- **Wellness Score** - Dynamic scoring based on mood, sleep, and habit completion
- **Streak Tracking** - Visual streak counters for different behaviors
- **Trend Analysis** - Mood trends and progress insights
- **Daily Dashboard** - Real-time overview of your wellness journey

### User Experience

- **Dark & Light Mode** - Seamless theme switching with system preference support
- **Personalized Interface** - Customized greetings and motivational messages
- **Offline-First** - Local SQLite database for privacy and offline functionality
- **Beautiful UI** - Built with NativeWind v4 and modern design principles

## 🛠 Technical Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **Database**: SQLite with expo-sqlite
- **Navigation**: Expo Router
- **Icons**: Custom SVG icon system
- **State Management**: React hooks and context

## 📱 Screens

- **Home Dashboard** - Wellness score, quick actions, and daily progress
- **Mood Check** - Comprehensive mood logging with tags and context
- **Habit Tracker** - Habit completion and streak management
- **Addiction Log** - Urge tracking and resistance logging
- **Journal** - Daily reflection and thought capture
- **Insights** - Analytics and trend visualization

## 🏗 Project Structure

```
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home dashboard
│   │   ├── mood-check.tsx # Mood tracking
│   │   ├── habits-log.tsx # Habit management
│   │   ├── addiction-log.tsx # Addiction tracking
│   │   ├── journal.tsx    # Journal entries
│   │   └── insights.tsx   # Analytics
├── components/            # Reusable UI components
│   └── ui/               # Base UI components
├── lib/                  # Core utilities and services
│   ├── database/         # SQLite database layer
│   │   ├── services/     # Database service classes
│   │   └── types.ts      # Database type definitions
│   ├── hooks/            # Custom React hooks
│   ├── icons/            # SVG icon components
│   └── utils/            # Utility functions
└── assets/               # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for testing)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd selfSync
```

2. Install dependencies:

```bash
yarn install
```

3. Start the development server:

```bash
yarn dev
```

## 💾 Database Schema

The app uses a local SQLite database with the following comprehensive schema:

### Core Tracking Tables

- `sleep_logs` - Sleep duration, quality, bedtime/wake time tracking
- `mood_logs` - Daily mood entries with energy, stress levels, and context
- `addiction_logs` - Urge tracking, resistance logging, and recovery events
- `journal_entries` - Personal reflections with mood tags and privacy settings

### Habit & Behavior Management

- `healthy_habits` - Habit definitions with categories and target frequencies
- `habit_completions` - Daily habit completion tracking with difficulty ratings
- `streaks` - Streak counters for sleep, mood, addiction recovery, and habits

### Support & Insights

- `crisis_resources` - Emergency contacts and support resources
- `ai_insights` - AI-generated wellness insights and recommendations
- `resistance_metrics` - Detailed addiction resistance tracking and analytics

### System Configuration

- `app_settings` - User preferences, theme settings, and app configuration

### Indexes & Performance

- Optimized indexes on date, timestamp, and behavior type fields
- Foreign key constraints for data integrity
- Efficient querying for dashboard and analytics features

## 🎨 Design Philosophy

- **Privacy-First**: All data stored locally, no cloud sync required
- **Positive Reinforcement**: Encouraging messages and celebration of progress
- **Simplicity**: Clean, intuitive interface focused on ease of use
- **Accessibility**: Designed with accessibility best practices
- **Customization**: Adaptable to individual wellness journeys

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.
