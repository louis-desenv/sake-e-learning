# Testing Guide - React + Vite Refactoring

Complete testing strategy and implementation guide for the SAke E-Learning V3 refactoring.

---

## 📋 Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Stack](#testing-stack)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [E2E Testing](#e2e-testing)
6. [Testing Best Practices](#testing-best-practices)
7. [Coverage Targets](#coverage-targets)
8. [CI/CD Integration](#cicd-integration)

---

## 🎯 Testing Philosophy

### Testing Pyramid

```
           E2E Tests
          /          \
         /  10%       \        Playwright
        /--------------\
       /  Integration   \
      /      30%         \     Vitest + MSW
     /--------------------\
    /     Unit Tests       \
   /          60%           \  Vitest + Testing Library
  /--------------------------\
```

### Principles

1. **Test user behavior, not implementation**
2. **Tests should be fast and reliable**
3. **One assertion per test when possible**
4. **Arrange, Act, Assert pattern**
5. **Tests should be independent**
6. **Mock external dependencies**
7. **Test edge cases and error states**

---

## 🛠️ Testing Stack

### Core Libraries

```json
{
  "testing": {
    "unit": "Vitest + Testing Library",
    "integration": "Vitest + MSW",
    "e2e": "Playwright",
    "coverage": "Vitest built-in (v8)",
    "mocking": "Vitest + MSW"
  }
}
```

### Why This Stack?

| Library | Purpose | Why? |
|---------|---------|------|
| **Vitest** | Test runner | Native Vite integration, faster than Jest |
| **Testing Library** | Component testing | User-centric, resilient to DOM changes |
| **MSW** | API mocking | Network-level mocking, service worker |
| **Playwright** | E2E testing | Cross-browser, fast, reliable |

---

## 🧪 Unit Testing

### Component Testing

#### Example: Button Component

```typescript
// components/ui/button/Button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies correct variant classes', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary-500');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-secondary-500');
  });

  it('shows loading state when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

#### Example: MessageBubble Component

```typescript
// components/chat/MessageBubble.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from './MessageBubble';

describe('MessageBubble', () => {
  const mockMessage = {
    id: '1',
    content: 'Hello, world!',
    role: 'user' as const,
    timestamp: new Date('2025-01-29T10:00:00Z'),
  };

  it('renders user message correctly', () => {
    render(<MessageBubble message={mockMessage} />);

    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    expect(screen.getByTestId('message-bubble')).toHaveClass('bg-primary-500');
  });

  it('renders AI message correctly', () => {
    render(<MessageBubble message={{ ...mockMessage, role: 'assistant' }} />);

    expect(screen.getByTestId('message-bubble')).toHaveClass('bg-gray-100');
  });

  it('displays correction tip when present', () => {
    render(
      <MessageBubble
        message={{
          ...mockMessage,
          correction: {
            original: 'Hello wolrd!',
            corrected: 'Hello, world!',
            explanation: 'Spelling correction',
          },
        }}
      />
    );

    expect(screen.getByText(/hello wolrd/i)).toBeInTheDocument();
    expect(screen.getByText(/spelling correction/i)).toBeInTheDocument();
  });

  it('formats timestamp correctly', () => {
    render(<MessageBubble message={mockMessage} />);

    expect(screen.getByText(/10:00/i)).toBeInTheDocument();
  });

  it('shows TTS controls when enabled', () => {
    render(<MessageBubble message={mockMessage} enableTTS />);

    expect(screen.getByRole('button', { name: /play tts/i })).toBeInTheDocument();
  });
});
```

### Custom Hook Testing

#### Example: useChat Hook

```typescript
// features/chat/hooks/useChat.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChat } from './useChat';
import * as chatService from '../services/chatService';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useChat', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads chat messages on mount', async () => {
    vi.spyOn(chatService, 'getChatMessages').mockResolvedValue([
      { id: '1', content: 'Hello', role: 'user' },
      { id: '2', content: 'Hi there!', role: 'assistant' },
    ]);

    const { result } = renderHook(() => useChat('scenario-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.messages).toHaveLength(2);
    expect(chatService.getChatMessages).toHaveBeenCalledWith('scenario-1');
  });

  it('sends message and updates list', async () => {
    const user = userEvent.setup();
    vi.spyOn(chatService, 'sendMessage').mockResolvedValue({
      id: '3',
      content: 'Test message',
      role: 'assistant',
    });

    const { result } = renderHook(() => useChat('scenario-1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    expect(chatService.sendMessage).toHaveBeenCalledWith('scenario-1', 'Test message');
    expect(result.current.messages).toContainEqual({
      id: '3',
      content: 'Test message',
      role: 'assistant',
    });
  });

  it('handles send message error', async () => {
    vi.spyOn(chatService, 'sendMessage').mockRejectedValue(
      new Error('Failed to send')
    );

    const { result } = renderHook(() => useChat('scenario-1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.sendMessage('Test');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    expect(result.current.error).toBeTruthy();
  });
});
```

### Utility Testing

#### Example: cn Utility

```typescript
// lib/cn.test.ts
import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('deduplicates Tailwind classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('handles undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });
});
```

---

## 🔗 Integration Testing

### API Integration with MSW

#### Setup MSW Handlers

```typescript
// test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json();

    if (email === 'test@example.com' && password === 'password') {
      return HttpResponse.json({
        user: { id: '1', email, name: 'Test User', avatar: null },
        token: 'mock-jwt-token',
      });
    }

    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  // Chat scenarios
  http.get('/api/scenarios', () => {
    return HttpResponse.json([
      { id: '1', title: 'Restaurant', difficulty: 'Beginner', description: 'Order food' },
      { id: '2', title: 'Airport', difficulty: 'Intermediate', description: 'Check-in' },
      { id: '3', title: 'Job Interview', difficulty: 'Advanced', description: 'Interview skills' },
    ]);
  }),

  // Chat messages
  http.get('/api/scenarios/:id/messages', ({ params }) => {
    return HttpResponse.json([
      { id: '1', role: 'assistant', content: 'Hello! How can I help you?' },
    ]);
  }),

  http.post('/api/scenarios/:id/messages', async ({ request, params }) => {
    const { message } = await request.json();

    return HttpResponse.json({
      id: '2',
      role: 'assistant',
      content: `You said: ${message}`,
    });
  }),
];
```

#### Integration Test Example

```typescript
// features/chat/integration/chat.integration.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { HttpResponse } from 'msw';
import { ChatContainer } from '../components/ChatContainer';
import { handlers } from '@/test/mocks/handlers';

const server = setupServer(...handlers);

describe('Chat Integration', () => {
  let queryClient: QueryClient;

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('loads and displays chat messages', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChatContainer scenarioId="1" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/hello! how can i help/i)).toBeInTheDocument();
    });
  });

  it('sends message and receives response', async () => {
    server.use(
      http.post('/api/scenarios/1/messages', async () => {
        return HttpResponse.json({
          id: '2',
          role: 'assistant',
          content: 'Response to your message',
        });
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <ChatContainer scenarioId="1" />
      </QueryClientProvider>
    );

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await userEvent.type(input, 'Hello');
    await userEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/response to your message/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    server.use(
      http.get('/api/scenarios/1/messages', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <ChatContainer scenarioId="1" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});
```

---

## 🎭 E2E Testing

### Playwright Setup

#### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### E2E Test Example

```typescript
// e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/home');
  });

  test('displays chat scenarios', async ({ page }) => {
    await page.goto('/home');

    await expect(page.locator('text=Restaurant')).toBeVisible();
    await expect(page.locator('text=Airport')).toBeVisible();
    await expect(page.locator('text=Job Interview')).toBeVisible();
  });

  test('starts chat conversation', async ({ page }) => {
    await page.goto('/home');
    await page.click('text=Restaurant');

    await expect(page).toHaveURL(/\/chat\/text/);
    await expect(page.locator('text=Hello! How can I help')).toBeVisible();

    // Send message
    await page.fill('textarea[placeholder*="Type a message"]', 'I want to order food');
    await page.click('button[aria-label="Send message"]');

    // Wait for response
    await expect(page.locator('text=You said: I want to order food')).toBeVisible();
  });

  test('uses voice input', async ({ page }) => {
    await page.goto('/chat/text/1');

    const micButton = page.locator('button[aria-label="Start recording"]');
    await micButton.click();

    await expect(page.locator('text=Recording...')).toBeVisible();

    // Stop recording after simulation
    await page.waitForTimeout(2000);
    await micButton.click();

    await expect(page.locator('text=Processing...')).toBeVisible();
  });

  test('displays settings modal', async ({ page }) => {
    await page.goto('/chat/text/1');

    await page.click('button[aria-label="Open settings"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Text-to-Speech')).toBeVisible();
  });
});

