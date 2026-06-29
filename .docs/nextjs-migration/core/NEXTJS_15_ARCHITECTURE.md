# Next.js 15 Migration Architecture Plan

## Executive Summary

This document outlines a comprehensive architecture plan for migrating the SAke E-Learning application from React + Vite to Next.js 15 with modern best practices. The plan focuses on leveraging React Server Components, Server Actions, and Next.js 15's latest features while maintaining real-time audio capabilities.

**Current Tech Stack:**
- React 19.2 + TypeScript
- Vite + HashRouter
- Context API for state
- Tailwind CSS v4
- LiveKit + Gemini Live API

**Target Tech Stack:**
- Next.js 15 (App Router)
- React 19 (Server Components)
- TypeScript 5.8
- Tailwind CSS v4
- Modern state management (Zustand + React Query)
- Server Actions for mutations

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Library Recommendations](#2-library-recommendations)
3. [Server vs Client Components Strategy](#3-server-vs-client-components-strategy)
4. [Data Fetching & State Management](#4-data-fetching--state-management)
5. [API Routes & Server Actions](#5-api-routes--server-actions)
6. [Authentication Architecture](#6-authentication-architecture)
7. [Real-Time Features Strategy](#7-real-time-features-strategy)
8. [Performance Optimizations](#8-performance-optimizations)
9. [Migration Phases](#9-migration-phases)
10. [File Organization](#10-file-organization)

---

## 1. Project Structure

### Recommended Next.js 15 App Router Structure

```
sakae-e-learning-v3/
├── app/
│   ├── (auth)/                      # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── google-callback/
│   │   │   └── route.ts             # API route for OAuth
│   │   └── layout.tsx               # Auth layout
│   │
│   ├── (app)/                       # Main app route group
│   │   ├── home/
│   │   │   └── page.tsx
│   │   ├── chat/
│   │   │   ├── text/
│   │   │   │   ├── page.tsx         # Text chat (Server Component)
│   │   │   │   └── [scenario]/
│   │   │   │       └── page.tsx     # Scenario text chat
│   │   │   ├── voice-only/
│   │   │   │   └── page.tsx         # Voice-only (Client Component)
│   │   │   └── with-avatar/
│   │   │       └── page.tsx         # Avatar chat (Client Component)
│   │   ├── guided-learning/
│   │   │   └── page.tsx
│   │   ├── library/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── onboarding/
│   │   │   └── page.tsx
│   │   └── layout.tsx               # Main app layout
│   │
│   ├── api/                         # API Routes
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   ├── refresh/route.ts
│   │   │   └── logout/route.ts
│   │   ├── gemini/
│   │   │   ├── chat/route.ts        # Server Actions for Gemini
│   │   │   └── token/route.ts       # Secure token generation
│   │   ├── livekit/
│   │   │   └── token/route.ts       # LiveKit token generation
│   │   ├── user/
│   │   │   ├── profile/route.ts
│   │   │   └── progress/route.ts
│   │   └── tts/
│   │       └── route.ts             # TTS proxy endpoint
│   │
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Root redirect
│   ├── loading.tsx                  # Global loading
│   ├── error.tsx                    # Global error boundary
│   └── not-found.tsx                # 404 page
│
├── components/
│   ├── ui/                          # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   │
│   ├── chat/
│   │   ├── text-chat-ui.tsx         # Client Component
│   │   ├── voice-chat-ui.tsx        # Client Component
│   │   ├── gemini-voice-chat.tsx    # Client Component
│   │   └── avatar-chat.tsx          # Client Component
│   │
│   ├── audio/
│   │   ├── audio-visualizer.tsx
│   │   ├── practice-mode.tsx
│   │   └── realtime-mode.tsx
│   │
│   ├── layout/
│   │   ├── bottom-nav.tsx
│   │   ├── header.tsx
│   │   ├── page-transition.tsx
│   │   └── home-button.tsx
│   │
│   ├── auth/
│   │   ├── private-route.tsx        # Server Component wrapper
│   │   └── auth-provider.tsx        # Client Component
│   │
│   └── providers/
│       └── providers.tsx            # All providers combined
│
├── lib/
│   ├── auth/
│   │   ├── session.ts               # Session management
│   │   ├── middleware.ts            # Auth middleware
│   │   └── config.ts                # NextAuth config
│   │
│   ├── db/
│   │   ├── prisma.ts                # Prisma client
│   │   └── schema.prisma            # Database schema
│   │
│   ├── api/
│   │   ├── client.ts                # Fetch wrapper
│   │   ├── errors.ts                # Error handling
│   │   └── types.ts                 # API types
│   │
│   ├── services/
│   │   ├── gemini.service.ts
│   │   ├── livekit.service.ts
│   │   ├── tts.service.ts
│   │   ├── openai.service.ts
│   │   └── auth.service.ts
│   │
│   ├── hooks/
│   │   ├── use-gemini-live.ts       # Client hook
│   │   ├── use-livekit-room.ts      # Client hook
│   │   ├── use-audio-visualizer.ts  # Client hook
│   │   └── server/
│   │       ├── use-user.ts          # Server data fetching
│   │       └── use-progress.ts      # Server data fetching
│   │
│   ├── utils/
│   │   ├── audio.ts
│   │   ├── validation.ts
│   │   └── format.ts
│   │
│   ├── store/
│   │   ├── auth.store.ts            # Zustand auth store
│   │   ├── chat.store.ts            # Zustand chat store
│   │   └── user.store.ts            # Zustand user store
│   │
│   └── validators/
│       └── schema.ts                # Zod schemas
│
├── prompts/
│   ├── base/
│   │   └── system-prompt.ts
│   ├── builders/
│   │   └── prompt-builder.ts
│   └── scenarios/
│       ├── business-meeting.ts
│       ├── job-interview.ts
│       └── ...
│
├── types/
│   ├── auth.ts
│   ├── chat.ts
│   ├── user.ts
│   └── index.ts
│
├── public/
│   ├── audio/
│   ├── images/
│   └── icons/
│
├── .env.local                       # Environment variables
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Key Architecture Decisions

**Route Groups:**
- `(auth)` - Authentication pages without layout
- `(app)` - Main application with shared layout

**Parallel Routes (Optional Advanced Feature):**
```typescript
// Future enhancement for split-screen learning
app/(app)/chat/@modal/...
app/(app)/chat/@main/...
```

**Intercepting Routes:**
```typescript
// For modal-based navigation
app/(app)/chat/[...slug]/
app/(app)/library/[...slug]/
```

---

## 2. Library Recommendations

### State Management

**Zustand** (Primary State)
```bash
npm install zustand
```

**Justification:**
- Lightweight (< 3KB)
- No providers needed
- TypeScript-first
- Simple async actions
- Perfect for client-side state (auth session, UI state)

**Example:**
```typescript
// lib/store/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (credentials) => {
        const response = await loginAction(credentials);
        set({ user: response.user, token: response.token, isAuthenticated: true });
      },
      logout: async () => {
        await logoutAction();
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    { name: 'auth-storage' }
  )
);
```

### Server State Management

**TanStack Query (React Query)** v5
```bash
npm install @tanstack/react-query @tanstack/react-query-next-experimental
```

**Justification:**
- Automatic caching and refetching
- Optimistic updates
- Background refetching
- Excellent Next.js 15 integration
- Perfect for server state (user profile, learning progress)

**Example:**
```typescript
// app/(app)/profile/page.tsx
import { useQuery } from '@tanstack/react-query';

async function getUserProfile() {
  const res = await fetch('/api/user/profile');
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export default function ProfilePage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: getUserProfile,
  });

  if (isLoading) return <ProfileSkeleton />;
  return <ProfileView profile={profile} />;
}
```

### Forms

**React Hook Form** + **Zod**
```bash
npm install react-hook-form @hookform/resolvers zod
```

**Justification:**
- Minimal re-renders
- Built-in validation
- TypeScript support
- Works with Server Actions
- Zod for schema validation

**Example:**
```typescript
// components/auth/login-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginAction } from '@/lib/actions/auth.action';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form onSubmit={handleSubmit((data) => loginAction(data))}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      {/* ... */}
    </form>
  );
}
```

### UI Component Library

**Shadcn/ui** (Recommended)
```bash
npx shadcn-ui@latest init
```

**Justification:**
- Copy-paste components (full ownership)
- Built on Radix UI (accessibility)
- Tailwind CSS v4 compatible
- TypeScript-first
- No runtime overhead
- Highly customizable

**Alternative:** NextUI (if you want pre-built components)

### Data Fetching

**For Server Components:** Native `fetch()` with caching
```typescript
// app/(app)/home/page.tsx
async function getScenarios() {
  const res = await fetch('https://api.example.com/scenarios', {
    next: { revalidate: 3600, tags: ['scenarios'] },
  });
  return res.json();
}

export default async function HomePage() {
  const scenarios = await getScenarios();
  return <ScenarioGrid scenarios={scenarios} />;
}
```

**For Client Components:** TanStack Query or SWR

### Authentication

**NextAuth.js** v5 (Auth.js)
```bash
npm install next-auth@beta
```

**Justification:**
- Built for Next.js App Router
- Server Actions support
- OAuth providers (Google)
- JWT and session management
- Middleware integration

**Alternative:** Lucia Auth (lighter, more control)

### Real-Time Communication

**Keep:** LiveKit SDK (already using)
**Add:** WebSocket hook for Gemini Live

```typescript
// lib/hooks/use-gemini-live.ts
'use client';

export function useGeminiLive() {
  const [session, setSession] = useState<LiveSession | null>(null);
  // ... existing logic
}
```

### Utilities

**Date-fns** (date formatting)
```bash
npm install date-fns
```

**clsx** + **tailwind-merge** (conditional classes)
```bash
npm install clsx tailwind-merge
```

**Justification:**
- Standard pattern for conditional classes
- Prevents Tailwind class conflicts

---

## 3. Server vs Client Components Strategy

### Guiding Principles

**Use Server Components by default** (`async` components)
- Better performance (no JS sent to client)
- Direct database access
- Secure token handling
- SEO-friendly

**Use Client Components only when needed** (`'use client'`)
- Browser APIs (MediaRecorder, AudioContext)
- Event handlers (onClick, onChange)
- React hooks (useState, useEffect)
- Real-time features (WebSockets)

### Component Classification

#### Server Components (Default)

```typescript
// app/(app)/chat/text/page.tsx
import { TextChatUI } from '@/components/chat/text-chat-ui';

async function getChatHistory(chatId: string) {
  // Direct database access
  const db = getDb();
  return db.chatHistory.findMany({ where: { chatId } });
}

export default async function TextChatPage({
  params,
}: {
  params: { scenario?: string };
}) {
  const history = await getChatHistory('default');
  const scenarios = await getScenarios();

  return (
    <div className="container">
      <h1>Text Chat</h1>
      <TextChatUI
        initialHistory={history}
        scenarios={scenarios}
        scenario={params.scenario}
      />
    </div>
  );
}
```

**When to use:**
- Data fetching pages
- Static content
- Routes and layouts
- SEO-critical pages

#### Client Components ('use client')

```typescript
// components/chat/gemini-voice-chat.tsx
'use client';

import { useGeminiLive } from '@/lib/hooks/use-gemini-live';
import { useAuthStore } from '@/lib/store/auth.store';

export function GeminiVoiceChat() {
  const { user } = useAuthStore();
  const { isSessionActive, startSession, endSession } = useGeminiLive();

  return (
    <div>
      <button onClick={() => startSession()}>Start</button>
      <button onClick={endSession}>End</button>
    </div>
  );
}
```

**When to use:**
- Real-time audio/video
- Interactive UI (drag & drop)
- Form inputs
- Browser APIs
- Stateful components

### Hybrid Pattern: Server Component + Client Component

```typescript
// app/(app)/chat/voice-only/page.tsx
import { GeminiVoiceChat } from '@/components/chat/gemini-voice-chat';

// Server Component fetches initial data
async function getVoiceConfig() {
  const { user } = await getSession();
  return {
    userName: user.name,
    userLevel: user.level,
    preferredVoice: 'Zephyr',
  };
}

export default async function VoiceOnlyPage() {
  const config = await getVoiceConfig();

  // Pass data to Client Component
  return <GeminiVoiceChat config={config} />;
}
```

### Component Breakdown for SAke

**Server Components:**
- All pages (`app/**/page.tsx`)
- Layouts (`app/**/layout.tsx`)
- Dashboard views
- Learning scenarios list
- Profile view (read-only)
- Settings page

**Client Components:**
- `GeminiVoiceChat` (audio recording)
- `AudioVisualizer` (Web Audio API)
- `BeyAvatar` (real-time animation)
- `TextChatUI` (interactive messaging)
- `BottomNav` (navigation state)
- Login/Register forms
- All chat interfaces

---

## 4. Data Fetching & State Management

### Three-Layer Architecture

#### Layer 1: Server Components (Data Fetching)
```typescript
// app/(app)/home/page.tsx
import { getScenarios, getUserProgress } from '@/lib/api/scenarios';

export default async function HomePage() {
  const [scenarios, progress] = await Promise.all([
    getScenarios(),
    getUserProgress(),
  ]);

  return <HomeDashboard scenarios={scenarios} progress={progress} />;
}
```

#### Layer 2: Server Actions (Mutations)
```typescript
// lib/actions/user.action.ts
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/config';

export async function updateProfile(data: ProfileUpdate) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  // Update database
  await db.user.update({
    where: { id: session.user.id },
    data,
  });

  revalidatePath('/profile');
  return { success: true };
}
```

#### Layer 3: Client State (UI State)
```typescript
// lib/store/chat.store.ts
import { create } from 'zustand';

interface ChatStore {
  isRecording: boolean;
  audioLevel: number;
  setRecording: (recording: boolean) => void;
  setAudioLevel: (level: number) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  isRecording: false,
  audioLevel: 0,
  setRecording: (recording) => set({ isRecording: recording }),
  setAudioLevel: (level) => set({ audioLevel: level }),
}));
```

### Data Fetching Patterns

#### Pattern 1: Server Component with Fetch
```typescript
// lib/api/scenarios.ts
export async function getScenarios() {
  const res = await fetch(`${process.env.API_URL}/scenarios`, {
    next: { revalidate: 3600, tags: ['scenarios'] },
  });
  if (!res.ok) throw new Error('Failed to fetch scenarios');
  return res.json();
}
```

#### Pattern 2: Server Action for Mutations
```typescript
// lib/actions/chat.action.ts
'use server';

