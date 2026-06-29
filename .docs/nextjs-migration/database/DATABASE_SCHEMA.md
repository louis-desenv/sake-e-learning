# Database Schema & Prisma Setup

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// AUTHENTICATION & USER MANAGEMENT
// ============================================================================

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String?  // Nullable for OAuth users
  image     String?  // Profile picture URL
  emailVerified DateTime?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  profile          UserProfile?
  sessions         Session[]
  chatMessages     ChatMessage[]
  userProgress     UserProgress[]
  learningSessions LearningSession[]
  ttsPreferences   TTSPreference?

  @@index([email])
  @@map("users")
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  expires      DateTime
  sessionToken String   @unique
  accessToken  String?  @unique

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  refresh_token_expires_in Int?

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ============================================================================
// USER PROFILES & PREFERENCES
// ============================================================================

model UserProfile {
  id             String   @id @default(cuid())
  userId         String   @unique
  level          EnglishLevel @default(BEGINNER)
  nativeLanguage Language
  goals          LearningGoal[]
  interests      String?  // Free text for interests

  // Learning preferences
  dailyGoalMinutes Int    @default(15)
  preferredVoice   String @default("Zephyr")

  // Avatar settings
  avatarStyle     String? @default("default")
  avatarEnabled   Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

enum EnglishLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

enum Language {
  Spanish
  French
  German
  Italian
  Portuguese
  Japanese
  Korean
  Chinese
  Russian
  Arabic
}

enum LearningGoal {
  CAREER_DEVELOPMENT
  TRAVEL_COMMUNICATION
  DAILY_CONVERSATION
  EXAM_PREPARATION
}

// ============================================================================
// CHAT & CONVERSATION HISTORY
// ============================================================================

model ChatMessage {
  id        String   @id @default(cuid())
  userId    String
  scenario  String?  // Optional: can be null for free chat
  role      String   // 'user' | 'ai' | 'system'
  content   String   @db.Text
  metadata  Json?    // For storing corrections, suggestions, etc.

  // Message analytics
  processingTimeMs Int?
  modelUsed        String?
  timestamp        DateTime @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, scenario])
  @@index([userId, timestamp])
  @@map("chat_messages")
}

model ConversationSession {
  id        String   @id @default(cuid())
  userId    String
  scenario  String?
  mode      ChatMode

  startedAt DateTime @default(now())
  endedAt   DateTime?

  messages  ChatMessage[]

  @@index([userId, startedAt])
  @@map("conversation_sessions")
}

enum ChatMode {
  TEXT
  VOICE_ONLY
  VOICE_WITH_AVATAR
}

// ============================================================================
// SCENARIOS & LEARNING CONTENT
// ============================================================================

model Scenario {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String   @db.Text

  category    ScenarioCategory
  difficulty  EnglishLevel

  // Prompt configuration
  systemPrompt String @db.Text

  // Welcome messages by level
  welcomeMessages Json // Record<EnglishLevel, string[]>

  // Difficulty adaptations
  difficultyAdaptations Json // Record<EnglishLevel, string>

  // Scenario settings
  estimatedDurationMinutes Int
  isPremium               Boolean @default(false)
  isActive                Boolean @default(true)

  // Metadata
  order        Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  userProgress UserProgress[]

  @@index([category, isActive])
  @@index([difficulty])
  @@map("scenarios")
}

enum ScenarioCategory {
  ROLEPLAY
  SPECIALIST
  GRAMMAR
  VOCABULARY
  PRONUNCIATION
  BUSINESS
  TRAVEL
}

// ============================================================================
// LEARNING PROGRESS & ANALYTICS
// ============================================================================

model UserProgress {
  id         String   @id @default(cuid())
  userId     String
  scenarioId String

  // Progress tracking
  completed           Boolean  @default(false)
  completionPercent   Float    @default(0)
  score               Int?     // 0-100
  stars               Int?     // 1-5

  // Time tracking
  totalTimeSpentMs    Int      @default(0)
  lastAccessedAt      DateTime @default(now())
  completedAt         DateTime?

  // Session statistics
  sessionsCompleted   Int      @default(0)
  averageSessionTimeMs Int?

  // Relations
  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  scenario Scenario @relation(fields: [scenarioId], references: [id], onDelete: Cascade)

  @@unique([userId, scenarioId])
  @@index([userId, completed])
  @@index([userId, lastAccessedAt])
  @@map("user_progress")
}

