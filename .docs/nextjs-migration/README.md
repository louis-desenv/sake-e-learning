# SAke E-Learning - Next.js 15 Architecture Documentation

## Overview

This directory contains comprehensive architecture documentation for migrating the SAke E-Learning application from React + Vite to **Next.js 15** with modern best practices and production-ready patterns.

## Documentation Structure

### 📋 [NEXTJS_15_ARCHITECTURE.md](./NEXTJS_15_ARCHITECTURE.md)
**Complete Architecture Plan**

The master document containing:
- Project structure and file organization
- Library recommendations with justifications
- Server vs Client Components strategy
- Data fetching and state management
- API routes and Server Actions
- Authentication architecture
- Real-time features strategy
- Performance optimizations
- 12-week migration roadmap

**Key Highlights:**
- Next.js 15 App Router architecture
- React 19 Server Components
- NextAuth.js v5 for authentication
- Zustand for client state
- TanStack Query for server state
- Shadcn/ui for UI components

---

### 🔧 [NEXTJS_15_MIGRATION_GUIDE.md](./NEXTJS_15_MIGRATION_GUIDE.md)
**Component & API Migration Examples**

Detailed before/after examples for migrating:
- AuthContext → NextAuth.js
- UserContext → Server Components + Zustand
- GeminiVoiceChat → Client Component with hooks
- Text chat → Server Components + Server Actions
- API routes with proper error handling
- Service layer architecture
- Custom hooks (useGeminiLive, useLiveKitRoom)

**Perfect for:** Developers implementing the migration

---

### 🗄️ [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
**Database Design & Prisma Setup**

Complete database architecture including:
- Prisma schema with all models
- User management and authentication
- Chat history and conversations
- Learning progress tracking
- Achievements and gamification
- Seed scripts
- Common database queries
- Backup and migration strategies

**Perfect for:** Backend developers and database architects

---

### 📊 [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)
**Visual Architecture Diagrams**

Mermaid diagrams covering:
- System architecture overview
- Data flow for text and voice chat
- Component architecture
- State management flow
- Authentication flow
- Real-time audio processing
- Caching strategy
- Deployment architecture
- Performance optimization layers
- Migration phases
- Security architecture
- Monitoring and observability

**Perfect for:** Understanding the big picture

---

### ⚙️ [NEXTJS_15_CONFIG.md](./NEXTJS_15_CONFIG.md)
**Configuration Quick Reference**

All configuration files needed:
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS setup
- `tsconfig.json` - TypeScript configuration
- `.env.example` - Environment variables template
- `middleware.ts` - Auth middleware
- Provider components
- Root layouts and error boundaries
- Complete `package.json` dependencies
- Common patterns quick reference
- Performance and security checklists

**Perfect for:** Quick setup and configuration

---

## Quick Start Guide

### 1. Read the Architecture Plan
Start with [NEXTJS_15_ARCHITECTURE.md](./NEXTJS_15_ARCHITECTURE.md) to understand the overall strategy and technology choices.

### 2. Review the Migration Guide
Check [NEXTJS_15_MIGRATION_GUIDE.md](./NEXTJS_15_MIGRATION_GUIDE.md) for concrete examples of how to migrate your existing components.

### 3. Set Up the Database
Follow [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) to set up Prisma and create your database schema.

### 4. Configure Your Project
Use [NEXTJS_15_CONFIG.md](./NEXTJS_15_CONFIG.md) to set up all configuration files.

### 5. Understand the Architecture
Review [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) to understand how everything fits together.

---

## Technology Stack Summary

### Core Framework
- **Next.js 15** - React framework with App Router
- **React 19** - UI library with Server Components
- **TypeScript 5.8** - Type safety

### Authentication
- **NextAuth.js v5** - Authentication solution
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database

### State Management
- **Zustand** - Client state management
- **TanStack Query v5** - Server state management
- **React Context** - Component-level state

### UI Components
- **Shadcn/ui** - Component library
- **Tailwind CSS v4** - Styling
- **Lucide React** - Icons
- **Framer Motion** - Animations

### Real-time Features
- **LiveKit** - Video/audio streaming
- **Gemini Live API** - AI voice conversations
- **WebSocket** - Real-time communication

### Data Fetching
- **Native fetch** - Server Components
- **Server Actions** - Mutations
- **TanStack Query** - Client data fetching

### Development Tools
- **Prisma** - Database ORM
- **Zod** - Schema validation
- **ESLint** - Code linting
- **Prettier** - Code formatting

---

## Migration Timeline

### Phase 1: Foundation (Weeks 1-2)
- Set up Next.js 15 project
- Configure TypeScript and Tailwind CSS
- Set up NextAuth.js
- Create database schema with Prisma

### Phase 2: Core Pages (Weeks 3-4)
- Migrate static pages to Server Components
- Set up Zustand stores
- Install and configure Shadcn/ui
- Implement TanStack Query

### Phase 3: Chat Features (Weeks 5-6)
- Migrate text chat with Server Actions
- Implement Gemini Live API integration
- Create WebSocket hooks
- Migrate voice chat components

### Phase 4: Avatar & Advanced Features (Weeks 7-8)
- Migrate BeyAvatar component
- Set up LiveKit integration
- Implement learning scenarios
- Add progress tracking