export async function sendChatMessage(message: string, scenario: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const response = await geminiService.chat({
    message,
    scenario,
    userId: session.user.id,
  });

  revalidateTag('chat-history');
  return response;
}
```

#### Pattern 3: TanStack Query for Client Data
```typescript
// components/chat/text-chat-ui.tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sendChatMessage } from '@/lib/actions/chat.action';

export function TextChatUI() {
  const queryClient = useQueryClient();

  const { data: messages } = useQuery({
    queryKey: ['chat-messages'],
    queryFn: () => fetch('/api/chat/messages').then(r => r.json()),
  });

  const mutation = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
  });

  return <div>{/* ... */}</div>;
}
```

### Caching Strategy

```typescript
// Next.js Fetch API caching
const data = await fetch(url, {
  next: {
    revalidate: 3600,           // ISR: Revalidate every hour
    tags: ['scenarios'],        // Tag-based revalidation
  },
});

// Manual revalidation
import { revalidatePath, revalidateTag } from 'next/cache';

revalidatePath('/chat/scenarios');
revalidateTag('scenarios');
```

---

## 5. API Routes & Server Actions

### Server Actions (Recommended for Mutations)

**Why Server Actions?**
- No separate API route needed
- Type-safe with TypeScript
- Automatic form handling
- Built-in error handling
- Progressive enhancement

#### Example: Authentication Actions

```typescript
// lib/actions/auth.action.ts
'use server';