model LearningSession {
  id          String   @id @default(cuid())
  userId      String
  scenarioId  String?

  mode        ChatMode
  durationMs  Int

  // Session metrics
  messagesExchanged Int
  wordsSpoken       Int?
  grammarErrors     Int?
  correctionsMade   Int?

  startedAt   DateTime @default(now())
  endedAt     DateTime?

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, startedAt])
  @@index([userId, scenarioId])
  @@map("learning_sessions")
}

// ============================================================================
// TTS CONFIGURATION
// ============================================================================

model TTSPreference {
  id             String   @id @default(cuid())
  userId         String   @unique

  provider       TTSProvider @default(GOOGLE)
  voiceId        String
  speed          Float      @default(1.0)
  pitch          Float      @default(1.0)

  // Language/accents
  accent         String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("tts_preferences")
}

enum TTSProvider {
  GOOGLE
  ELEVENLABS
  OPENAI
  WEB_SPEECH
}

// ============================================================================
// ACHIEVEMENTS & GAMIFICATION
// ============================================================================

model Achievement {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String
  iconUrl     String?

  criteria    Json     // Unlock criteria
  points      Int

  createdAt DateTime @default(now())

  @@map("achievements")
}

model UserAchievement {
  id             String   @id @default(cuid())
  userId         String
  achievementId  String

  unlockedAt     DateTime @default(now())
  progress       Float    @default(0) // 0-100

  @@unique([userId, achievementId])
  @@index([userId, unlockedAt])
  @@map("user_achievements")
}

// ============================================================================
// STREAKS & DAILY GOALS
// ============================================================================

model DailyActivity {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime @db.Date

  // Activity metrics
  timeSpentMs    Int
  sessionsCount  Int
  messagesSent   Int
  goalsCompleted Int

  createdAt DateTime @default(now())

  @@unique([userId, date])
  @@index([userId, date])
  @@map("daily_activity")
}

model UserStreak {
  id             String   @id @default(cuid())
  userId         String   @unique

  currentStreak  Int      @default(0)
  longestStreak  Int      @default(0)
  lastActiveDate DateTime?

  updatedAt DateTime @updatedAt

  @@map("user_streaks")
}

// ============================================================================
// FEEDBACK & REPORTS
// ============================================================================

model Feedback {
  id        String   @id @default(cuid())
  userId    String?

  type      FeedbackType
  rating    Int?     // 1-5
  message   String?  @db.Text
  metadata  Json?    // Additional context

  createdAt DateTime @default(now())

  @@index([userId, createdAt])
  @@map("feedback")
}

enum FeedbackType {
  BUG_REPORT
  FEATURE_REQUEST
  GENERAL_FEEDBACK
  CONTENT_ISSUE
}
```

---

## Database Setup Instructions

### 1. Install Dependencies

```bash
npm install prisma @prisma/client
npm install -D prisma
```

### 2. Initialize Prisma

```bash
npx prisma init
```

### 3. Set Up Database URL

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/sakae_learning?schema=public"

# For production (Railway, Supabase, etc.)
# DATABASE_URL="postgresql://user:password@host.railway.app:5432/railway?schema=public"
```

### 4. Create Migrations

