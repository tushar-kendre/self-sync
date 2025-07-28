Here’s the **final, fully enhanced Software Design Document (SDD)** for your **SelfSync app**, now with **GenAI-powered insights** and a **strong focus on breaking harmful habits, building healthy routines, and reinforcing self-awareness**.

---

# **SelfSync – Software Design Document (SDD)**

**Platform:** React Native (iOS & Android)
**Storage:** Local (SQLite + AsyncStorage)
**AI:** Optional GenAI layer for insights and recommendations (privacy-first).
**User:** Single-user (You).

---

## **1. Purpose**

SelfSync is designed as your **personal life tracker, reflection journal, and habit coach** to help you break negative behaviors (e.g., porn, binge-watching, doomscrolling, nicotine/weed), while building healthy habits like studying, better sleep, exercise, and emotional regulation. The app uses **positive reinforcement** and **AI-generated insights** to guide you toward self-mastery.

---

## **2. Scope**

* Track daily behaviors: sleep, screen time, urges, substance use, study, and custom habits.
* Journal with mood tracking and AI-assisted reflection.
* Visual dashboards to reveal progress trends.
* Gamification via streaks, milestones, and positive nudges.
* **AI insights** to analyze journals, detect hidden patterns, and suggest strategies.

---

## **3. Core Features**

| ID  | Feature                    | Description                                                              |
| --- | -------------------------- | ------------------------------------------------------------------------ |
| F1  | **Daily Check-In**         | One screen for wake/sleep, study, mood, journaling, urges, and habits.   |
| F2  | **Addiction Tracking**     | Track porn, binge-watching, reels/doomscrolling, nicotine, and weed.     |
| F3  | **Urge Logging**           | Record urges (resisted or not) with triggers and emotions.               |
| F4  | **Healthy Habits Tracker** | Track positive habits (e.g., exercise, reading, meditation).             |
| F5  | **Study Tracker**          | Log study sessions, topics, and productivity ratings.                    |
| F6  | **Mood & Journal**         | Daily mood rating with optional AI prompt-based journaling.              |
| F7  | **Dashboard & Trends**     | Weekly charts for mood, urges, habits, and progress.                     |
| F8  | **Reminders & Nudges**     | Smart reminders for logging, reflection, or study sessions.              |
| F9  | **Streaks & Milestones**   | Visual streaks and celebratory badges for clean days and goals achieved. |
| F10 | **AI Insight Engine**      | Personalized summaries, mood analysis, and pattern detection (optional). |
| F11 | **Data Export**            | Export all logs/journals as JSON or CSV.                                 |
| F12 | **Crisis Support**         | Emergency resources, panic button, and safety planning tools.            |
| F13 | **Voice Journaling**       | Audio journaling with sentiment analysis and transcription.              |
| F14 | **Real-time Coping**       | Immediate coping strategies when logging urges or distress.              |

---

## **4. Positive Reinforcement & AI Feedback**

| ID | Feature                  | Description                                                        |
| -- | ------------------------ | ------------------------------------------------------------------ |
| M1 | **Streak Counter**       | Tracks days free of harmful behaviors, shown prominently.          |
| M2 | **“Win of the Day”**     | Highlights the strongest positive action each day.                 |
| M3 | **AI Weekly Summary**    | “You studied 3 times this week and slept better after clean days.” |
| M4 | **Behavior Correlation** | AI finds trends like “Low mood days often follow doomscrolling.”   |
| M5 | **Journal Highlights**   | AI extracts key emotional themes from your writing.                |
| M6 | **Daily Nudge Screen**   | Motivational AI quotes or personalized encouragement.              |
| M7 | **Positive Habit Score** | Weekly score combining study, sleep, and exercise improvements.    |

---

## **5. AI Insights Layer**

**Purpose:** Turn raw logs and journals into actionable self-awareness.

**Key AI Use Cases:**

* Summarize weekly patterns: sleep, urges, mood, and study correlations.
* Analyze journal entries to detect stressors and improvements.
* Provide *conversational feedback* like:
  *“This week, your productivity was highest on days you woke before 8 AM and avoided reels.”*

**Tech Options:**

* **Local AI:** Lightweight model (e.g., DistilBERT or TinyLLaMA via `transformers.js`) for offline sentiment & topic analysis.
* **Cloud AI:** GPT-4o or Claude for deep weekly insights (with user approval).

---

## **6. Data Model**

### `DailyLogs`