import { z } from 'zod';
import { signIn } from '@/lib/auth/config';
import { redirect } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function loginAction(formData: FormData) {
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  try {
    await signIn('credentials', validatedFields.data);
  } catch (error) {
    return { error: 'Invalid credentials' };
  }

  redirect('/home');
}

export async function logoutAction() {
  // NextAuth handles logout
  redirect('/login');
}
```

#### Example: Chat Actions

```typescript
// lib/actions/chat.action.ts
'use server';

import { auth } from '@/lib/auth/config';
import { geminiService } from '@/lib/services/gemini.service';
import { revalidateTag } from 'next/cache';

export async function startVoiceChat(scenario?: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const accessToken = await geminiService.generateToken({
    userId: session.user.id,
    scenario,
  });

  return { accessToken, endpoint: process.env.GEMINI_ENDPOINT };
}

export async function saveChatMessage(role: 'user' | 'ai', content: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  await db.chatMessage.create({
    data: {
      userId: session.user.id,
      role,
      content,
    },
  });

  revalidateTag('chat-history');
}
```

### API Routes (For External Integrations)

#### Example: LiveKit Token Generation

```typescript
// app/api/livekit/token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { livekitService } from '@/lib/services/livekit.service';
import { auth } from '@/lib/auth/config';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomName } = await req.json();

    const token = await livekitService.createToken({
      identity: session.user.id,
      roomName,
    });

    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