```bash
npx prisma migrate dev --name init
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Create Prisma Client Singleton

```typescript
// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## Seed Script

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sakae.com' },
    update: {},
    create: {
      email: 'admin@sakae.com',
      name: 'Admin User',
      password: hashedPassword,
      isActive: true,
    },
  });

  console.log('✅ Created admin user');

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@sakae.com' },
    update: {},
    create: {
      email: 'demo@sakae.com',
      name: 'Demo User',
      password: demoPassword,
      isActive: true,
      profile: {
        create: {
          level: 'INTERMEDIATE',
          nativeLanguage: 'Spanish',
          goals: ['CAREER_DEVELOPMENT', 'DAILY_CONVERSATION'],
          interests: 'Technology, Business, Travel',
          dailyGoalMinutes: 20,
          preferredVoice: 'Zephyr',
        },
      },
    },
  });

  console.log('✅ Created demo user');

  // Create scenarios
  const scenarios = [
    {
      slug: 'job-interview',
      name: 'Job Interview Practice',
      description: 'Practice common interview questions and improve your professional communication skills.',
      category: 'ROLEPLAY',
      difficulty: 'INTERMEDIATE',
      systemPrompt: 'You are a professional job interviewer conducting an interview...',
      welcomeMessages: {
        BEGINNER: ['Hello! Tell me about yourself.', 'What brings you here today?'],
        INTERMEDIATE: ['Welcome! Let\'s start with your background.', 'Tell me about your experience.'],
        ADVANCED: ['Good morning! Let\'s dive into your qualifications.', 'Walk me through your resume.'],
      },
      difficultyAdaptations: {
        BEGINNER: 'Use simple language and short sentences. Provide gentle corrections.',
        INTERMEDIATE: 'Use professional vocabulary with occasional explanations.',
        ADVANCED: 'Use industry-specific terminology and complex sentence structures.',
      },
      estimatedDurationMinutes: 15,
      order: 1,
    },
    {
      slug: 'travel-conversation',
      name: 'Travel Conversations',
      description: 'Practice essential travel situations like booking hotels, asking directions, and ordering food.',
      category: 'TRAVEL',
      difficulty: 'BEGINNER',
      systemPrompt: 'You are a helpful local assistant for travelers...',
      welcomeMessages: {
        BEGINNER: ['Hello! Where are you going today?', 'How can I help you?'],
        INTERMEDIATE: ['Welcome! What\'s your destination?', 'What kind of assistance do you need?'],
        ADVANCED: ['Good day! Are you looking for recommendations?', 'What brings you to this area?'],
      },
      difficultyAdaptations: {
        BEGINNER: 'Use basic travel vocabulary. Speak slowly and clearly.',
        INTERMEDIATE: 'Use common travel phrases with some cultural context.',
        ADVANCED: 'Use idiomatic expressions and cultural nuances.',
      },
      estimatedDurationMinutes: 10,
      order: 2,
    },
    {
      slug: 'business-meeting',
      name: 'Business Meetings',
      description: 'Practice professional business communication for meetings, presentations, and negotiations.',
      category: 'BUSINESS',
      difficulty: 'ADVANCED',
      systemPrompt: 'You are a business professional in a formal meeting...',
      welcomeMessages: {
        BEGINNER: ['Hello. Let\'s start the meeting.', 'What\'s on the agenda?'],
        INTERMEDIATE: ['Good morning. Thank you for joining.', 'Let\'s review today\'s topics.'],
        ADVANCED: ['Welcome everyone. Let\'s get started with today\'s agenda.', 'I\'d like to begin with our quarterly review.'],
      },
      difficultyAdaptations: {
        BEGINNER: 'Use simple business terms. Avoid idioms.',
        INTERMEDIATE: 'Use professional language with standard business expressions.',
        ADVANCED: 'Use sophisticated business vocabulary and industry jargon.',
      },
      estimatedDurationMinutes: 20,
      order: 3,
    },
  ];

  for (const scenario of scenarios) {
    await prisma.scenario.upsert({
      where: { slug: scenario.slug },
      update: {},
      create: scenario,
    });
  }

  console.log('✅ Created scenarios');

  // Create achievements
  const achievements = [
    {
      slug: 'first-conversation',
      name: 'First Steps',
      description: 'Complete your first conversation',
      iconUrl: '/achievements/first-steps.png',
      criteria: { conversations: 1 },
      points: 10,
    },
    {
      slug: 'week-streak',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      iconUrl: '/achievements/week-streak.png',
      criteria: { streakDays: 7 },
      points: 50,
    },
    {
      slug: 'conversation-master',
      name: 'Conversation Master',
      description: 'Complete 50 conversations',
      iconUrl: '/achievements/conversation-master.png',
      criteria: { conversations: 50 },
      points: 100,
    },
    {
      slug: 'grammar-expert',
      name: 'Grammar Expert',
      description: 'Complete all grammar scenarios',
      iconUrl: '/achievements/grammar-expert.png',
      criteria: { grammarScenarios: true, completed: true },
      points: 75,
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      update: {},
      create: achievement,
    });
  }

  console.log('✅ Created achievements');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 7. Add Seed Script to package.json

