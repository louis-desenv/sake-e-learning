# Next.js 15 Migration Guide - Component & API Examples

## Component Migration Examples

### Example 1: Migrating AuthContext to NextAuth.js

**Before (React + Vite):**

```typescript
// context/AuthContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setToken(response.token);
    setUser(response.user);
    setIsAuthenticated(true);
    localStorage.setItem('authToken', response.token);
  };

  const logout = async () => {
    await authService.logout(token);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**After (Next.js 15 + NextAuth.js v5):**

```typescript
// lib/auth/config.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

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
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
});
```

```typescript
// middleware.ts
import { auth } from '@/lib/auth/config';

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login');

  if (isAuthPage && isAuthenticated) {
    return Response.redirect(new URL('/home', req.url));
  }

  if (!isAuthPage && !isAuthenticated) {
    return Response.redirect(new URL('/login', req.url));
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

```typescript
// app/(auth)/login/page.tsx
import { signIn } from '@/lib/auth/config';
import { redirect } from 'next/navigation';

export default function LoginPage() {
  return (
    <form
      action={async (formData) => {
        'use server';
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        await signIn('credentials', { email, password });
        redirect('/home');
      }}
    >
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

---

### Example 2: Migrating UserContext to Server Components + Zustand

**Before (React + Vite):**

```typescript
// context/UserContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { UserProfile } from '../types';

interface UserContextType {
  user: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  return (
    <UserContext.Provider value={{ user, setUserProfile: setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};
```

**After (Next.js 15):**

```typescript
// lib/store/user.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '@/types';

interface UserStore {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  clearProfile: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        })),
      clearProfile: () => set({ profile: null }),
    }),
    { name: 'user-profile-storage' }
  )
);
```

```typescript
// app/(app)/home/page.tsx
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { HomeDashboard } from './home-dashboard';

async function getUserProfile(userId: string) {
  return prisma.userProfile.findUnique({
    where: { userId },
  });
}

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const profile = await getUserProfile(session.user.id);

  return <HomeDashboard initialProfile={profile} />;
}
```

```typescript
// components/home/home-dashboard.tsx
'use client';

import { useUserStore } from '@/lib/store/user.store';

interface HomeDashboardProps {
  initialProfile: UserProfile | null;
}

export function HomeDashboard({ initialProfile }: HomeDashboardProps) {
  const { profile, setProfile } = useUserStore();

  // Initialize from server data
  React.useEffect(() => {
    if (initialProfile && !profile) {
      setProfile(initialProfile);
    }
  }, [initialProfile, profile, setProfile]);

  return (
    <div>
      <h1>Welcome, {profile?.name}!</h1>
      <p>Level: {profile?.level}</p>
    </div>
  );
}
```

---

### Example 3: Migrating GeminiVoiceChat to Client Component

**Before (React + Vite):**

```typescript
// components/GeminiVoiceChat.tsx
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useGeminiLive } from '../hooks/useGeminiLive';

const GeminiVoiceChat: React.FC = () => {
  const { user } = useUser();
  const { isSessionActive, startSession, endSession } = useGeminiLive();
  const [audioLevel, setAudioLevel] = useState(0);

  // ... component logic

  return (
    <div className="w-full h-full bg-gray-50">
      {/* UI */}
    </div>
  );
};
```

**After (Next.js 15):**

```typescript
// components/chat/gemini-voice-chat.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useUserStore } from '@/lib/store/user.store';
import { useGeminiLive } from '@/lib/hooks/use-gemini-live';
import { AudioVisualizer } from '@/components/audio/audio-visualizer';
import { Mic, MicOff, Volume2, PhoneOff } from 'lucide-react';

interface GeminiVoiceChatProps {
  initialConfig?: {
    preferredVoice?: string;
    scenario?: string;
  };
}