```

#### Example: Google OAuth Callback

```typescript
// app/api/auth/callback/google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

export async function GET(req: NextRequest) {
  const session = await auth();
  return NextResponse.redirect(new URL('/home', req.url));
}
```

### Route Handlers vs Server Actions

**Use Route Handlers when:**
- External API integration (webhooks)
- File uploads
- SSE/WebSocket connections
- Public endpoints

**Use Server Actions when:**
- Form submissions
- Database mutations
- Authenticated operations
- UI interactions

---

## 6. Authentication Architecture

### NextAuth.js v5 Configuration

```typescript
// lib/auth/config.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db/prisma';
import { loginSchema } from '@/lib/validators/schema';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const validatedFields = loginSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});
```

### Route Protection with Middleware

```typescript
// middleware.ts
import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
                     req.nextUrl.pathname.startsWith('/register');
  const isPublicPage = req.nextUrl.pathname === '/google-callback';

  if (isPublicPage) {
    return NextResponse.next();
  }

  if (isAuthPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/home', req.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### Server Component Auth Check

```typescript
// app/(app)/profile/page.tsx
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return <ProfileView profile={profile} />;
}
```

### Client Component Auth Hook

```typescript
// lib/hooks/use-auth.ts
'use client';

import { useSession } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
  };
}
```

---

## 7. Real-Time Features Strategy

### LiveKit Integration (Avatar Chat)

```typescript
// lib/services/livekit.service.ts
import { RoomServiceClient } from 'livekit-server-sdk';

const livekitClient = new RoomServiceClient(
  process.env.LIVEKIT_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export const livekitService = {
  async createToken({ identity, roomName }: { identity: string; roomName: string }) {
    const { AccessToken } = await import('livekit-server-sdk');

    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      { identity }
    );

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    return token.toJwt();
  },

  async createRoom(roomName: string) {
    return livekitClient.createRoom({
      name: roomName,
      emptyTimeout: 10 * 60, // 10 minutes
      maxParticipants: 2,
    });
  },
};
```

### Client-Side LiveKit Hook

```typescript
// lib/hooks/use-livekit-room.ts
'use client';

import { Room, RoomEvent } from 'livekit-client';
import { useEffect, useState } from 'react';

export function useLiveKitRoom(token: string, roomName: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const roomInstance = new Room();

    roomInstance
      .connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token)
      .then(() => {
        setIsConnected(true);
        setRoom(roomInstance);
      });

    roomInstance.on(RoomEvent.Disconnected, () => {
      setIsConnected(false);
    });

    return () => {
      roomInstance.disconnect();
    };
  }, [token, roomName]);

  return { room, isConnected };
}
```

### Gemini Live API Integration

```typescript
// lib/services/gemini.service.ts
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const geminiService = {
  async generateToken({ userId, scenario }: { userId: string; scenario?: string }) {
    // Generate JWT token for Gemini Live API
    // This is server-side to keep API key secure
    return {
      token: process.env.GEMINI_API_KEY!,
      endpoint: 'wss://generativelanguage.googleapis.com/ws',
    };
  },

  async chat({ message, scenario, userId }: { message: string; scenario?: string; userId: string }) {
    const model = ai.getGenerativeModel({ model: 'gemini-pro' });

    const systemPrompt = await this.getSystemPrompt(scenario);

    const result = await model.generateMessage([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ]);

    return result.response.text();
  },

  async getSystemPrompt(scenario?: string) {
    if (!scenario) return 'You are a helpful English tutor.';

    // Load scenario-specific prompt
    const { getScenarioConfig } = await import('@/prompts/builders/prompt-builder');
    const config = getScenarioConfig(scenario);
    return config.systemPrompt;
  },
};
```

### WebSocket Hook for Gemini Live

```typescript
// lib/hooks/use-gemini-live.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './use-auth';

interface GeminiLiveOptions {
  onTranscript?: (text: string) => void;
  onAudio?: (audioData: ArrayBuffer) => void;
}

export function useGeminiLive(options: GeminiLiveOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const { user } = useAuth();

  const connect = useCallback(async () => {
    try {
      // Get token from server action
      const response = await fetch('/api/gemini/token', {
        method: 'POST',
        body: JSON.stringify({ userId: user?.id }),
      });

      const { token, endpoint } = await response.json();

      const ws = new WebSocket(`${endpoint}?token=${token}`);

      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => setIsConnected(false);
      ws.onerror = (error) => console.error('WebSocket error:', error);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.transcript) {
          options.onTranscript?.(data.transcript);
        }

        if (data.audio) {
          const audioData = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0));
          options.onAudio?.(audioData.buffer);
        }

        if (data.speaking !== undefined) {
          setIsSpeaking(data.speaking);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  }, [user?.id, options]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'audio',
        data: btoa(String.fromCharCode(...new Uint8Array(audioData))),
      }));
    }
  }, []);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return { isConnected, isSpeaking, connect, disconnect, sendAudio };
}
```

### Audio Visualizer (Client Component)

```typescript
// components/audio/audio-visualizer.tsx
'use client';

import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isSpeaking: boolean;
  audioLevel: number;
  theme?: 'blue' | 'purple';
}

export function AudioVisualizer({ isSpeaking, audioLevel, theme = 'blue' }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 50;
      const barWidth = canvas.width / barCount;

      for (let i = 0; i < barCount; i++) {
        const height = isSpeaking
          ? Math.random() * audioLevel
          : 10;

        const hue = theme === 'blue' ? 200 + i * 2 : 260 + i * 2;

        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.fillRect(
          i * barWidth,
          canvas.height - height,
          barWidth - 2,
          height
        );
      }

      requestAnimationFrame(animate);
    };

    animate();
  }, [isSpeaking, audioLevel, theme]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={100}
      className="w-full h-full"
    />
  );
}
```

---

## 8. Performance Optimizations

### 1. Image Optimization

```typescript
// components/ui/image.tsx
import Image from 'next/image';

export function OptimizedImage({ src, alt, ...props }: ImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      loading="lazy"
      placeholder="blur"
      blurDataURL="/placeholder.jpg"
      {...props}
    />
  );
}
```

### 2. Dynamic Imports (Code Splitting)

```typescript
// app/(app)/chat/with-avatar/page.tsx
import dynamic from 'next/dynamic';

// Lazy load heavy components
const BeyAvatar = dynamic(() => import('@/components/chat/bey-avatar'), {
  loading: () => <AvatarSkeleton />,
  ssr: false, // Browser-only component
});

const AudioVisualizer = dynamic(
  () => import('@/components/audio/audio-visualizer')
);

export default function AvatarChatPage() {
  return (
    <div>
      <BeyAvatar />
      <AudioVisualizer />
    </div>
  );
}
```

### 3. Streaming with Suspense

```typescript
// app/(app)/home/page.tsx
import { Suspense } from 'react';

export default function HomePage() {
  return (
    <div>
      <Suspense fallback={<ScenariosSkeleton />}>
        <ScenariosList />
      </Suspense>

      <Suspense fallback={<ProgressSkeleton />}>
        <UserProgress />
      </Suspense>
    </div>
  );
}

async function ScenariosList() {
  const scenarios = await getScenarios(); // Automatically caches
  return <div>{/* ... */}</div>;
}
```

### 4. Partial Prerendering (Next.js 15)

```typescript
// next.config.ts
export default {
  experimental: {
    ppr: 'incremental', // Enable PPR
  },
};

// app/(app)/chat/page.tsx
export const experimental_ppr = true; // Enable per-route

export default function ChatPage() {
  return (
    <div>
      <SearchBox /> {/* Static shell */}
      <Suspense fallback={<ChatSkeleton />}>
        <ChatMessages /> {/* Streaming */}
      </Suspense>
    </div>
  );
}
```

### 5. Server Component Caching

```typescript
// lib/api/scenarios.ts
export async function getScenarios() {
  const res = await fetch('https://api.example.com/scenarios', {
    next: {
      revalidate: 3600,      // ISR: Revalidate every hour
      tags: ['scenarios'],   // Tag-based revalidation
    },
  });
  return res.json();
}

// Revalidate on mutation
import { revalidateTag } from 'next/cache';

export async function updateScenario(id: string, data: any) {
  await db.scenario.update({ where: { id }, data });
  revalidateTag('scenarios'); // Invalidate all scenario caches
}
```

### 6. Edge Runtime for Fast Responses

```typescript
// app/api/auth/status/route.ts
export const runtime = 'edge';

export async function GET(req: Request) {
  // Fast edge response
  return NextResponse.json({ status: 'ok' });
}
```

### 7. Database Query Optimization

```typescript
// lib/db/queries.ts
import { prisma } from '@/lib/db/prisma';
import { cache } from 'react';

export const getScenarios = cache(async () => {
  return prisma.scenario.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      // Only select needed fields
    },
    orderBy: { name: 'asc' },
  });
});

export const getUserProgress = cache(async (userId: string) => {
  return prisma.userProgress.findMany({
    where: { userId },
    include: {
      scenario: {
        select: {
          name: true,
        },
      },
    },
  });
});
```

### 8. Bundle Size Optimization

```typescript
// next.config.ts
export default {
  // Remove unused exports
  experimental: {
    optimizePackageImports: [
      '@livekit/components-react',
      'lucide-react',
      'recharts',
    ],
  },
};

// Import specific icons
import { Mic, MicOff, Volume2 } from 'lucide-react';
// NOT: import * as Icons from 'lucide-react';
```

### 9. Prefetching and Preloading

```typescript
// components/ui/link.tsx
import Link from 'next/link';

export function SmartLink({ href, ...props }: LinkProps) {
  return (
    <Link
      href={href}
      prefetch={true} // Prefetch on hover
      {...props}
    />
  );
}
```

---

## 9. Migration Phases

### Phase 1: Foundation (Week 1-2)

**Goals:**
- Set up Next.js 15 project
- Configure TypeScript and Tailwind CSS v4
- Set up routing structure
- Implement authentication

**Tasks:**
1. Initialize Next.js 15 project
2. Configure App Router structure
3. Set up NextAuth.js v5
4. Create protected routes with middleware
5. Migrate auth context to NextAuth
6. Set up database with Prisma

**Deliverables:**
- Working authentication flow
- Protected routes working
- Database schema defined

### Phase 2: Core Pages (Week 3-4)

**Goals:**
- Migrate static pages to Server Components
- Set up state management
- Implement UI component library

**Tasks:**
1. Install and configure Shadcn/ui
2. Migrate HomeDashboard to Server Component
3. Migrate profile page
4. Set up Zustand stores
5. Install TanStack Query
6. Create base layout components

**Deliverables:**
- All static pages working
- UI components integrated
- State management configured

### Phase 3: Chat Features (Week 5-6)

**Goals:**
- Migrate text chat features
- Implement Server Actions
- Set up real-time features

**Tasks:**
1. Migrate text chat pages
2. Implement chat Server Actions
3. Set up Gemini Live API integration
4. Create WebSocket hooks
5. Migrate voice chat components
6. Test real-time features

**Deliverables:**
- Text chat working with Server Actions
- Voice chat with Gemini Live
- Real-time audio streaming

### Phase 4: Avatar & Advanced Features (Week 7-8)

**Goals:**
- Migrate avatar features
- Implement LiveKit integration
- Add learning features

**Tasks:**
1. Migrate BeyAvatar component
2. Set up LiveKit token generation
3. Implement avatar animation
4. Migrate guided learning
5. Migrate library/scenarios
6. Add progress tracking

**Deliverables:**
- Avatar chat working
- Learning scenarios functional
- Progress tracking working

### Phase 5: Performance & Polish (Week 9-10)

**Goals:**
- Optimize performance
- Add error handling
- Polish UI/UX

**Tasks:**
1. Implement caching strategies
2. Add Suspense boundaries
3. Optimize bundle size
4. Add error boundaries
5. Implement loading states
6. Add analytics
7. E2E testing

**Deliverables:**
- Performance optimized
- Error handling complete
- Production-ready application

### Phase 6: Deployment & Monitoring (Week 11-12)

**Goals:**
- Deploy to production
- Set up monitoring
- Documentation

**Tasks:**
1. Configure environment variables
2. Set up CI/CD pipeline
3. Deploy to Vercel
4. Set up analytics (Vercel Analytics)
5. Configure error tracking (Sentry)
6. Performance monitoring
7. Write deployment documentation

**Deliverables:**
- Production deployment
- Monitoring configured
- Documentation complete

---

## 10. File Organization

### Feature-Based Organization (Recommended)

**For larger features with multiple files:**

```
features/
├── auth/
│   ├── components/
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   └── forgot-password.tsx
│   ├── lib/
│   │   ├── actions.ts
│   │   └── validators.ts
│   └── types.ts
│
├── chat/
│   ├── components/
│   │   ├── text-chat-ui.tsx
│   │   ├── voice-chat-ui.tsx
│   │   └── avatar-chat.tsx
│   ├── lib/
│   │   ├── actions.ts
│   │   ├── hooks.ts
│   │   └── utils.ts
│   └── types.ts
│
└── learning/
    ├── components/
    │   ├── scenario-card.tsx
    │   ├── progress-tracker.tsx
    │   └── lesson-viewer.tsx
    └── lib/
        ├── actions.ts
        └── queries.ts
```

### Shared Utilities Organization

```
lib/
├── ui/                   # Shadcn/ui components
├── hooks/                # Shared hooks
│   ├── use-auth.ts
│   ├── use-media-query.ts
│   └── server/           # Server hooks
│       ├── use-user.ts
│       └── use-scenarios.ts
├── services/             # External API services
│   ├── gemini.service.ts
│   ├── livekit.service.ts
│   └── tts.service.ts
├── utils/                # Utility functions
│   ├── cn.ts             # Classname merge
│   ├── format.ts
│   └── validation.ts
├── validators/           # Zod schemas
│   └── schema.ts
├── store/                # Zustand stores
│   ├── auth.store.ts
│   └── chat.store.ts
└── api/                  # API client
    ├── client.ts
    └── types.ts
```

### Import Aliases Configuration

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/app/*": ["./app/*"],
      "@/types/*": ["./types/*"],
      "@/prompts/*": ["./prompts/*"]
    }
  }
}
```

### Barrel Exports for Clean Imports

```typescript
// lib/hooks/index.ts
export { useAuth } from './use-auth';
export { useGeminiLive } from './use-gemini-live';
export { useLiveKitRoom } from './use-livekit-room';

// lib/services/index.ts
export { geminiService } from './gemini.service';
export { livekitService } from './livekit.service';
export { ttsService } from './tts.service';

// Usage
import { useAuth, useGeminiLive } from '@/lib/hooks';
import { geminiService } from '@/lib/services';
```

---

## Additional Considerations

### Environment Variables

```bash
# .env.local
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Gemini API
GEMINI_API_KEY="..."

# LiveKit
LIVEKIT_URL="..."
LIVEKIT_API_KEY="..."
LIVEKIT_API_SECRET="..."
NEXT_PUBLIC_LIVEKIT_URL="..."

# ElevenLabs
ELEVENLABS_API_KEY="..."
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [
      { "name": "next" }
    ]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

### Next.js Configuration

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Experimental features
  experimental: {
    ppr: 'incremental', // Partial Prerendering
    optimizePackageImports: [
      '@livekit/components-react',
      'lucide-react',
      'recharts',
    ],
  },

  // Image optimization
  images: {
    domains: ['cdn.example.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // Webpack configuration
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### Tailwind CSS v4 Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

---

## Summary

This architecture plan provides a comprehensive roadmap for migrating your SAke E-Learning application to Next.js 15 with modern best practices. The key highlights are:

**Technology Stack:**
- Next.js 15 (App Router)
- React 19 Server Components
- NextAuth.js v5 for authentication
- Zustand for client state
- TanStack Query for server state
- Shadcn/ui for UI components
- Server Actions for mutations

**Key Architectural Decisions:**
- Server Components by default for better performance
- Client Components only when needed for interactivity
- Server Actions for type-safe mutations
- Middleware for route protection
- Hybrid caching strategy (ISR + tag-based)

**Migration Timeline:**
- 12 weeks total
- Phased approach for minimal disruption
- Progressive enhancement strategy

**Performance Optimizations:**
- Partial Prerendering
- Code splitting with dynamic imports
- Image optimization
- Server-side caching
- Bundle size optimization

This architecture will provide a solid foundation for scaling your e-learning platform while maintaining excellent performance and developer experience.
