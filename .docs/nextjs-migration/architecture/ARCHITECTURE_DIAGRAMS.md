# Architecture Diagrams

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Browser]
        PWA[PWA App]
    end

    subgraph "Next.js 15 Application"
        subgraph "Server Components"
            SC[Server Components<br/>Data Fetching<br/>SEO<br/>Direct DB Access]
        end

        subgraph "Client Components"
            CC[Client Components<br/>Interactive UI<br/>Browser APIs<br/>Real-time Features]
        end

        subgraph "API Layer"
            SA[Server Actions<br/>Mutations<br/>Form Handling]
            RH[Route Handlers<br/>Webhooks<br/>External APIs]
        end

        subgraph "Middleware"
            MW[Auth Middleware<br/>Route Protection<br/>Rate Limiting]
        end
    end

    subgraph "External Services"
        Gemini[Gemini Live API<br/>Real-time Voice AI]
        LiveKit[LiveKit<br/>Video/Audio Streaming]
        ElevenLabs[ElevenLabs<br/>Text-to-Speech]
        GoogleOAuth[Google OAuth<br/>Authentication]
    end

    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL<br/>User Data<br/>Chat History<br/>Progress)]
        Redis[(Redis<br/>Session Cache<br/>Real-time State)]
        S3[S3<br/>Audio Files<br/>User Assets]
    end

    Browser --> MW
    PWA --> MW
    MW --> SC
    MW --> CC
    SC --> SA
    SC --> RH
    CC --> SA
    CC --> RH
    SC --> PostgreSQL
    SA --> PostgreSQL
    RH --> Gemini
    CC --> LiveKit
    CC --> Gemini
    RH --> ElevenLabs
    RH --> LiveKit
    SC --> Redis
    CC --> Redis
    SA --> S3
```

## Data Flow: Text Chat

```mermaid
sequenceDiagram
    participant User
    participant SC as Server Component
    participant SA as Server Action
    participant DB as Database
    participant Gemini as Gemini API

    User->>SC: Load Chat Page
    SC->>DB: Fetch Chat History
    DB-->>SC: Return Messages
    SC-->>User: Render Initial UI

    User->>SA: Send Message (Server Action)
    SA->>DB: Save User Message
    SA->>Gemini: Call Gemini Chat
    Gemini-->>SA: AI Response
    SA->>DB: Save AI Response
    SA-->>User: Update UI (Revalidation)
    DB-->>User: Refreshed Chat History
```

## Data Flow: Voice Chat with Gemini Live

```mermaid
sequenceDiagram
    participant User
    participant CC as Client Component
    participant WS as WebSocket
    participant Gemini as Gemini Live API
    participant TTS as TTS Service

    User->>CC: Start Voice Chat
    CC->>WS: Connect (with token)
    WS-->>CC: Connected

    loop Real-time Audio
        User->>CC: Speak (Microphone)
        CC->>WS: Send Audio Chunks
        WS->>Gemini: Stream Audio
        Gemini-->>WS: Transcription
        WS-->>CC: Display User Text
        Gemini-->>WS: AI Response
        WS-->>CC: AI Transcription
        WS-->>CC: Audio Response
        CC->>User: Play Audio
    end

    User->>CC: End Chat
    CC->>WS: Close Connection
    WS->>Gemini: End Session
```

## Component Architecture

```mermaid
graph TB
    subgraph "App Router Structure"
        Root[Root Layout]

        subgraph "Auth Group (auth)"
            AuthLayout[Auth Layout]
            Login[Login Page]
            Register[Register Page]
            GoogleCallback[Google Callback Route]
        end

        subgraph "App Group (app)"
            AppLayout[App Layout<br/>Bottom Nav<br/>Header]

            subgraph "Pages"
                Home[Home Dashboard]
                ChatText[Text Chat]
                ChatVoice[Voice Chat]
                ChatAvatar[Avatar Chat]
                Library[Scenario Library]
                Profile[User Profile]
            end
        end
    end

    Root --> AuthLayout
    Root --> AppLayout
    AuthLayout --> Login
    AuthLayout --> Register
    AuthLayout --> GoogleCallback
    AppLayout --> Home
    AppLayout --> ChatText
    AppLayout --> ChatVoice
    AppLayout --> ChatAvatar
    AppLayout --> Library
    AppLayout --> Profile
