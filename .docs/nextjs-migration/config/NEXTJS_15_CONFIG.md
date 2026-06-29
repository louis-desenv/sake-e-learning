# Next.js 15 Quick Reference & Configuration

## Essential Files Checklist

### Configuration Files

```bash
# Root directory
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies
├── .env.local              # Environment variables (gitignored)
├── .env.example            # Environment template
├── middleware.ts           # Auth middleware
├── .eslintrc.json          # ESLint configuration
└── prettier.config.js      # Prettier configuration
```

### Application Structure

```bash
# App Router
app/
├── (auth)/                 # Auth route group
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   └── layout.tsx
│
├── (app)/                  # Main app group
│   ├── home/
│   │   └── page.tsx
│   ├── chat/
│   │   ├── text/
│   │   │   └── page.tsx
│   │   └── voice-only/
│   │       └── page.tsx
│   └── layout.tsx
│
├── api/                    # API routes
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts
│   ├── livekit/
│   │   └── token/
│   │       └── route.ts
│   └── gemini/
│       └── chat/
│           └── route.ts
│
├── layout.tsx              # Root layout
├── page.tsx                # Root redirect
├── loading.tsx             # Global loading
├── error.tsx               # Global error
└── not-found.tsx           # 404 page
```

---

## Complete Configuration Files

### 1. next.config.ts

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // React features
  reactStrictMode: true,

  // Experimental features
  experimental: {
    // Partial Prerendering (Next.js 15)
    ppr: 'incremental',

    // Optimize package imports for smaller bundle
    optimizePackageImports: [
      '@livekit/components-react',
      'lucide-react',
      'recharts',
      '@radix-ui/react-icons',
    ],
  },

  // Image optimization
  images: {
    domains: ['cdn.example.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Environment variables (exposed to browser)
  env: {
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NEXT_PUBLIC_LIVEKIT_URL: process.env.LIVEKIT_URL,
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Fixes for LiveKit and audio libraries
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });

    return config;
  },

  // Headers for security and performance
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
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGIN || '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
```

### 2. tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-in-from-bottom': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-out-to-bottom': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
        'slide-out-to-bottom': 'slide-out-to-bottom 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### 3. tsconfig.json

```json
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
    "plugins": [
      { "name": "next" }
    ],
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/app/*": ["./app/*"],
      "@/types/*": ["./types/*"],
      "@/prompts/*": ["./prompts/*"],
      "@/hooks/*": ["./lib/hooks/*"]
    }
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

### 4. .env.example

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sakae_learning"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Gemini API
GEMINI_API_KEY="your-gemini-api-key"
NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"

# LiveKit
LIVEKIT_URL="wss://your-livekit-url"
LIVEKIT_API_KEY="your-livekit-api-key"
LIVEKIT_API_SECRET="your-livekit-api-secret"
NEXT_PUBLIC_LIVEKIT_URL="wss://your-livekit-url"

# ElevenLabs TTS
ELEVENLABS_API_KEY="your-elevenlabs-api-key"

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Analytics
NEXT_PUBLIC_GA_ID="your-google-analytics-id"
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"

# Optional: Redis (for caching)
REDIS_URL="redis://localhost:6379"

# Optional: S3 (for file storage)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="sakae-uploads"
```

### 5. middleware.ts

```typescript
import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
                     req.nextUrl.pathname.startsWith('/register');
  const isApiAuth = req.nextUrl.pathname.startsWith('/api/auth');
  const isPublicPage = req.nextUrl.pathname === '/google-callback';

  // Allow public pages
  if (isPublicPage || isApiAuth) {
    return NextResponse.next();
  }

  // Redirect authenticated users from auth pages
  if (isAuthPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/home', req.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|*.png|*.jpg|*.jpeg|*.gif|*.svg).*)',
  ],
};
```

### 6. components/providers/providers.tsx

```typescript
'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
```

### 7. app/layout.tsx

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SAke E-Learning - Learn English with AI',
  description: 'Master English through interactive conversations with AI. Practice real-life scenarios, improve pronunciation, and build confidence.',
  keywords: ['English learning', 'AI tutor', 'Language learning', 'Conversation practice'],
  authors: [{ name: 'SAke E-Learning Team' }],
  openGraph: {
    title: 'SAke E-Learning - Learn English with AI',
    description: 'Master English through interactive conversations with AI',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SAke E-Learning - Learn English with AI',
    description: 'Master English through interactive conversations with AI',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SAke E-Learning',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
```

### 8. app/loading.tsx

```typescript
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
```

### 9. app/error.tsx

```typescript
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Oops! Something went wrong</CardTitle>
          <CardDescription>
            {error.message || 'An unexpected error occurred'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We apologize for the inconvenience. Please try again.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={reset}>Try again</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

---

## Package.json Dependencies

```json
{
  "name": "sakae-e-learning-v3",
  "version": "3.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "dependencies": {
    "@auth/prisma-adapter": "^2.7.4",
    "@elevenlabs/labs": "^1.3.9",
    "@google/generative-ai": "^0.24.1",
    "@hookform/resolvers": "^3.9.1",
    "@livekit/components-react": "^2.6.8",
    "@livekit/krisp-noise-filter": "^1.0.4",
    "@prisma/client": "^6.1.0",
    "@radix-ui/react-avatar": "^1.1.2",
    "@radix-ui/react-dialog": "^1.1.3",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-progress": "^1.1.1",
    "@radix-ui/react-scroll-area": "^1.2.1",
    "@radix-ui/react-select": "^2.1.4",
    "@radix-ui/react-separator": "^1.1.1",
    "@radix-ui/react-slider": "^1.2.2",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.2",
    "@radix-ui/react-toast": "^1.2.4",
    "@radix-ui/react-tooltip": "^1.1.6",
    "@tanstack/react-query": "^5.62.7",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "livekit-client": "^2.6.2",
    "lucide-react": "^0.468.0",
    "next": "15.1.3",
    "next-auth": "5.0.0-beta.25",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.54.0",
    "recharts": "^2.15.0",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.24.1",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.18",
    "@types/node": "^22.10.5",
    "@types/react": "^19.0.6",
    "@types/react-dom": "^19.0.2",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.17.0",
    "eslint-config-next": "15.1.3",
    "postcss": "^8.4.49",
    "prettier": "^3.4.2",
    "prettier-plugin-tailwindcss": "^0.6.10",
    "prisma": "^6.1.0",
    "tailwindcss": "^4.1.18",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

---

## Common Patterns Quick Reference

### Server Component Pattern

```typescript
// app/(app)/example/page.tsx
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 },
  });
  return res.json();
}

export default async function ExamplePage() {
  const data = await getData();
  return <div>{/* ... */}</div>;
}
```

### Client Component Pattern

```typescript
// components/example/client-component.tsx
'use client';