### Phase 5: Performance & Polish (Weeks 9-10)
- Implement caching strategies
- Add Suspense boundaries
- Optimize bundle size
- Add error handling and loading states

### Phase 6: Deployment & Monitoring (Weeks 11-12)
- Configure environment variables
- Deploy to Vercel
- Set up monitoring and analytics
- Write documentation

---

## Key Architectural Decisions

### 1. Server Components by Default
**Why:** Better performance, reduced JavaScript bundle, direct database access, improved SEO.

**When to use:** Data fetching pages, static content, routes and layouts.

### 2. Client Components Only When Needed
**Why:** Minimize client-side JavaScript, improve initial load time.

**When to use:** Browser APIs, event handlers, real-time features, interactive UI.

### 3. Server Actions for Mutations
**Why:** Type-safe, automatic form handling, built-in error handling, progressive enhancement.

**When to use:** Form submissions, database mutations, authenticated operations.

### 4. Hybrid State Management
**Why:** Different problems need different solutions.

- **Zustand** for UI state (modals, toggles, temporary state)
- **TanStack Query** for server state (API data, caching, synchronization)
- **React Context** for component tree state (theme, auth session)

### 5. Tag-Based Revalidation
**Why:** Fine-grained cache control, better performance than time-based revalidation.

**Example:**
```typescript
revalidateTag('user-profile'); // Invalidate all profile caches
```

---

## Performance Strategy

### Build-Time Optimizations
- Code splitting with dynamic imports
- Tree shaking
- Minification
- Bundle size optimization

### Runtime Optimizations
- Partial Prerendering (PPR)
- Incremental Static Regeneration (ISR)
- Edge functions for fast responses
- Image optimization with next/image

### Caching Strategy
- Server-side: ISR + tag-based revalidation
- Client-side: TanStack Query with stale-while-revalidate
- Edge: Vercel Edge Network
- Database: Proper indexes and query optimization

---

## Security Best Practices

### Authentication & Authorization
- Middleware-based route protection
- JWT tokens with secure storage
- OAuth integration (Google)
- Session management

### Data Security
- Input validation with Zod
- SQL injection prevention with Prisma
- XSS protection with React
- CSRF protection with NextAuth.js

### API Security
- Rate limiting
- CORS configuration
- Security headers
- Environment variable protection

---

## Deployment Recommendations

### Platform: Vercel
**Why:**
- Native Next.js support
- Edge functions
- Automatic HTTPS
- Zero-downtime deployments
- Built-in analytics

### Database: Railway or Supabase
**Why:**
- Managed PostgreSQL
- Easy scaling
- Built-in backups
- Good developer experience

### Real-time: LiveKit Cloud
**Why:**
- Managed WebRTC infrastructure
- Global edge network
- Built-in recording
- Scalable architecture

### Monitoring: Vercel Analytics + Sentry
**Why:**
- Real user monitoring
- Error tracking
- Performance metrics
- Deployment tracking

---

## File Organization

### Feature-Based Structure (Recommended)
```
features/
├── auth/
│   ├── components/
│   ├── lib/
│   └── types.ts
├── chat/
│   ├── components/
│   ├── lib/
│   └── types.ts
└── learning/
    ├── components/
    └── lib/
```

### Shared Utilities
```
lib/
├── ui/                  # Shadcn/ui components
├── hooks/               # Shared hooks
├── services/            # External API services
├── utils/               # Utility functions
├── validators/          # Zod schemas
└── store/               # Zustand stores
```

---

## Common Patterns

### Data Fetching (Server Component)
```typescript
async function getData() {
  const res = await fetch(url, {
    next: { revalidate: 3600, tags: ['data'] },
  });
  return res.json();
}

export default async function Page() {
  const data = await getData();
  return <Component data={data} />;
}
```

### Mutation (Server Action)
```typescript
'use server';

import { revalidateTag } from 'next/cache';

export async function updateData(data: any) {
  await db.update(data);
  revalidateTag('data');
  return { success: true };
}
```

### Client State (Zustand)
```typescript
import { create } from 'zustand';

export const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

---

## Contributing

When contributing to the architecture:

1. **Update documentation first** - Document architectural decisions before implementing
2. **Follow the patterns** - Use established patterns from this documentation
3. **Keep it simple** - Avoid premature optimization
4. **Test thoroughly** - Ensure new features work correctly
5. **Review diagrams** - Update architecture diagrams when changing systems

---

## Additional Resources

### Official Documentation
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [NextAuth.js v5 Documentation](https://authjs.dev)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)

### Community Resources
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Vercel Templates](https://vercel.com/templates)
- [shadcn/ui Examples](https://ui.shadcn.com/examples)

### Learning Resources
- [Next.js Learn Course](https://nextjs.org/learn)
- [React Server Components Guide](https://react.dev/reference/react/use-server)
- [Advanced Patterns](https://vercel.com/blog)

---

## Support

For questions or issues:
1. Check the relevant documentation file
2. Review the architecture diagrams
3. Consult the migration guide examples
4. Check official documentation

---

## Version History

- **v3.0.0** (2024) - Initial React + Vite architecture
- **v4.0.0** (2025) - Next.js 15 migration (planned)

---

**Last Updated:** January 2025
**Maintained By:** SAke E-Learning Team
**Status:** 📖 In Progress
