# Architecture Diagrams - React + Vite Refactoring

Visual diagrams representing the current and target architecture for the SAke E-Learning V3 refactoring.

---

## 📊 Table of Contents

1. [Current Architecture](#current-architecture)
2. [Target Architecture](#target-architecture)
3. [Component Decomposition](#component-decomposition)
4. [State Management Flow](#state-management-flow)
5. [Data Flow Patterns](#data-flow-patterns)
6. [Feature Module Structure](#feature-module-structure)
7. [Testing Strategy](#testing-strategy)

---

## 🏗️ Current Architecture

### High-Level Overview

```mermaid
graph TB
    subgraph "Current Architecture"
        A[User] --> B[React Router - HashRouter]
        B --> C[Pages]
        C --> D[Components]
        C --> E[Contexts]
        D --> F[Services]
        E --> F
        F --> G[External APIs]

        H[util/] --> D
        I[utils/] --> D
    end

    style A fill:#3b82f6
    style B fill:#a855f7
    style F fill:#06b6d4
    style G fill:#ef4444
```

### Current Component Structure

```mermaid
graph TD
    A[App.tsx] --> B[AuthContext]
    A --> C[UserContext]
    A --> D[HashRouter]

    D --> E[HomeDashboard]
    D --> F[TextChatDirect]
    D --> G[VoiceOnlyChat]
    D --> H[WithAvatarChat]

    E --> I[Card Component]
    F --> J[TextChatUI - 1,139 lines!]
    G --> K[AudioOnlyChat]
    H --> L[BeyAvatar]

    J --> M[TTS Services]
    J --> N[Gemini Service]
    J --> O[Voice Recording]

    style J fill:#ef4444
    style H fill:#f59e0b
```

### Current State Management

```mermaid
graph LR
    subgraph "Current State (Fragmented)"
        A[useState]
        B[Context API]
        C[localStorage]
        D[Service Layer]
    end

    A --> E[Local UI State]
    B --> F[Auth/User State]
    C --> G[Persistence]
    D --> H[API Calls]

    style A fill:#fbbf24
    style B fill:#a855f7
    style C fill:#06b6d4
    style D fill:#3b82f6
```

---

## 🎯 Target Architecture

### Future High-Level Overview

```mermaid
graph TB
    subgraph "Target Architecture"
        A[User] --> B[React Router - HashRouter]
        B --> C[Pages - Thin Controllers]
        C --> D[Feature Modules]
        D --> E[UI Components]
        D --> F[Custom Hooks]
        D --> G[Feature Services]

        H[TanStack Query] --> I[Server State]
        J[Zustand Stores] --> K[Client State]
        L[React Context] --> M[Auth State]

        E --> N[Design Tokens]
    end

    style D fill:#22c55e
    style H fill:#3b82f6
    style J fill:#a855f7
    style N fill:#06b6d4
```

### Target Component Structure

```mermaid
graph TD
    A[App.tsx] --> B[Providers]
    B --> C[QueryClientProvider]
    B --> D[AuthContext]
    B --> E[Router]

    E --> F[HomeDashboard]
    E --> G[TextChatPage]
    E --> H[VoiceOnlyPage]
    E --> I[AvatarChatPage]

    G --> J[features/chat/]
    J --> K[ChatContainer]
    J --> L[MessageList]
    J --> M[MessageBubble]
    J --> N[ChatInput]
    J --> O[VoiceInput]
    J --> P[TTSControls]

    K --> Q[useChatQuery]
    K --> R[useChatStore]

    style J fill:#22c55e
    style Q fill:#3b82f6
    style R fill:#a855f7
```

---

## 🔧 Component Decomposition

### TextChatUI Decomposition

```mermaid
graph TD
    A[TextChatUI.tsx<br/>1,139 lines] --> B[8 Smaller Components]

    B --> C[ChatContainer<br/>~100 lines]
    B --> D[MessageList<br/>~80 lines]
    B --> E[MessageBubble<br/>~60 lines]
    B --> F[CorrectionTip<br/>~40 lines]
    B --> G[ChatInput<br/>~50 lines]
    B --> H[VoiceInput<br/>~80 lines]
    B --> I[TTSControls<br/>~40 lines]
    B --> J[SettingsModal<br/>~60 lines]

    D --> E
    E --> F
    C --> G
    C --> H
    C --> I
    C --> J

    style A fill:#ef4444
    style C fill:#22c55e
    style D fill:#22c55e
    style E fill:#22c55e
```

### Before/After File Structure

```mermaid
graph TD
    subgraph "Before"
        A1[components/]
        A1 --> B1[TextChatUI.tsx - 1,139 lines]
        A1 --> C1[GeminiVoiceChat.tsx - 306 lines]
        A1 --> D1[AudioOnlyChat.tsx - 200 lines]

        E1[util/]
        F1[utils/]
    end

    subgraph "After"
        A2[features/]
        A2 --> B2[chat/]
        B2 --> C2[components/]
        C2 --> D2[ChatContainer.tsx - 100 lines]
        C2 --> E2[MessageList.tsx - 80 lines]
        C2 --> F2[MessageBubble.tsx - 60 lines]

        B2 --> G2[hooks/]
        G2 --> H2[useChat.ts]
        G2 --> I2[useTTS.ts]

        B2 --> J2[services/]
        J2 --> K2[chatService.ts]

        L2[components/ui/]
        L2 --> M2[Button/]
        L2 --> N2[Input/]
        L2 --> O2[Modal/]

        P2[lib/]
    end

    style B1 fill:#ef4444
    style D2 fill:#22c55e
    style E2 fill:#22c55e
    style F2 fill:#22c55e
```

---

## 🔄 State Management Flow

### New State Management Architecture

```mermaid
graph TB
    subgraph "State Management Layers"
        A[Component] --> B{What State?}

        B -->|Server Data| C[TanStack Query]
        B -->|Client UI| D[Zustand Store]
        B -->|Auth/User| E[React Context]
        B -->|Form State| F[React Hook Form]
        B -->|Local UI| G[useState]

        C --> H[API Services]
        C --> I[Cache + Revalidation]

        D --> J[Persistent State]
        D --> K[Ephemeral UI State]

        E --> L[Auth Context]
        E --> M[User Context]

        F --> N[Zod Validation]

        G --> O[Component State]
    end

    style C fill:#3b82f6
    style D fill:#a855f7
    style E fill:#06b6d4
    style F fill:#22c55e
    style G fill:#fbbf24
```

### Data Fetching Flow

```mermaid
sequenceDiagram
    participant C as Component
    participant H as useChatQuery Hook
    participant Q as TanStack Query
    participant S as API Service
    participant A as External API

    C->>H: useChatQuery(scenarioId)
    H->>Q: fetchQuery()
    Q->>S: getChatScenario(id)
    S->>A: GET /api/scenarios/:id
    A-->>S: Response Data
    S-->>Q: Resolved Data
    Q-->>H: Cached Data
    H-->>C: { data, isLoading, error }

    Note over C,A: Subsequent calls use cache
    C->>H: useChatQuery(scenarioId)
    H->>Q: fetchQuery()
    Q-->>H: Cached Data (instant)
    H-->>C: { data, isLoading: false }
```

---

## 📊 Data Flow Patterns

### Chat Feature Data Flow

```mermaid
graph TD
    A[User Input] --> B{Input Type?}

    B -->|Text| C[ChatInput]
    B -->|Voice| D[VoiceInput]

    C --> E[useChatMutation]
    D --> F[useVoiceRecording]

    E --> G[chatService.sendMessage]
    F --> H[transcriptionService]

    H --> I[chatService.sendMessage]
    G --> J[API Layer]
    I --> J

    J --> K[TanStack Query Mutation]
    K --> L[Optimistic Update]

    L --> M[Query Cache Update]
    M --> N[Component Re-render]

    style E fill:#3b82f6
    style F fill:#a855f7
    style K fill:#22c55e
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant L as LoginPage
    participant C as AuthContext
    participant Q as TanStack Query
    participant A as authService

    U->>L: Enter credentials
    L->>C: login(email, password)
    C->>Q: useMutation(authService.login)
    Q->>A: POST /api/auth/login
    A-->>Q: { user, token }
    Q-->>C: Set auth state
    C->>C: localStorage.setItem('token')
    C-->>L: Redirect to /home
    L-->>U: Dashboard
```

---

## 🧩 Feature Module Structure

### Chat Feature Module

```mermaid
graph TD
    subgraph "features/chat/"
        A[index.ts]

        subgraph "components/"
            B[ChatContainer.tsx]
            C[MessageList.tsx]
            D[MessageBubble.tsx]
            E[CorrectionTip.tsx]
            F[ChatInput.tsx]
            G[VoiceInput.tsx]
            H[TTSControls.tsx]
            I[SettingsModal.tsx]
        end

        subgraph "hooks/"
            J[useChat.ts]
            K[useChatMutation.ts]
            L[useVoiceInput.ts]
            M[useTTS.ts]
        end

        subgraph "services/"
            N[chatService.ts]
            O[transcriptionService.ts]
        end

        subgraph "types.ts"
            P[ChatMessage]
            Q[ChatScenario]
            R[VoiceConfig]
        end

        A --> B
        A --> J
        A --> N
        A --> P
    end

    style A fill:#06b6d4
    style J fill:#3b82f6
    style N fill:#a855f7
```

### TTS Feature Module

```mermaid
graph TD
    subgraph "features/tts/"
        A[index.ts]

        subgraph "components/"
            B[TTSSelector.tsx]
            C[VoiceSettings.tsx]
            D[PlaybackControls.tsx]
        end

        subgraph "hooks/"
            E[useTTS.ts]
            F[useTTSCache.ts]
        end

        subgraph "services/"
            G[ttsService.ts]
            H[elevenLabsService.ts]
            I[webSpeechService.ts]
        end

        subgraph "types.ts"
            J[TTSProvider]
            K[TTSConfig]
            L[Voice]
        end
    end

    style A fill:#06b6d4
```

---

## 🧪 Testing Strategy

### Test Pyramid

```mermaid
graph TD
    A[Test Pyramid] --> B[E2E Tests - 10%]
    A --> C[Integration Tests - 30%]
    A --> D[Unit Tests - 60%]

    B --> E[Playwright]
    B --> F[Critical User Flows]

    C --> G[Vitest + MSW]
    C --> H[Feature Integration]

    D --> I[Vitest + Testing Library]
    D --> J[Components, Hooks, Utils]

    style D fill:#22c55e
    style C fill:#3b82f6
    style B fill:#a855f7
```

### Unit Test Coverage

```mermaid
graph LR
    subgraph "What to Test"
        A[Components]
        B[Custom Hooks]
        C[Utilities]
        D[Services]
    end

    subgraph "Test Types"
        E[Rendering]
        F[User Interactions]
        G[State Changes]
        H[API Calls]
    end

    A --> E
    A --> F
    B --> G
    C --> H
    D --> H

    style A fill:#3b82f6
    style B fill:#a855f7
    style C fill:#22c55e
    style D fill:#06b6d4
```

---

## 🎯 Component Composition Patterns

### Container vs Presentational Components

```mermaid
graph TD
    subgraph "Smart Component (Container)"
        A[ChatContainer]
        A --> B[useChatQuery]
        A --> C[useChatStore]
        A --> D[useChatMutation]
    end

    subgraph "Dumb Components (Presentational)"
        E[MessageList]
        F[MessageBubble]
        G[ChatInput]
        H[TTSControls]
    end

    A --> E
    E --> F
    A --> G
    A --> H

    style A fill:#a855f7
    style E fill:#22c55e
    style F fill:#22c55e
```

---

## 📦 File Organization

### Target Directory Structure

```mermaid
graph TD
    A[src/]
    A --> B[app/]
    A --> C[components/]
    A --> D[features/]
    A --> E[hooks/]
    A --> F[lib/]
    A --> G[stores/]
    A --> H[contexts/]
    A --> I[services/]
    A --> J[tokens/]
    A --> K[types/]
    A --> L[pages/]

    C --> M[ui/]

    D --> N[chat/]
    D --> O[tts/]
    D --> P[recording/]
    D --> Q[auth/]

    N --> R[components/]
    N --> S[hooks/]
    N --> T[services/]
    N --> U[types.ts]

    style D fill:#22c55e
    style M fill:#3b82f6
    style N fill:#a855f7
```

---

## 🚀 Performance Optimization

### Code Splitting Strategy

```mermaid
graph TD
    A[App.tsx] --> B[React.lazy()]

    B --> C[HomeDashboard]
    B --> D[ChatPages]
    B --> E[AvatarPages]

    D --> F[Suspense Fallback]
    E --> F

    C --> G[Route-based Chunk]
    D --> H[Route-based Chunk]
    E --> I[Route-based Chunk]

    style B fill:#3b82f6
    style F fill:#fbbf24
```

### Bundle Size Reduction

```mermaid
graph LR
    A[Before] --> B[800KB JS Bundle]

    C[After] --> D[150KB JS Bundle]

    B --> E[-81% Bundle Size]
    D --> E

    style B fill:#ef4444
    style D fill:#22c55e
    style E fill:#06b6d4
```

---

## 📊 Migration Progress

### Refactoring Phases

```mermaid
graph TD
    A[Phase 1: Foundation<br/>Week 1-2] --> B[Phase 2: State<br/>Week 2-3]
    B --> C[Phase 3: Design<br/>Week 3-4]
    C --> D[Phase 4: Components<br/>Week 4-5]
    D --> E[Phase 5: Structure<br/>Week 5-6]
    E --> F[Phase 6: Performance<br/>Week 6-7]
    F --> G[Phase 7: Testing<br/>Week 7-8]

    style A fill:#fbbf24
    style B fill:#3b82f6
    style C fill:#22c55e
    style D fill:#a855f7
    style E fill:#06b6d4
    style F fill:#ef4444
    style G fill:#ec4899
```

---

## 🎯 Success Metrics

### Target vs Current

```mermaid
graph LR
    subgraph "Current State"
        A1[Component Size]
        A1 --> B1[Up to 1,139 lines]

        C1[Test Coverage]
        C1 --> D1[0%]

        E1[Bundle Size]
        E1 --> F1[800KB]
    end

    subgraph "Target State"
        A2[Component Size]
        A2 --> B2[< 300 lines]

        C2[Test Coverage]
        C2 --> D2[80%+]

        E2[Bundle Size]
        E2 --> F2[640KB -20%]
    end

    style B1 fill:#ef4444
    style D1 fill:#ef4444
    style F1 fill:#fbbf24

    style B2 fill:#22c55e
    style D2 fill:#22c55e
    style F2 fill:#22c55e
```

---

## 🔗 Integration Points

### External Services

```mermaid
graph TD
    A[SAke E-Learning App] --> B[LiveKit]
    A --> C[Gemini Live API]
    A --> D[ElevenLabs TTS]
    A --> E[Backend API]

    B --> F[Real-time Audio]
    C --> G[AI Chat]
    D --> H[Voice Synthesis]
    E --> I[Auth, Scenarios, Progress]

    style A fill:#3b82f6
    style B fill:#a855f7
    style C fill:#06b6d4
    style D fill:#22c55e
    style E fill:#ef4444
```

---

**Document Version:** 1.0
**Last Updated:** 2025-01-29
**Authors:** SAke E-Learning Team

All diagrams created with Mermaid syntax. View in compatible markdown renderers like GitHub, GitLab, or with Mermaid live editor.