test.describe('Authentication', () => {
  test('logs in successfully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/home');
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/home');

    await expect(page).toHaveURL('/login');
  });
});
```

---

## 📚 Testing Best Practices

### 1. Test User Behavior, Not Implementation

❌ **Bad: Tests implementation details**
```typescript
it('calls useState with correct value', () => {
  const setState = vi.fn();
  // Tests internal state management
});
```

✅ **Good: Tests user behavior**
```typescript
it('updates text when user types', async () => {
  const user = userEvent.setup();
  render(<TextInput />);

  await user.type(screen.getByRole('textbox'), 'Hello');

  expect(screen.getByRole('textbox')).toHaveValue('Hello');
});
```

### 2. Use Test IDs Sparingly

❌ **Bad: Over-reliance on test IDs**
```typescript
screen.getByTestId('message-bubble-123');
```

✅ **Good: Use accessible queries**
```typescript
screen.getByText('Hello, world!');
screen.getByRole('button', { name: 'Send' });
```

### 3. Mock External Dependencies

```typescript
// Mock LiveKit
vi.mock('@livekit/components-react', () => ({
  useRoom: () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    participants: [],
  }),
}));

// Mock Gemini API
vi.mock('@/services/geminiService', () => ({
  generateResponse: vi.fn().mockResolvedValue('Mock response'),
}));
```

### 4. Test Error States

```typescript
it('handles network errors', async () => {
  vi.spyOn(chatService, 'sendMessage').mockRejectedValue(
    new Error('Network error')
  );

  const { result } = renderHook(() => useChat('1'), {
    wrapper: createWrapper(),
  });

  await act(async () => {
    try {
      await result.current.sendMessage('Test');
    } catch (error) {
      expect(error.message).toBe('Network error');
    }
  });

  expect(result.current.error).toBeTruthy();
});
```

### 5. Use waitFor for Async Operations

```typescript
await waitFor(() => {
  expect(screen.getByText('Response received')).toBeInTheDocument();
});
```

---

## 🎯 Coverage Targets

### Goals by Category

| Category | Target | Priority |
|----------|--------|----------|
| **Components** | 80%+ | High |
| **Custom Hooks** | 90%+ | High |
| **Utilities** | 95%+ | High |
| **Services** | 70%+ | Medium |
| **Pages** | 60%+ | Medium |
| **Types** | N/A | N/A |

### Exclusions

```typescript
// vitest.config.ts
coverage: {
  exclude: [
    'node_modules/',
    'src/test/',
    '**/*.d.ts',
    '**/*.config.*',
    '**/mockData',
    'src/types/', // Type definitions
    'src/tokens/', // Constants
  ],
}
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

      - name: Build application
        run: npm run build

  e2e:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📝 Testing Checklist