import { useState } from 'react';

export function ClientComponent({ initialData }: { initialData: any }) {
  const [state, setState] = useState(initialData);
  return <div>{/* ... */}</div>;
}
```

### Server Action Pattern

```typescript
// lib/actions/example.action.ts
'use server';

import { revalidateTag } from 'next/cache';
import { auth } from '@/lib/auth/config';

export async function exampleAction(data: any) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  // Perform action
  const result = await doSomething(data);

  revalidateTag('example-data');
  return result;
}
```

### Route Handler Pattern

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await getData();
  return NextResponse.json(data);
}
```

---

## Performance Checklist

- [ ] Enable Partial Prerendering (PPR)
- [ ] Implement ISR for static data
- [ ] Use dynamic imports for heavy components
- [ ] Add Suspense boundaries
- [ ] Optimize images with next/image
- [ ] Implement proper caching strategy
- [ ] Use edge runtime for fast endpoints
- [ ] Minimize client-side JavaScript
- [ ] Implement proper database indexes
- [ ] Use connection pooling for database

---

## Security Checklist

- [ ] Implement authentication middleware
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS in production
- [ ] Implement rate limiting
- [ ] Sanitize user inputs
- [ ] Use prepared statements for database
- [ ] Enable CORS properly
- [ ] Implement CSRF protection
- [ ] Use security headers
- [ ] Regular dependency updates

---

This quick reference provides all the essential configurations and patterns needed for a production-ready Next.js 15 application.
