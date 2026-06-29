# Architecture Documentation - Next.js 15

Complete system architecture for the Next.js 15 migration.

## 📁 Contents

This folder contains architecture-related documentation:

### [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)
**Visual architecture diagrams (Mermaid)**

**Contents:**
- System architecture overview
- Data flow for text and voice chat
- Component architecture
- State management flow
- Authentication flow
- Real-time audio processing
- Caching strategy
- Deployment architecture
- Performance optimization layers
- Security architecture

---

### [ARCHITECTURE_COMPARISON.md](./ARCHITECTURE_COMPARISON.md)
**Before/after architecture comparison**

**Contents:**
- Current vs proposed architecture
- Component strategy differences
- Data fetching approaches
- State management patterns
- Real-time features implementation
- Routing comparison
- Performance metrics
- Migration effort estimation

---

## 🏗️ Key Architectural Decisions

### Server Components by Default

```typescript
// Server Component (default)
export default async function ChatPage() {
  const scenarios = await db.scenarios.findMany();
  return <ScenarioList scenarios={scenarios} />;
}
```

### Client Components for Interactivity

```typescript
// Client Component
'use client';

export function ChatInput() {
  const [message, setMessage] = useState('');
  // Interactive logic
}
```

### Server Actions for Mutations

```typescript
// Server Action
'use server';

export async function sendMessage(formData: FormData) {
  const message = formData.get('message');
  await db.messages.create({ data: { message } });
}
```

---

## 📊 Performance Improvements

### Bundle Size Reduction

- **Before**: 800KB JavaScript
- **After**: 150KB JavaScript
- **Reduction**: 81%

### How?

1. Server Components (no JS sent to client)
2. Code splitting by route
3. Tree shaking of unused code
4. Server-side rendering

---

## 🔄 Data Flow

### Server Component Data Flow

```
User Request → Server Component → Database → HTML Response
```

### Client Component Data Flow

```
User Action → Client Component → Server Action → Database → Re-render
```

### Real-time Data Flow

```
Client → WebSocket → LiveKit Server → Audio Stream → Other Clients
```

---

## 📖 Usage

When working on Next.js architecture:

1. Review [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) for visuals
2. Check [ARCHITECTURE_COMPARISON.md](./ARCHITECTURE_COMPARISON.md) for changes
3. Follow Server Components pattern
4. Use Server Actions for mutations

---

**[← Back to Migration README](../README.md)**