### Before Writing Tests

- [ ] Understand the component/hook behavior
- [ ] Identify user interactions
- [ ] List edge cases and error states
- [ ] Determine what to mock

### Writing Tests

- [ ] Test happy path
- [ ] Test error cases
- [ ] Test loading states
- [ ] Test edge cases
- [ ] Use descriptive test names
- [ ] Follow AAA pattern (Arrange, Act, Assert)
- [ ] Keep tests independent

### After Writing Tests

- [ ] All tests pass
- [ ] Coverage meets targets
- [ ] Tests run quickly
- [ ] No flaky tests
- [ ] Code review completed

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module"

**Solution:** Check `vitest.config.ts` resolve.alias matches `tsconfig.json`

### Issue: Tests timing out

**Solution:** Increase timeout or use `waitFor` instead of fixed timeouts

### Issue: Flaky tests

**Solution:**
- Use `waitFor` instead of `waitForElementToBeRemoved`
- Mock time-dependent operations
- Ensure proper cleanup

### Issue: MSW not intercepting requests

**Solution:**
- Ensure `setupServer` is called in tests
- Check URL patterns match exactly
- Verify server is listening (`beforeAll`)

---

**Document Version:** 1.0
**Last Updated:** 2025-01-29
**Authors:** SAke E-Learning Team