export function GeminiVoiceChat({ initialConfig }: GeminiVoiceChatProps) {
  const { profile } = useUserStore();
  const { isSessionActive, isAwaitingResponse, userTranscript, aiTranscript, error, startSession, endSession } = useGeminiLive();

  const [audioLevel, setAudioLevel] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);

  const handleStartSession = useCallback(async () => {
    await startSession({
      userName: profile?.name || 'User',
      userLevel: profile?.level || 'Beginner',
      nativeLanguage: profile?.nativeLanguage || 'English',
      scenario: initialConfig?.scenario,
      voice: initialConfig?.preferredVoice || 'Zephyr',
    });
  }, [profile, initialConfig, startSession]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border-t-4 border-t-cyan-500 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-2 flex items-center space-x-4 border-b border-gray-50/50">
          <div className="p-3 bg-cyan-50 rounded-full text-cyan-600">
            <Mic className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-gray-800">Voice Chat</h3>
            <p className="text-sm text-gray-500">Real-time conversation with Gemini</p>
          </div>
        </div>

        {/* Audio Visualizer */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[400px] relative bg-gradient-to-br from-blue-900 to-purple-900">
          <AudioVisualizer
            isListening={isSessionActive && !isAwaitingResponse}
            isAgentSpeaking={isSessionActive && !!aiTranscript}
            audioLevel={audioLevel}
            theme="blue"
          />

          {/* Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
            {!isSessionActive ? (
              <button
                onClick={handleStartSession}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium transition"
              >
                Start Conversation
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  className="p-4 bg-white/10 hover:bg-white/20 rounded-full"
                >
                  {isMicMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                <button
                  onClick={endSession}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition flex items-center gap-2"
                >
                  <PhoneOff className="w-5 h-5" />
                  End Call
                </button>
              </>
            )}
          </div>

          {/* Transcripts */}
          {isSessionActive && (userTranscript || aiTranscript) && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4">
              {aiTranscript && (
                <p className="text-white text-sm mb-2">
                  <strong>AI:</strong> {aiTranscript}
                </p>
              )}
              {userTranscript && (
                <p className="text-white/70 text-sm">
                  <strong>You:</strong> {userTranscript}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### Example 4: Migrating Text Chat to Server Component + Server Actions

**Before (React + Vite):**

```typescript
// pages/chat/TextChatWithScenario.tsx
import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { geminiService } from '../../services/geminiService';

const TextChatWithScenario: React.FC = () => {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (text: string) => {
    setIsLoading(true);
    const response = await geminiService.chat({ message: text });
    setMessages((prev) => [...prev, { role: 'user', text }, { role: 'ai', text: response }]);
    setIsLoading(false);
  };

  return (
    <div>
      {/* Chat UI */}
    </div>
  );
};
```

**After (Next.js 15):**

```typescript
// app/(app)/chat/text/[scenario]/page.tsx
import { getScenarioConfig } from '@/prompts/builders/prompt-builder';
import { TextChatUI } from '@/components/chat/text-chat-ui';

interface PageProps {
  params: Promise<{ scenario: string }>;
}

async function getInitialMessages(scenario: string) {
  // Fetch chat history from database
  const { prisma } = await import('@/lib/db/prisma');
  return prisma.chatMessage.findMany({
    where: { scenario },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });
}

export default async function TextChatPage({ params }: PageProps) {
  const { scenario } = await params;
  const [scenarioConfig, initialMessages] = await Promise.all([
    getScenarioConfig(scenario),
    getInitialMessages(scenario),
  ]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{scenarioConfig.name}</h1>
      <p className="text-gray-600 mb-6">{scenarioConfig.description}</p>
      <TextChatUI
        scenario={scenario}
        initialMessages={initialMessages}
        systemPrompt={scenarioConfig.systemPrompt}
      />
    </div>
  );
}
```

```typescript
// lib/actions/chat.action.ts
'use server';

import { revalidateTag } from 'next/cache';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { geminiService } from '@/lib/services/gemini.service';

export async function sendChatMessage(message: string, scenario: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Save user message
  await prisma.chatMessage.create({
    data: {
      userId: session.user.id,
      scenario,
      role: 'user',
      content: message,
    },
  });

  // Get AI response
  const response = await geminiService.chat({
    message,
    scenario,
    userId: session.user.id,
  });

  // Save AI response
  await prisma.chatMessage.create({
    data: {
      userId: session.user.id,
      scenario,
      role: 'ai',
      content: response,
    },
  });

  // Invalidate cache
  revalidateTag('chat-history');

  return { role: 'ai', content: response };
}

export async function getChatHistory(scenario: string, limit = 50) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  return prisma.chatMessage.findMany({
    where: { userId: session.user.id, scenario },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}
```

```typescript
// components/chat/text-chat-ui.tsx
'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sendChatMessage } from '@/lib/actions/chat.action';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TextChatUIProps {
  scenario: string;
  initialMessages: Array<{ role: 'user' | 'ai'; content: string }>;
  systemPrompt: string;
}

export function TextChatUI({ scenario, initialMessages, systemPrompt }: TextChatUIProps) {
  const [input, setInput] = useState('');
  const queryClient = useQueryClient();

  const { data: messages } = useQuery({
    queryKey: ['chat-messages', scenario],
    queryFn: () => fetch(`/api/chat/messages?scenario=${scenario}`).then(r => r.json()),
    initialData: initialMessages,
  });

  const mutation = useMutation({
    mutationFn: (message: string) => sendChatMessage(message, scenario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', scenario] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    mutation.mutate(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={mutation.isPending}
        />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
```

---

## API Route Examples

### Example 1: LiveKit Token Generation

```typescript
// app/api/livekit/token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { livekitService } from '@/lib/services/livekit.service';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { roomName } = await req.json();

    if (!roomName) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      );
    }

    // Generate token
    const token = await livekitService.createToken({
      identity: session.user.id,
      roomName: `${session.user.id}-${roomName}`,
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
```

### Example 2: Gemini Chat Endpoint

```typescript
// app/api/gemini/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { geminiService } from '@/lib/services/gemini.service';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { message, scenario } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await geminiService.chat({
      message,
      scenario,
      userId: session.user.id,
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in Gemini chat:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
```

### Example 3: User Profile Management

```typescript
// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { profileUpdateSchema } from '@/lib/validators/schema';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = profileUpdateSchema.parse(body);

    const profile = await prisma.userProfile.update({
      where: { userId: session.user.id },
      data: validatedData,
    });

    return NextResponse.json(profile);
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
```

### Example 4: Learning Progress Tracking

```typescript
// app/api/user/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { revalidateTag } from 'next/cache';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const progress = await prisma.userProgress.findMany({
    where: { userId: session.user.id },
    include: {
      scenario: {
        select: {
          name: true,
          description: true,
        },
      },
    },
  });

  return NextResponse.json(progress);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { scenarioId, completed, score, timeSpent } = await req.json();

  const progress = await prisma.userProgress.upsert({
    where: {
      userId_scenarioId: {
        userId: session.user.id,
        scenarioId,
      },
    },
    update: {
      completed,
      score,
      timeSpent: { increment: timeSpent },
      lastAccessedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      scenarioId,
      completed,
      score,
      timeSpent,
    },
  });

  revalidateTag('user-progress');
  return NextResponse.json(progress);
}
```

---

## Service Layer Examples

### Gemini Service

```typescript
// lib/services/gemini.service.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getScenarioConfig } from '@/prompts/builders/prompt-builder';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiService = {
  async chat({
    message,
    scenario,
    userId,
  }: {
    message: string;
    scenario?: string;
    userId: string;
  }) {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const systemPrompt = scenario
      ? (await getScenarioConfig(scenario)).systemPrompt
      : 'You are a helpful English tutor.';

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  },

  async chatWithHistory({
    message,
    history,
    scenario,
  }: {
    message: string;
    history: Array<{ role: 'user' | 'model'; content: string }>;
    scenario?: string;
  }) {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const chat = model.startChat({
      history: history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  },
};
```

### LiveKit Service

```typescript
// lib/services/livekit.service.ts
import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';

const livekitClient = new RoomServiceClient(
  process.env.LIVEKIT_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export const livekitService = {
  async createToken({
    identity,
    roomName,
    metadata = {},
  }: {
    identity: string;
    roomName: string;
    metadata?: Record<string, any>;
  }) {
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
      canPublishData: true,
    });

    token.metadata = JSON.stringify(metadata);

    return token.toJwt();
  },

  async createRoom(options?: {
    name?: string;
    emptyTimeout?: number;
    maxParticipants?: number;
  }) {
    return livekitClient.createRoom({
      name: options?.name,
      emptyTimeout: options?.emptyTimeout || 10 * 60,
      maxParticipants: options?.maxParticipants || 2,
      videoCodec: 'vp8',
    });
  },

  async listRooms() {
    return livekitClient.listRooms();
  },
};
```

### TTS Service

```typescript
// lib/services/tts.service.ts
import { ElevenLabsClient } from 'elevenlabs';

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});

export const ttsService = {
  async synthesize({
    text,
    voice = 'eleven_multilingual_v2',
    outputFormat = 'mp3_44100_128',
  }: {
    text: string;
    voice?: string;
    outputFormat?: string;
  }) {
    const response = await elevenlabs.textToSpeech.convert({
      voice_id: voice,
      text,
      model_id: 'eleven_multilingual_v2',
      output_format: outputFormat as any,
    });

    return Buffer.from(await response.arrayBuffer());
  },

  async getVoices() {
    const response = await elevenlabs.voices.getAll();
    return response.voices;
  },
};
```

---

## Hook Examples

### useGeminiLive Hook

```typescript
// lib/hooks/use-gemini-live.ts
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './use-auth';

interface GeminiLiveOptions {
  onTranscript?: (text: string, role: 'user' | 'ai') => void;
  onAudio?: (audioData: ArrayBuffer) => void;
  onError?: (error: Error) => void;
}

export function useGeminiLive(options: GeminiLiveOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { user } = useAuth();

  const connect = useCallback(async () => {
    try {
      setError(null);

      // Get token from server
      const response = await fetch('/api/gemini/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to get Gemini token');
      }

      const { token, endpoint } = await response.json();

      // Connect WebSocket
      const ws = new WebSocket(`${endpoint}?token=${token}`);

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsSpeaking(false);
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error');
        options.onError?.(new Error('WebSocket connection failed'));
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'transcript') {
          if (data.role === 'user') {
            setUserTranscript(data.text);
          } else {
            setAiTranscript(data.text);
          }
          options.onTranscript?.(data.text, data.role);
        }

        if (data.type === 'audio') {
          const audioData = Uint8Array.from(
            atob(data.data),
            (c) => c.charCodeAt(0)
          );
          options.onAudio?.(audioData.buffer);

          // Play audio
          if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext({ sampleRate: 24000 });
          }

          const audioBuffer = await audioContextRef.current.decodeAudioData(
            audioData.buffer.slice(0)
          );

          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current.destination);
          source.start();

          setIsSpeaking(true);
          source.onended = () => setIsSpeaking(false);
        }

        if (data.type === 'turn_complete') {
          setUserTranscript('');
          setAiTranscript('');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      options.onError?.(err as Error);
    }
  }, [user?.id, options]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
    setIsSpeaking(false);
  }, []);

  const sendAudio = useCallback(
    (audioData: ArrayBuffer) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'audio',
            data: btoa(String.fromCharCode(...new Uint8Array(audioData))),
          })
        );
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      disconnect();
      audioContextRef.current?.close();
    };
  }, [disconnect]);

  return {
    isConnected,
    isSpeaking,
    userTranscript,
    aiTranscript,
    error,
    connect,
    disconnect,
    sendAudio,
  };
}
```

### useLiveKitRoom Hook

```typescript
// lib/hooks/use-livekit-room.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  LocalParticipant,
  Track,
} from 'livekit-client';

interface UseLiveKitRoomOptions {
  onParticipantConnected?: (participant: RemoteParticipant) => void;
  onParticipantDisconnected?: (participant: RemoteParticipant) => void;
  onError?: (error: Error) => void;
}

export function useLiveKitRoom(
  token: string,
  roomName: string,
  options: UseLiveKitRoomOptions = {}
) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(async () => {
    try {
      const roomInstance = new Room();

      roomInstance.on(RoomEvent.Connected, () => {
        setIsConnected(true);
        setParticipants(Array.from(roomInstance.remoteParticipants.values()));
      });

      roomInstance.on(RoomEvent.ParticipantConnected, (participant) => {
        setParticipants((prev) => [...prev, participant]);
        options.onParticipantConnected?.(participant);
      });

      roomInstance.on(RoomEvent.ParticipantDisconnected, (participant) => {
        setParticipants((prev) => prev.filter((p) => p !== participant));
        options.onParticipantDisconnected?.(participant);
      });

      roomInstance.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        setParticipants([]);
      });

      roomInstance.on(RoomEvent.ConnectionStateChanged, (state) => {
        console.log('Connection state:', state);
      });

      await roomInstance.connect(
        process.env.NEXT_PUBLIC_LIVEKIT_URL!,
        token
      );

      setRoom(roomInstance);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
    }
  }, [token, options]);

  const disconnect = useCallback(() => {
    room?.disconnect();
    setRoom(null);
    setIsConnected(false);
    setParticipants([]);
  }, [room]);

  const toggleMicrophone = useCallback(async () => {
    if (!room) return;

    const enabled = room.localParticipant.microphoneTrack?.isMuted ?? false;
    await room.localParticipant.setMicrophoneEnabled(!enabled);
  }, [room]);

  const toggleCamera = useCallback(async () => {
    if (!room) return;

    const enabled = room.localParticipant.cameraTrack?.isMuted ?? false;
    await room.localParticipant.setCameraEnabled(!enabled);
  }, [room]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    room,
    isConnected,
    participants,
    error,
    connect,
    disconnect,
    toggleMicrophone,
    toggleCamera,
  };
}
```

---

This migration guide provides concrete examples for transitioning your React + Vite application to Next.js 15 with modern patterns. Each example shows the before/after code and explains the architectural decisions.