```ts
{
  id: string,
  date: string,
  wakeTime: string,
  sleepTime: string,
  sleepHours: number,
  sleepQuality: number,    // 1–5 rating
  energyLevel: number,     // 1–5 rating
  mood: number,            // 1–5
  journal: string | null,
  studyMinutes: number,
  studyFocus: number,      // 1–5 productivity rating
  healthyHabits: string[], // list of completed habits
  urgesResisted: number,
  urgesGiven: number,
  triggers: string[],      // What caused urges/relapses
  environment: string,     // home, work, social, etc.
  stressLevel: number,     // 1–5 rating
  isEncrypted: boolean     // For sensitive journal entries
}
```

### `BehaviorLogs`

```ts
{
  id: string,
  date: string,
  type: 'porn' | 'reels' | 'binge' | 'smoke' | 'weed' | 'internet',
  durationMinutes: number,
  trigger: string | null,
  moodBefore: number,
  moodAfter: number,
  wasResisted: boolean,
  urgeIntensity: number,   // 1-10 scale
  copingStrategy: string | null,
  timestamp: string,       // exact time of urge/behavior
  location: string | null
}
```

### `HealthyHabits`

```ts
{
  id: string,
  name: string,
  date: string,
  completed: boolean,
  difficulty: number,      // 1-5 scale
  timeSpent: number | null // minutes spent on habit
}
```

### `CrisisResources`

```ts
{
  id: string,
  name: string,
  type: 'hotline' | 'chat' | 'emergency' | 'therapist',
  contact: string,
  isActive: boolean,
  priority: number         // ordering for emergency situations
}
```

---

## **7. Screens Overview**

1. **Home Screen**

   * Today’s streaks, win of the day, quick log buttons (e.g., “Log Urge”).
   * Morning motivational quote (AI-powered).

2. **Log Day**

   * Wake/sleep times, study, urges, positive habits.

3. **Addiction Tracker**

   * View logs for porn, reels, bingeing, nicotine/weed.

4. **Journal**

   * Mood picker (1–5), journal text box, optional AI writing prompt.

5. **Dashboard & Insights**

   * AI-generated weekly summary, charts for mood, urges, study, habits.

6. **Healthy Habits Screen**

   * Track & manage custom habits like exercise, reading.

7. **Settings**

   * Reminders, AI toggle, data export, PIN lock.

---

## **8. Visual Feedback**

* **Mood & Urge Trends:** Line graphs over 7/30 days.
* **Clean Streaks:** Timeline + current streak highlight.
* **Study Time Chart:** Weekly bar chart.
* **Habit Heatmap:** Calendar view of habit completions.
* **AI Insights Card:** “Your longest clean streak was 7 days — can you beat that?”

---

## **9. Notifications**

* **Morning:** “Set your intention for the day.”
* **Night:** “Reflect on today: mood & urges?”
* **Smart AI Reminder:** “You’ve been on reels for 30 min — is it intentional?”
* **Milestone Alerts:** “3 days clean from binge-watching — huge progress!”

---

## **10. Architecture Overview**

```
React Native App
  │
  ├── State Layer (React Context + Hooks)
  │
  ├── Local Database (SQLite) + Settings (AsyncStorage)
  │
  ├── AI Insight Layer (Local NLP or Cloud LLM)
  │
  └── UI Components (Charts, Streaks, Journal, etc.)
```

---

## **11. Folder Structure**

```
/SelfSync
├── /components
│   ├── StreakCard.tsx
│   ├── AIInsightCard.tsx
│   ├── MoodPicker.tsx
│   ├── CrisisButton.tsx
│   └── CopingStrategies.tsx
├── /screens
│   ├── Home.tsx
│   ├── Journal.tsx
│   ├── Dashboard.tsx
│   ├── Habits.tsx
│   ├── AddictionTracker.tsx
│   └── CrisisSupport.tsx
├── /services
│   ├── db.ts
│   ├── aiInsights.ts
│   ├── notifications.ts
│   ├── encryption.ts
│   └── crisisDetection.ts
├── /utils
│   ├── analytics.ts
│   ├── backup.ts
│   └── validation.ts
└── App.tsx
```

---

## **12. Privacy & Security**

* All data local by default.
* **End-to-end encryption** for journal entries and sensitive data.
* AI analysis is **offline unless you explicitly allow cloud calls**.
* **Local data anonymization** before any AI processing.
* Optional PIN/biometric lock with **panic button** for quick hide/lock.
* **Data retention policies** (auto-delete old entries after configurable period).
* Optional encrypted export for backup.
* **Crisis detection** keywords with immediate resource suggestions.

---

## **13. Future Enhancements**

* AI “conversational coach” mode (chat with your patterns).
* Voice journaling with sentiment analysis.
* Dopamine detox timer (track screen-free blocks).
* Lightweight habit challenges (e.g., “3-day clean challenge”).

---

### **Would you like me to draft an MVP plan next?**

I can outline a **3-phase build roadmap** (core tracking → AI insights → gamified habits) so you can start coding the minimal version in React Native and grow it step by step.
