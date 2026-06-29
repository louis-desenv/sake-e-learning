# Database Documentation - Next.js 15

Complete database schema and design for Next.js 15 migration.

## 📁 Contents

### [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
**Complete Prisma schema and database design**

**Contents:**
- Complete Prisma schema with all models
- User management and authentication tables
- Chat history and conversation tracking
- Learning progress and analytics
- Achievements and gamification
- Seed scripts for initial data
- Common database queries
- Backup and migration strategies

---

## 🗄️ Database Models

### Core Models

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  level         Level     @default(BEGINNER)
  xp            Int       @default(0)
  // ...
}

model ChatMessage {
  id          String   @id @default(cuid())
  scenarioId  String
  userId      String
  content     String
  role        MessageRole
  // ...
}

model Scenario {
  id          String   @id @default(cuid())
  title       String
  difficulty  Difficulty
  topic       String
  // ...
}
```

### Key Tables

- **User** - User profiles and authentication
- **Account** - OAuth accounts
- **Session** - User sessions
- **Scenario** - Chat scenarios
- **ChatMessage** - Message history
- **LearningProgress** - User progress tracking
- **Achievement** - Gamification

---

## 🔧 Database Setup

### Initial Setup

```bash
# Install Prisma
npm install prisma @prisma/client

# Initialize Prisma
npx prisma init

# Generate client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed
```

### Development

```bash
# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# Create migration
npx prisma migrate dev --name add_user_preferences
```

---

## 📊 Schema Highlights

### User Management
- Authentication with NextAuth.js
- OAuth providers (Google, GitHub)
- User levels and XP system
- Learning preferences

### Chat System
- Message history
- Scenario tracking
- Conversation threads
- Real-time state

### Learning Features
- Progress tracking
- Achievement system
- Analytics and insights
- Personalized recommendations

---

## 🔗 Integration

### With NextAuth.js

```typescript
// lib/auth.ts
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // OAuth providers
  ],
};
```

### With Server Components

```typescript
// app/scenarios/page.tsx
import { prisma } from "@/lib/prisma";

export default async function ScenariosPage() {
  const scenarios = await prisma.scenario.findMany();
  return <ScenarioList scenarios={scenarios} />;
}
```

### With Server Actions

```typescript
// app/actions/chat.ts
'use server';

import { prisma } from "@/lib/prisma";

export async function sendMessage(message: string) {
  await prisma.chatMessage.create({
    data: { content: message },
  });
}
```

---

## 📈 Performance

### Indexed Fields

```prisma
model ChatMessage {
  id         String   @id @default(cuid())
  scenarioId String
  userId     String
  createdAt  DateTime @default(now())

  @@index([scenarioId])
  @@index([userId])
  @@index([scenarioId, createdAt])
}
```

### Query Optimization

- Use indexes for frequent queries
- Select only needed fields
- Use cursor-based pagination
- Implement query result caching

---

## 🔒 Security

### Best Practices

- Input validation with Zod
- SQL injection prevention (Prisma handles this)
- Row-level security
- Environment variable protection
- Regular backups

---

## 📖 Usage

When working with the database:

1. Review [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete schema
2. Use Prisma Client for queries
3. Create migrations for schema changes
4. Test with Prisma Studio locally
5. Backup before production changes

---

**[← Back to Migration README](../README.md)**