```json
{
  "scripts": {
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset"
  }
}
```

### 8. Run Seed

```bash
npm run db:seed
```

---

## Common Database Queries

### User Queries

```typescript
// Get user with profile
const getUserWithProfile = (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
    },
  });
};

// Update user profile
const updateUserProfile = (userId: string, data: Partial<UserProfile>) => {
  return prisma.userProfile.update({
    where: { userId },
    data,
  });
};

// Get user's learning progress
const getUserProgress = (userId: string) => {
  return prisma.userProgress.findMany({
    where: { userId },
    include: {
      scenario: true,
    },
    orderBy: { lastAccessedAt: 'desc' },
  });
};
```

### Chat Queries

```typescript
// Get chat history for a scenario
const getChatHistory = (userId: string, scenario: string) => {
  return prisma.chatMessage.findMany({
    where: { userId, scenario },
    orderBy: { timestamp: 'asc' },
    take: 100,
  });
};

// Save chat message
const saveChatMessage = (data: {
  userId: string;
  scenario: string;
  role: string;
  content: string;
  metadata?: any;
}) => {
  return prisma.chatMessage.create({
    data,
  });
};

// Get recent conversations
const getRecentConversations = (userId: string, limit = 10) => {
  return prisma.conversationSession.findMany({
    where: { userId },
    include: {
      messages: {
        take: 1,
        orderBy: { timestamp: 'desc' },
      },
    },
    orderBy: { startedAt: 'desc' },
    take: limit,
  });
};
```

### Learning Analytics

```typescript
// Get daily activity
const getDailyActivity = (userId: string, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return prisma.dailyActivity.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    orderBy: { date: 'desc' },
  });
};

// Calculate streak
const calculateStreak = async (userId: string) => {
  const streak = await prisma.userStreak.findUnique({
    where: { userId },
  });

  if (!streak) {
    return prisma.userStreak.create({
      data: { userId, currentStreak: 1, longestStreak: 1, lastActiveDate: new Date() },
    });
  }

  const lastActive = streak.lastActiveDate;
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return streak; // Same day, no change
  } else if (diffDays === 1) {
    // Consecutive day
    return prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: { increment: 1 },
        longestStreak: { increment: 1 },
        lastActiveDate: today,
      },
    });
  } else {
    // Streak broken
    return prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: 1,
        lastActiveDate: today,
      },
    });
  }
};

// Get learning statistics
const getLearningStats = (userId: string) => {
  return prisma.learningSession.aggregate({
    where: { userId },
    _sum: {
      durationMs: true,
      messagesExchanged: true,
    },
    _count: true,
  });
};
```

---

## Database Backup & Migration

### Backup Script

```typescript
// scripts/backup-db.ts
import { execSync } from 'child_process';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.sql`;

  console.log('📦 Creating database backup...');

  // Dump database
  execSync(
    `pg_dump ${process.env.DATABASE_URL} > ${filename}`,
    { stdio: 'inherit' }
  );

  console.log('✅ Database dumped');

  // Upload to S3
  const file = require('fs').readFileSync(filename);
  await s3.send(
    new PutObjectCommand({
      Bucket: 'sakae-backups',
      Key: filename,
      Body: file,
    })
  );

  console.log('✅ Backup uploaded to S3');

  // Clean up
  execSync(`rm ${filename}`);
}

backupDatabase().catch(console.error);
```

### Migration Best Practices

```typescript
// When changing schema:

// 1. Create migration
npx prisma migrate dev --name add_user_streaks

// 2. Test migration in development
npx prisma migrate reset

// 3. Generate production migration
npx prisma migrate deploy

// 4. Never edit migration files manually
// 5. Always commit migration files to git
// 6. Rollback if needed
npx prisma migrate resolve --rolled-back [migration-name]
```

---

This comprehensive database setup provides a solid foundation for your e-learning platform with proper relationships, indexes, and scalability considerations.
