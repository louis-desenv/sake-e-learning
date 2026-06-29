# Performance Optimization - React + Vite Refactoring

Complete performance optimization strategy for the SAke E-Learning V3 application.

---

## 📊 Table of Contents

1. [Performance Goals](#performance-goals)
2. [Current Performance Analysis](#current-performance-analysis)
3. [Bundle Optimization](#bundle-optimization)
4. [Rendering Optimization](#rendering-optimization)
5. [Code Splitting](#code-splitting)
6. [Asset Optimization](#asset-optimization)
7. [Network Optimization](#network-optimization)
8. [Monitoring & Measurement](#monitoring--measurement)

---

## 🎯 Performance Goals

### Key Metrics

| Metric | Current | Target | Priority |
|--------|---------|--------|----------|
| **First Contentful Paint (FCP)** | 2.0s | < 1.0s | High |
| **Largest Contentful Paint (LCP)** | 3.5s | < 2.5s | High |
| **Time to Interactive (TTI)** | 3.5s | < 2.0s | High |
| **Cumulative Layout Shift (CLS)** | 0.15 | < 0.1 | Medium |
| **First Input Delay (FID)** | 80ms | < 50ms | Medium |
| **Time to First Byte (TTFB)** | 600ms | < 400ms | Medium |
| **Bundle Size** | 800KB | < 650KB | High |
| **Lighthouse Score** | 60 | 90+ | High |

### Performance Budgets

```javascript
// vite.config.ts - Performance budgets
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk: max 300KB
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // LiveKit chunk: max 200KB
          'livekit': ['livekit-client', '@livekit/components-styles'],
          // UI chunk: max 100KB
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
});
```

---

## 📈 Current Performance Analysis

### Lighthouse Audit

```
Current Performance: 60/100

Metrics:
- First Contentful Paint: 2.0s
- Speed Index: 3.2s
- Largest Contentful Paint: 3.5s
- Time to Interactive: 3.5s
- Total Blocking Time: 450ms
- Cumulative Layout Shift: 0.15

Opportunities:
- Eliminate render-blocking resources
- Reduce JavaScript execution time
- Reduce unused JavaScript
- Minimize main-thread work
- Reduce initial server response time

Diagnostics:
- Renders over 5000px vertically
- Avoids enormous network payloads
- Uses efficient cache policy
```

### Bundle Analysis

```bash
# Current bundle breakdown
Total: 800KB (gzipped)

├── react-vendor: 250KB
├── livekit: 180KB
├── @tanstack/react-query: 45KB
├── lucide-react: 35KB
├── components: 150KB
├── pages: 80KB
└── other: 60KB
```

---

## 📦 Bundle Optimization

### 1. Tree Shaking

```typescript
// ❌ Bad: Import entire library
import * as Lucide from 'lucide-react';

// ✅ Good: Import only what you need
import { Mic, MicOff, Settings } from 'lucide-react';

// ✅ Even better: Direct imports
import Mic from 'lucide-react/dist/esm/icons/mic';
```

### 2. Dynamic Imports for Heavy Libraries

```typescript
// Instead of static import
import { Chart } from 'recharts';

// Use dynamic import
const Chart = React.lazy(() =>
  import('recharts').then(module => ({ default: module.Chart }))
);
```

### 3. Optimize Tailwind CSS

```javascript
// tailwind.config.js
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // Safelist only necessary dynamic classes
  ],
  safelist: [
    // Only if you use dynamic class construction
    {
      pattern: /bg-(primary|secondary|accent)-500/,
    },
  ],
};
```

### 4. Module Preloading

```html
<!-- index.html -->
<link rel="modulepreload" href="/src/vendor/react-vendor.ts" />
<link rel="modulepreload" href="/src/vendor/livekit.ts" />
```

---

## 🎨 Rendering Optimization

### 1. React.memo for Expensive Components

```typescript
// ❌ Bad: Re-renders on every parent update
export const MessageBubble = ({ message }: { message: Message }) => {
  return <div>{message.content}</div>;
};

// ✅ Good: Only re-renders when message changes
export const MessageBubble = React.memo(({ message }: { message: Message }) => {
  return <div>{message.content}</div>;
}, (prevProps, nextProps) => {
  return prevProps.message.id === nextProps.message.id;
});
```

### 2. useMemo for Expensive Calculations

```typescript
// ❌ Bad: Recalculates on every render
const sortedMessages = messages.sort((a, b) =>
  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
);

// ✅ Good: Only recalculates when messages change
const sortedMessages = useMemo(
  () => [...messages].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ),
  [messages]
);
```

### 3. useCallback for Stable References

```typescript
// ❌ Bad: New function on every render
<Button onClick={() => sendMessage(message)}>Send</Button>;

// ✅ Good: Stable function reference
const handleSend = useCallback(() => {
  sendMessage(message);
}, [message, sendMessage]);

<Button onClick={handleSend}>Send</Button>;
```

### 4. Virtual Scrolling for Long Lists

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export function MessageList({ messages }: { messages: Message[] }) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated row height
    overscan: 5, // Render 5 extra rows above/below viewport
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <MessageBubble message={messages[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. Avoid Inline Functions in JSX

```typescript
// ❌ Bad: Creates new function every render
{messages.map(message => (
  <MessageBubble
    key={message.id}
    message={message}
    onEdit={(text) => editMessage(message.id, text)}
  />
))}

// ✅ Good: Stable function reference
const handleMessageEdit = useCallback((id: string, text: string) => {
  editMessage(id, text);
}, [editMessage]);

{messages.map(message => (
  <MessageBubble
    key={message.id}
    message={message}
    onEdit={(text) => handleMessageEdit(message.id, text)}
  />
))}
```

---

## ✂️ Code Splitting

### 1. Route-Based Splitting

```typescript
// App.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load pages
const HomeDashboard = lazy(() => import('@/pages/HomeDashboard'));
const TextChatPage = lazy(() => import('@/pages/chat/TextChatDirect'));
const VoiceOnlyPage = lazy(() => import('@/pages/chat/VoiceOnlyChat'));
const WithAvatarPage = lazy(() => import('@/pages/chat/WithAvatarChat'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
  </div>
);

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/home" element={<HomeDashboard />} />
          <Route path="/chat/text/:scenarioId" element={<TextChatPage />} />
          <Route path="/chat/voice-only" element={<VoiceOnlyPage />} />
          <Route path="/chat/with-avatar" element={<WithAvatarPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### 2. Feature-Based Splitting

```typescript
// features/chat/index.ts
export { ChatContainer } from './components/ChatContainer';
export { useChat } from './hooks/useChat';

// Lazy load heavy components
export const VoiceInput = lazy(() =>
  import('./components/VoiceInput').then(m => ({ default: m.VoiceInput }))
);

export const TTSControls = lazy(() =>
  import('./components/TTSControls').then(m => ({ default: m.TTSControls }))
);
```

### 3. Component Splitting

```typescript
// features/chat/components/ChatContainer.tsx
import { lazy, Suspense } from 'react';

// Lazy load settings modal
const SettingsModal = lazy(() => import('./SettingsModal'));

export function ChatContainer({ scenarioId }: { scenarioId: string }) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="chat-container">
      {/* Other components always loaded */}

      {showSettings && (
        <Suspense fallback={<div>Loading settings...</div>}>
          <SettingsModal onClose={() => setShowSettings(false)} />
        </Suspense>
      )}
    </div>
  );
}
```

---

## 🖼️ Asset Optimization

### 1. Image Optimization

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import viteImagemin from '@vheemstra/vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.8, 0.9] },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'removeEmptyAttrs', active: false },
        ],
      },
    }),
  ],
});
```

### 2. Lazy Load Images

```typescript
import { useState, useRef, useEffect } from 'react';

export function LazyImage({ src, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsLoaded(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={imgRef}
      src={isLoaded ? src : undefined}
      alt={alt}
      loading="lazy"
      {...props}
    />
  );
}
```

### 3. Font Optimization

```css
/* index.css */
/* Self-host fonts for better performance */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap; /* Prevent FOIT */
  src: url('/fonts/inter-regular.woff2') format('woff2');
}

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/fonts/inter-medium.woff2') format('woff2');
}
```

---

## 🌐 Network Optimization

### 1. API Response Caching with TanStack Query

```typescript
// features/chat/hooks/useChat.ts
export function useChat(scenarioId: string) {
  return useQuery({
    queryKey: ['chat', scenarioId],
    queryFn: () => chatService.getChatMessages(scenarioId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
```

### 2. Optimistic Updates

```typescript
export function useChatMutation(scenarioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: string) =>
      chatService.sendMessage(scenarioId, message),

    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['chat', scenarioId] });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(['chat', scenarioId]);

      // Optimistically update
      queryClient.setQueryData(['chat', scenarioId], (old) => [
        ...(old || []),
        { id: 'temp', content: newMessage, role: 'user', timestamp: new Date() },
      ]);

      return { previousMessages };
    },

    onError: (err, newMessage, context) => {
      // Rollback on error
      queryClient.setQueryData(['chat', scenarioId], context.previousMessages);
    },

    onSettled: () => {
      // Refetch on success/error
      queryClient.invalidateQueries({ queryKey: ['chat', scenarioId] });
    },
  });
}
```

### 3. Request Deduplication

```typescript
// TanStack Query automatically deduplicates requests
// No manual implementation needed

// Multiple components calling useChat('1'):
// ComponentA: useChat('1')
// ComponentB: useChat('1')
// ComponentC: useChat('1')
// Result: Only ONE network request
```

### 4. Prefetching

```typescript
// Prefetch scenarios on hover
export function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['chat', scenario.id],
      queryFn: () => chatService.getChatMessages(scenario.id),
    });
  };

  return (
    <Card onMouseEnter={handleMouseEnter}>
      <h3>{scenario.title}</h3>
    </Card>
  );
}
```

---

## 📊 Monitoring & Measurement

### 1. Web Vitals Tracking

```typescript
// lib/web-vitals.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

export function reportWebVitals() {
  onCLS(console.log);
  onFID(console.log);
  onFCP(console.log);
  onLCP(console.log);
  onTTFB(console.log);

  // Send to analytics
  onCLS((metric) => sendToAnalytics('CLS', metric));
  onFID((metric) => sendToAnalytics('FID', metric));
  onFCP((metric) => sendToAnalytics('FCP', metric));
  onLCP((metric) => sendToAnalytics('LCP', metric));
  onTTFB((metric) => sendToAnalytics('TTFB', metric));
}
```

### 2. Performance Profiling

```typescript
// App.tsx
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  if (actualDuration > 16) { // More than one frame
    console.warn(`${id} ${phase} took ${actualDuration}ms`);
  }
}

export function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <Router />
    </Profiler>
  );
}
```

### 3. Bundle Analysis

```bash
# Install bundle analyzer
npm install -D rollup-plugin-visualizer

# vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});

# Run build to generate stats
npm run build
```

### 4. Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            http://localhost:3000/home
            http://localhost:3000/chat/text/1
          uploadArtifacts: true
          temporaryPublicStorage: true
```

---

## 🎯 Performance Optimization Checklist

### High Priority (Week 1-2)

- [ ] Implement code splitting for routes
- [ ] Lazy load heavy components (LiveKit, Avatar)
- [ ] Optimize images (WebP, compression)
- [ ] Add React.memo to expensive components
- [ ] Implement virtual scrolling for message lists
- [ ] Cache API responses with TanStack Query

### Medium Priority (Week 3-4)

- [ ] Optimize bundle size (tree shaking, dynamic imports)
- [ ] Implement optimistic updates
- [ ] Add request deduplication
- [ ] Prefetch resources on hover
- [ ] Optimize fonts (font-display: swap)
- [ ] Minimize re-renders with useMemo/useCallback

### Low Priority (Week 5-6)

- [ ] Set up performance monitoring
- [ ] Implement Web Vitals tracking
- [ ] Add bundle analysis to CI/CD
- [ ] Configure Lighthouse CI
- [ ] Optimize third-party scripts
- [ ] Implement service worker for caching

---

## 📈 Expected Performance Improvements

### Before vs After

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Bundle Size** | 800KB | 640KB | -20% |
| **FCP** | 2.0s | 1.0s | -50% |
| **LCP** | 3.5s | 2.0s | -43% |
| **TTI** | 3.5s | 2.0s | -43% |
| **Lighthouse** | 60 | 90 | +50% |
| **Initial Load** | 3.5s | 2.0s | -43% |

---

## 🔧 Tools & Resources

### Development Tools

```bash
# Performance profiling
npm install -D @vitejs/plugin-visualizer

# Bundle analyzer
npm install -D rollup-plugin-visualizer

# Web vitals
npm install web-vitals

# Lighthouse CI
npm install -D @lhci/cli
```

### Browser Tools

- **Chrome DevTools**: Performance tab, Lighthouse
- **React DevTools**: Profiler
- **Network tab**: Waterfall analysis
- **Coverage tab**: Identify unused code

### Online Tools

- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [Bundlephobia](https://bundlephobia.com/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

**Document Version:** 1.0
**Last Updated:** 2025-01-29
**Authors:** SAke E-Learning Team