```

## State Management Architecture

```mermaid
graph LR
    subgraph "Server State"
        DB[(Database)]
        Cache[(Cache)]
    end

    subgraph "Server Components"
        SC1[Page Components]
        SC2[Data Fetching]
    end

    subgraph "Client State"
        ZS[Zustand Stores<br/>UI State<br/>Local State]
        TQ[TanStack Query<br/>Server State<br/>Caching]
    end

    subgraph "Browser APIs"
        LocalStorage[Local Storage<br/>Persistence]
        SessionStorage[Session Storage]
    end

    DB --> SC1
    Cache --> SC1
    SC1 --> TQ
    TQ --> ZS
    ZS --> LocalStorage
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Login as Login Page
    participant SA as Server Action
    participant NextAuth as NextAuth.js
    participant DB as Database
    participant MW as Middleware

    User->>Login: Enter Credentials
    Login->>SA: Login Action
    SA->>NextAuth: Authenticate
    NextAuth->>DB: Verify User
    DB-->>NextAuth: User Data
    NextAuth-->>SA: Session Token
    SA->>DB: Create Session
    SA-->>Login: Redirect to /home

    Note over User,MW: Subsequent Requests

    User->>MW: Navigate to /home
    MW->>NextAuth: Verify Session
    NextAuth-->>MW: Session Valid
    MW-->>User: Allow Access
```

## Real-time Audio Processing

```mermaid
graph TB
    subgraph "Audio Input"
        Mic[Microphone]
        Stream[Media Stream]
    end

    subgraph "Processing"
        Script[Script Processor]
        PCM[PCM Encoder]
        Base64[Base64 Encoder]
    end

    subgraph "Transmission"
        WS[WebSocket]
        Gemini[Gemini Live API]
    end

    subgraph "Output"
        Decoder[Audio Decoder]
        Context[Audio Context]
        Speaker[Speakers]
    end

    Mic --> Stream
    Stream --> Script
    Script --> PCM
    PCM --> Base64
    Base64 --> WS
    WS --> Gemini
    Gemini --> WS
    WS --> Decoder
    Decoder --> Context
    Context --> Speaker
```

## Caching Strategy

```mermaid
graph TB
    subgraph "Next.js Cache"
        ISR[ISR<br/>Revalidate: 1h]
        Tag[Tag-based<br/>On-demand]
    end

    subgraph "Data Cache"
        Redis[Redis<br/>Session Data]
        Mem[In-Memory<br/>Frequent Data]
    end

    subgraph "Client Cache"
        TQ[TanStack Query<br/>5 min stale]
        Local[LocalStorage<br/>User Preferences]
    end

    subgraph "CDN"
        Vercel[Vercel Edge<br/>Static Assets]
    end

    ISR --> Tag
    Tag --> Redis
    Redis --> TQ
    TQ --> Local
    ISR --> Vercel
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production"
        subgraph "Vercel"
            Edge[Edge Functions]
            Server[Serverless Functions]
            Static[Static Assets]
        end

        subgraph "Railway/Render"
            API1[Gemini Service]
            API2[LiveKit Service]
            API3[TTS Service]
        end

        subgraph "Cloud Services"
            RDS[(PostgreSQL)]
            S3[(S3 Storage)]
            LiveKitCloud[LiveKit Cloud]
        end
    end

    Edge --> Server
    Server --> API1
    Server --> API2
    Server --> API3
    API1 --> RDS
    Server --> S3
    Edge --> LiveKitCloud
