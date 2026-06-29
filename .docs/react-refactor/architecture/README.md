# Architecture Documentation

Complete system architecture for the React refactoring.

## 📁 Contents

This folder contains architecture-related documentation:

### [ARCHITECTURE.md](./ARCHITECTURE.md)
**System architecture and component structure**

**Contents:**
- Current architecture analysis
- Target system design
- Component decomposition strategy
- Data flow diagrams
- Before/after file structure
- State management patterns

**Key Highlights:**
- TextChatUI: 1,139 lines → 8 components (~100-150 lines each)
- Feature-based module organization
- Container vs presentational components

---

### [REFACTORING_DIAGRAMS.md](./REFACTORING_DIAGRAMS.md)
**Visual architecture diagrams (Mermaid)**

**Contents:**
- Current vs target architecture
- Component decomposition diagrams
- State management flow
- Data flow patterns
- Feature module structure
- Testing strategy pyramid
- Code splitting strategy

**Key Highlights:**
- Before/after visual comparisons
- Mermaid diagrams for all architectures
- Data flow sequences

---

## 🏗️ Key Architectural Decisions

### Component Decomposition

**TextChatUI.tsx (1,139 lines) → 8 Components:**
- ChatContainer (~100 lines)
- MessageList (~80 lines)
- MessageBubble (~60 lines)
- CorrectionTip (~40 lines)
- ChatInput (~50 lines)
- VoiceInput (~80 lines)
- TTSControls (~40 lines)
- SettingsModal (~60 lines)

### State Management

- **Server State**: TanStack Query (API calls, caching)
- **Client State**: Zustand (UI, modals, settings)
- **Auth State**: React Context (keep existing)

### File Structure

```
src/
├── features/        # Feature modules
│   ├── chat/
│   ├── tts/
│   └── recording/
├── components/ui/   # Base UI library
├── stores/          # Zustand stores
├── lib/             # Utilities
├── contexts/        # React contexts
└── services/        # API services
```

---

## 📖 Usage

When working on architecture:

1. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for patterns
2. Check [REFACTORING_DIAGRAMS.md](./REFACTORING_DIAGRAMS.md) for visuals
3. Follow feature-based structure
4. Maintain component size < 300 lines

---

**Back to [Main README](../README.md)**