```

## Performance Optimization Layers

```mermaid
graph TB
    subgraph "Level 1: Build Time"
        Bundle[Code Splitting<br/>Tree Shaking]
        Minify[Minification<br/>Compression]
    end

    subgraph "Level 2: Server"
        PPR[Partial Prerendering<br/>Static Shell]
        ISR[Incremental<br/>Static Regeneration]
        Cache[Edge Cache<br/>CDN]
    end

    subgraph "Level 3: Client"
        Lazy[Dynamic Imports<br/>Lazy Loading]
        Suspense[Suspense Boundaries<br/>Streaming]
        Optimistic[Optimistic Updates]
    end

    subgraph "Level 4: Database"
        Index[Proper Indexes]
        Query[Query Optimization]
        Pool[Connection Pooling]
    end

    Bundle --> PPR
    Minify --> ISR
    PPR --> Cache
    ISR --> Lazy
    Cache --> Suspense
    Lazy --> Optimistic
    Suspense --> Index
    Optimistic --> Query
```

## Migration Strategy

```mermaid
graph LR
    subgraph "Phase 1: Foundation"
        P1A[Setup Next.js 15]
        P1B[Configure Auth]
        P1C[Database Schema]
    end

    subgraph "Phase 2: Core Pages"
        P2A[Migrate Layouts]
        P2B[Migrate Home/Profile]
        P2C[UI Components]
    end

    subgraph "Phase 3: Chat Features"
        P3A[Text Chat]
        P3B[Server Actions]
        P3C[Real-time Hooks]
    end

    subgraph "Phase 4: Advanced"
        P4A[Voice Chat]
        P4B[Avatar Features]
        P4C[LiveKit Integration]
    end

    subgraph "Phase 5: Polish"
        P5A[Performance]
        P5B[Testing]
        P5C[Deployment]
    end

    P1A --> P1B --> P1C
    P1C --> P2A --> P2B --> P2C
    P2C --> P3A --> P3B --> P3C
    P3C --> P4A --> P4B --> P4C
    P4C --> P5A --> P5B --> P5C
```

## Security Architecture

```mermaid
graph TB
    subgraph "Edge Security"
        Rate[Rate Limiting]
        CORS[CORS Policies]
        Headers[Security Headers]
    end

    subgraph "Application Security"
        MW[Auth Middleware<br/>Route Protection]
        CSRF[CSRF Protection]
        XSS[XSS Prevention]
    end

    subgraph "Data Security"
        Encrypt[Encryption at Rest]
        Hash[Password Hashing]
        Token[JWT Tokens]
    end

    subgraph "API Security"
        Validate[Input Validation]
        Sanitize[Output Sanitization]
        SQL[SQL Injection Prevention]
    end

    Rate --> MW
    CORS --> MW
    Headers --> MW
    MW --> Validate
    CSRF --> Validate
    XSS --> Sanitize
    Validate --> Encrypt
    Sanitize --> Hash
    SQL --> Token
```

## Monitoring & Observability

```mermaid
graph TB
    subgraph "Application Metrics"
        Perf[Performance<br/>Lighthouse<br/>Web Vitals]
        Errors[Error Tracking<br/>Sentry]
        Analytics[Analytics<br/>Vercel Analytics]
    end

    subgraph "User Behavior"
        Events[User Events<br/>Custom Tracking]
        Funnels[Conversion Funnels]
        Sessions[Session Replay]
    end

    subgraph "System Health"
        Uptime[Uptime Monitoring]
        Alerts[Alerting<br/>PagerDuty]
        Logs[Log Aggregation<br/>Datadog]
    end

    Perf --> Analytics
    Errors --> Logs
    Analytics --> Events
    Events --> Funnels
    Funnels --> Sessions
    Sessions --> Uptime
    Uptime --> Alerts
    Alerts --> Logs
```

---

These diagrams provide a comprehensive visual representation of the Next.js 15 architecture for the SAke E-Learning platform, covering all major aspects from data flow to deployment strategy.
