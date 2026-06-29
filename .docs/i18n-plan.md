# Plano Completo de Internacionalização (i18n) — Sakae E-Learning

> Gerado por análise estática do código-fonte em `sakae-e-learning-v3`

---

## 1. Visão Geral da Infraestrutura Atual

O projeto **já possui i18n implementado** com a biblioteca `react-i18next` (i18next v26 + react-i18next v17). A arquitetura atual é sólida e inclui:

| Item | Status |
|---|---|
| Biblioteca | ✅ `i18next` + `react-i18next` |
| Idiomas bundled | ✅ en, pt, es, de, fr, it, ja, zh |
| Detecção automática do navegador | ✅ `detectBrowserLangCode()` |
| Fallback para inglês | ✅ `fallbackLng: 'en'` |
| Lazy loading via SSE (streaming do backend) | ✅ `loadLanguagePack()` com cache localStorage |
| Cache local (fingerprint-based) | ✅ |
| Progressbar de carregamento de tradução | ✅ `translationStore` |
| Preferência de idioma salva no perfil do usuário | ✅ |

**Stack tecnológica:** Vite + React 19 + TypeScript + Tailwind CSS + React Router v7 + Zustand + Supabase

---

## 2. Inventário Completo de Textos por Tela

### 2.1 Autenticação

#### Tela: Login (`pages/Login.tsx`)

| Texto Atual | Chave Atual | Status |
|---|---|---|
| Continue with Google | `login.continueWithGoogle` | ✅ i18n |
| or | `login.or` | ✅ i18n |
| Name | `login.name` | ✅ i18n |
| Your full name | `login.namePlaceholder` | ✅ i18n |
| Email | `login.email` | ✅ i18n |
| Enter your email | `login.emailPlaceholder` | ✅ i18n |
| Password | `login.password` | ✅ i18n |
| Enter your password | `login.passwordPlaceholder` | ✅ i18n |
| Processing... | `login.processing` | ✅ i18n |
| Create Account | `login.createAccount` | ✅ i18n |
| Sign In | `login.signIn` | ✅ i18n |
| Already have an account? Sign In | `login.hasAccount` | ✅ i18n |
| Don't have an account? Create Account | `login.noAccount` | ✅ i18n |
| By continuing, you agree to our Terms of Service and Privacy Policy. | `login.terms` | ✅ i18n |
| Account created successfully! Log in to continue. | `login.accountCreated` | ✅ i18n |
| Registration failed | `login.registerFailed` | ✅ i18n |
| Login failed | `login.loginFailed` | ✅ i18n |
| An error occurred. Check your connection. | `login.genericError` | ✅ i18n |
| Sakae Logo | `login.sakaeLogoAlt` | ✅ i18n |
| 🛠️ Dev Login (local only) | — | ❌ **HARDCODED** (botão dev, aceitável manter) |

**Problemas identificados:**
- O botão "Dev Login" é hardcoded mas é exclusivo para `localhost` — aceitável não traduzir.

---

#### Tela: Register (`pages/Register.tsx`)

O arquivo utiliza um namespace separado `register.*`, mas a **página de registro foi absorvida pela `Login.tsx`** (modo `isSignUp`). O namespace `register` existe nas traduções mas não é mais usado ativamente. Textos duplicados com `login.*`.

**Ação recomendada:** Remover o namespace `register` das traduções (são duplicatas de `login.*`).

---

#### Tela: Google Callback (`pages/GoogleCallback.tsx`)

| Texto Atual | Chave Atual | Status |
|---|---|---|
| Authenticating... | `googleCallback.authenticating` | ✅ i18n |

---

### 2.2 Onboarding (`components/Onboarding.tsx`)

Todos os textos estão corretamente internacionalizados. Inventário completo:

| Texto Atual | Chave | Status |
|---|---|---|
| What is your native language? | `onboarding.step1Title` | ✅ |
| This allows tailored bilingual support. | `onboarding.step1Desc` | ✅ |
| Which language do you want to learn? | `onboarding.stepLearningLangTitle` | ✅ |
| Currently, we only offer English... | `onboarding.stepLearningLangDesc` | ✅ |
| Interface Language | `onboarding.stepInterfaceLangTitle` | ✅ |
| Would you prefer the app interface in... | `onboarding.stepInterfaceLangDesc` | ✅ |
| My native language ({{lang}}) | `onboarding.nativeOption` | ✅ |
| The language I am learning (English) | `onboarding.learningOption` | ✅ |
| What is your English level? | `onboarding.step2Title` | ✅ |
| This helps us personalize lessons... | `onboarding.step2Desc` | ✅ |
| What are your learning goals? | `onboarding.step3Title` | ✅ |
| Select all that apply. | `onboarding.step3Desc` | ✅ |
| Welcome to Flow Speak! | `onboarding.step4Title` | ✅ |
| Confirm your name or edit if you prefer: | `onboarding.step4Desc` | ✅ |
| Your name | `onboarding.placeholderName` | ✅ |
| Back | `onboarding.btnBack` | ✅ |
| Next | `onboarding.btnNext` | ✅ |
| Finish | `onboarding.btnFinish` | ✅ |
| Saving... | `onboarding.btnSaving` | ✅ |
| Select a language | `onboarding.selectLanguage` | ✅ |
| Detected from your device... | `onboarding.autoDetected` | ✅ |
| English | `onboarding.english` | ✅ |
| What's your daily practice goal? | `onboarding.stepDailyGoalTitle` | ✅ |
| Choose how much time... | `onboarding.stepDailyGoalDesc` | ✅ |
| Spark / Flow / Boost / Surge (labels) | `onboarding.dailyGoals.*` | ✅ |
| An error occurred while saving... | `onboarding.errorSaving` | ✅ |
| Please fill in all fields. | `onboarding.fillAllFields` | ✅ |
| Preparing interface in your language... | `onboarding.preparingInterface` | ✅ |

---

### 2.3 Dashboard (`pages/HomeDashboard.tsx`)

| Texto Atual | Chave | Status |
|---|---|---|
| Good Morning | `dashboard.goodMorning` | ✅ |
| Good Afternoon | `dashboard.goodAfternoon` | ✅ |
| Good Evening | `dashboard.goodEvening` | ✅ |
| Ready to improve your English today? | `dashboard.readyToImprove` | ✅ |
| Payment Confirmed! | `dashboard.paymentConfirmed` | ✅ |
| Your Premium plan is now active. | `dashboard.planActive` | ✅ |
| Do you want to reset your progress to Level 1? | `dashboard.resetProgressConfirm` | ✅ |
| Reset | `dashboard.resetButton` | ✅ |
| Speak with an Ultra-realistic Avatar | `dashboard.featuredTitle` | ✅ |
| Practice your speaking and listening... | `dashboard.featuredDesc` | ✅ |
| Speak Now | `dashboard.featuredBtn` | ✅ |
| Plans | `dashboard.cards.plansTitle` | ✅ |
| Upgrade and unlock more features. | `dashboard.cards.plansDesc` | ✅ |
| Real Life | `dashboard.cards.realLifeTitle` | ✅ |
| Quick exercises and daily challenges. | `dashboard.cards.realLifeDesc` | ✅ |
| Voice | `dashboard.cards.voiceTitle` | ✅ |
| Native AI voice chat (Google Gemini). | `dashboard.cards.voiceDesc` | ✅ |
| Learn | `dashboard.cards.learnTitle` | ✅ |
| Structured lessons on grammar... | `dashboard.cards.learnDesc` | ✅ |
| Profile | `dashboard.cards.profileTitle` | ✅ |
| Track your progress and achievements. | `dashboard.cards.profileDesc` | ✅ |
| AI Library | `dashboard.cards.libraryTitle` | ✅ |
| Explore videos and learning resources. | `dashboard.cards.libraryDesc` | ✅ |
| ✕ (fechar toast) | — | ❌ **HARDCODED** — símbolo, sem impacto |

---

### 2.4 Navegação (`components/BottomNav.tsx`)

| Texto Atual | Chave | Status |
|---|---|---|
| Home | `navigation.home` | ✅ |
| Avatar | `navigation.avatar` | ✅ |
| Real Life | `navigation.realLife` | ✅ |
| Voice Chat | `navigation.voiceChat` | ✅ |
| Learn | `navigation.learn` | ✅ |
| Library | `navigation.library` | ✅ |
| Profile | `navigation.profile` | ✅ |

---

### 2.5 Perfil (`pages/MyProfile.tsx`)

| Texto Atual | Chave | Status |
|---|---|---|
| Student | `profilePage.studentLabel` | ✅ |
| Log out | `profilePage.logout` | ✅ |
| Weekly Performance | `profilePage.weeklyPerformance` | ✅ |
| Hours | `profilePage.hours` | ✅ |
| Learning Goals | `profilePage.learningGoals` | ✅ |
| Native Language | `profilePage.nativeLanguage` | ✅ |
| Hide History | `profilePage.hideHistory` | ✅ |
| Show History | `profilePage.showHistory` | ✅ |
| No conversations found. Start practicing! | `profilePage.noConversations` | ✅ |
| messages | `profilePage.messages` | ✅ |
| Download conversation | `profilePage.downloadConversation` | ✅ |
| You | `profilePage.you` | ✅ |
| AI Tutor | `profilePage.aiTutor` | ✅ |
| Date | `profilePage.date` | ✅ |
| Mon/Tue/Wed/Thu/Fri/Sat/Sun | `profilePage.weekdays.0-6` | ✅ |
| Conversation History | `chat.historyTitle` | ✅ |
| User Avatar (alt) | — | ❌ **HARDCODED** — `alt="User Avatar"` |

**Problemas identificados:**
- `alt="User Avatar"` hardcoded. Adicionar chave `profilePage.userAvatarAlt`.

---

### 2.6 Planos (`pages/AvailablePlans.tsx`)

Todos os textos estão corretamente internacionalizados, exceto:

| Texto Atual | Contexto | Status |
|---|---|---|
| `[OK]` | Ícone de feature disponível (lista) | ❌ **HARDCODED** — substituir por ícone SVG ou chave `common.featureAvailable` |
| `[NO]` | Ícone de feature indisponível (lista) | ❌ **HARDCODED** — substituir por ícone SVG ou chave `common.featureUnavailable` |
| `$2.00`, `$1.00`, `$3.00` | Preços | ❌ **HARDCODED** — valores de preço devem vir da API |
| `51` (percentual de desconto) | Texto de desconto | ❌ **HARDCODED** — deve vir de configuração |

---

### 2.7 Chat de Texto (`components/TextChatUI.tsx`)

| Texto Atual | Chave | Status |
|---|---|---|
| Tutor is thinking... | `chat.tutorThinking` | ✅ |
| Analyzing your progress... | `chat.analyzingProgress` | ✅ |
| Listening... (stops after 3s of silence) | `chat.listeningSilence` | ✅ |
| Enter your message or use voice... | `chat.enterMessageOrVoice` | ✅ |
| FOCUS FOR NEXT MESSAGES | `chat.focusNextMessages` | ✅ |
| Hide Examples | `chat.hideExamples` | ✅ |
| See Specific Examples | `chat.seeSpecificExamples` | ✅ |
| Your AI Tutor | `chat.yourAiTutor` | ✅ |
| Tutor Insight | `chat.tutorInsight` | ✅ |
| Just Speak | `chat.justSpeak` | ✅ |
| Tap below and start speaking... | `chat.tapBelow` | ✅ |
| Tap to start conversation | `chat.tapToStart` | ✅ |
| Listening | `chat.listening` | ✅ |
| Processing | `chat.processing` | ✅ |
| Speaking | `chat.speaking` | ✅ |
| You | `chat.you` | ✅ |
| Listening... | `chat.listeningSubtitle` | ✅ |
| Mute / Unmute | `chat.mute` / `chat.unmute` | ✅ |
| Doing Great | `chat.doingGreat` | ✅ |
| Quick Tip | `chat.quickTip` | ✅ |
| View Specific Mistakes | `chat.viewSpecificMistakes` | ✅ |
| Got it, thanks! | `chat.gotItThanks` | ✅ |
| Audio Settings | `chat.audioSettingsTitle` | ✅ |
| Enable Sound | `chat.enableSound` | ✅ |
| Voice Service: | `chat.voiceService` | ✅ |
| Your Tutor: | `chat.yourTutor` | ✅ |
| Male / Female | `chat.male` / `chat.female` | ✅ |
| Loading voices... | `chat.loadingVoices` | ✅ |
| Browser voices (free) | `chat.browserVoices` | ✅ |
| Premium voices (high quality) | `chat.premiumVoices` | ✅ |
| Conversation History | `chat.historyTitle` | ✅ |
| No conversations yet. | `chat.noConversations` | ✅ |
| Loading messages... | `chat.loadingMessages` | ✅ |

**Textos do namespace `chat.*` que estão na `pt.json` mas SEM tradução (em inglês):**

| Chave | Problema |
|---|---|
| `chat.currentSession` | "Current Session" — não traduzido em pt |
| `chat.startPracticing` | "Start practicing!" — não traduzido em pt |
| `chat.tutorAvatar` | "Tutor Avatar" — não traduzido em pt |
| `chat.downloadDate` | "Date: {{date}}" — não traduzido em pt |
| `chat.downloadDuration` | "Duration: {{duration}}" — não traduzido em pt |
| `chat.noConversationsYet` | duplicata de `chat.noConversations` |
| `chat.loadingConversations` | duplicata de `chat.loadingMessages` |
| `chat.exitFullscreen` | não traduzido em pt |
| `chat.fullscreen` | não traduzido em pt |
| `chat.audioSettingsTitle` | não traduzido em pt |
| `chat.stopSpeaking` | não traduzido em pt |
| `chat.listenAgain` | não traduzido em pt |
| `chat.whatsGoingWell` | não traduzido em pt |
| `chat.welcomeFallback` | não traduzido em pt |
| `chat.welcomeFallbackShort` | não traduzido em pt |
| `chat.tip` | não traduzido em pt |

---

### 2.8 Voice Chat (`pages/VoiceChat.tsx`, `components/GeminiVoiceChat.tsx`, `components/VoiceChatUI.tsx`)

Namespace `voiceChat.*` e `voice.*` — maioria traduzidos. Problemas:

| Chave | Problema |
|---|---|
| `voiceChat.cameraDenied` | "Camera permission denied" — não traduzido em pt |
| `voiceChat.practiceTime` | "Tempo de prática: 45min" — valor hardcoded (45min) |
| `session.trialDone` | não traduzido em pt |
| `session.sessionEnded` | não traduzido em pt |
| `session.xpEarned` | não traduzido em pt |
| `session.locked` | não traduzido em pt |
| `session.progress` | não traduzido em pt |
| `session.xpToLevel` | não traduzido em pt |
| `session.continue` | não traduzido em pt |
| `session.msg.*` | nenhuma das 3 mensagens traduzida em pt |

---

### 2.9 Gamificação (componentes em `gamification/components/`)

| Componente | Texto | Chave | Status |
|---|---|---|---|
| XpProgressBar | Max level reached — Fluent! | `gamification.maxLevel` | ✅ |
| XpProgressBar | {{progress}}% completed | `gamification.completed` | ✅ |
| XpProgressBar | in {{xp}} XP | `gamification.nextLevelIn` | ✅ |
| LevelUpModal | Congratulations! | `levelUp.congrats` | ✅ |
| LevelUpModal | You leveled up | `levelUp.leveledUp` | ✅ |
| LevelUpModal | Continue | `levelUp.continue` | ✅ |
| LevelUpModal | unlocked | `levelUp.unlocked` | ✅ |
| LevelUpModal | New Topics | `levelUp.newTopics` | ✅ |
| LevelUpModal | Unlimited Voice Chat | `levelUp.voiceUnlimited` | ✅ |
| LevelUpModal | {{time}} of Voice Chat | `levelUp.voiceMinutes` | ✅ |
| LevelUpModal | topic titles (lista) | — | ❌ **HARDCODED** — usa `topicSlugs[].title` direto, sem `t()` |
| SessionSummaryModal | Trial Completed! | `session.trialDone` | ✅ (EN) / ❌ (PT) |
| SessionSummaryModal | Session Ended! | `session.sessionEnded` | ✅ (EN) / ❌ (PT) |
| BadgesSection | Achievements | `gamification.achievementsTitle` | ✅ |
| BadgesSection | {{earned}} of {{total}} unlocked | `gamification.unlockedStatus` | ✅ |
| BadgesSection | {{percent}}% completed | `gamification.completedStatus` | ✅ |
| BadgesSection | Show less | `gamification.showLess` | ✅ |
| BadgesSection | Show all ({{total}}) | `gamification.showAll` | ✅ |
| LockedTopicCard | Level {{level}} required | `gamification.levelRequired` | ✅ |
| LockedTopicCard | {{xp}} XP needed | `gamification.xpNeeded` | ✅ |

**Problemas identificados:**
- `gamification.levels.*.name` e `gamification.levels.*.benefit` **não estão traduzidos para PT** — permanecem em inglês no arquivo `pt.json`.
- `gamification.reasons.*` — não traduzido para PT.
- Titles dos tópicos desbloqueados no `LevelUpModal` usam `topicSlugs[].title` diretamente (string estática), sem passar por `t()`.

---

### 2.10 Real Life (`pages/IaChat.tsx`) e Guided Learning (`pages/GuidedLearning.tsx`)

| Texto | Chave | Status |
|---|---|---|
| Real-Life | `realLifePage.title` | ✅ |
| Choose a conversation pathway... | `realLifePage.subtitle` | ✅ |
| Adaptive Challenge | `realLifePage.adaptiveChallenge` | ✅ |
| Page {{page}} of {{totalPages}} | `realLifePage.pageOf` | ✅ |
| Delete Scenario? | `realLifePage.deleteTitle` | ✅ |
| Are you sure you want to delete... | `realLifePage.deleteConfirm` | ✅ |
| Cancel | `realLifePage.cancel` | ✅ |
| Delete | `realLifePage.delete` | ✅ |
| NEW (badge em cenário customizado) | `realLifePage.new` | ✅ |
| Delete scenario (tooltip) | `realLifePage.deleteScenarioTitle` | ✅ |
| ← Back | — | ❌ **HARDCODED** em `IaChat.tsx` (navegação legada) |
| Guided Learning | `guidedLearningPage.title` | ✅ |
| Choose a topic to start... | `guidedLearningPage.subtitle` | ✅ |
| Adaptive Topic | `guidedLearningPage.adaptiveTopic` | ✅ |

---

### 2.11 AI Library (`pages/IaLibrary.tsx`)

| Texto | Chave | Status |
|---|---|---|
| AI Library | `libraryPage.title` | ✅ |
| Expand your knowledge... | `libraryPage.subtitle` | ✅ |
| Tip of the Day | `libraryPage.tipOfDay` | ✅ |
| Featured Videos | `libraryPage.featuredVideos` | ✅ |
| Loading tip... | `libraryPage.loadingTip` | ✅ |
| YouTube video player (aria) | `libraryPage.youtubePlayer` | ✅ |
| Títulos dos vídeos (ex: "Learn Colors with Ms Monica") | — | ❌ **HARDCODED** no array `videos[]` |

**Problema:** O array `videos[]` com títulos está hardcoded. Se esses títulos precisam ser localizados, devem ser movidos para as chaves de tradução ou buscados de uma fonte externa.

---

### 2.12 Avatar Chat (`pages/chat/WithAvatarChat.tsx`, `components/BeyAvatar.tsx`)

| Texto | Chave | Status |
|---|---|---|
| Level 3 (Communicator) | `withAvatarChat.levelLabel` | ✅ (mas valor hardcoded "Level 3 (Communicator)") |
| Ultra-realistic Avatar (título locked) | `avatar.locked.title` | ✅ |
| The advanced AI Avatar is exclusive from... | `avatar.locked.descHtml` | ✅ (contém HTML hardcoded com "Level 3 (Communicator)") |
| Your Current Level | `avatar.locked.currentLevel` | ✅ |
| {{xp}} XP remaining | `avatar.locked.xpNeeded` | ✅ |
| Requires Level 3 | `avatar.locked.required` | ✅ |
| Practice more to unlock the Avatar! | `avatar.locked.practiceMore` | ✅ |
| Practice in Text Chat | `avatar.locked.continueText` | ✅ |

**Problema:** `avatar.locked.descHtml` e `withAvatarChat.levelLabel` têm o valor "Level 3 (Communicator)" hardcoded dentro da tradução. Se o nível do avatar mudar, precisará ser atualizado manualmente em todos os idiomas.

---

### 2.13 LiveKit Chat (`pages/LiveKitChat.tsx`)

Namespace `liveKitPage.*` — todos os textos estão internacionalizados e traduzidos para PT.

---

### 2.14 Voice Chat Legado (`components/audio/PracticeMode.tsx`, `components/audio/RealTimeMode.tsx`)

Namespace `practice.*` e `audio.*`:

| Texto | Chave | Status |
|---|---|---|
| Paused | `practice.paused` | ✅ |
| What you said | `practice.whatYouSaid` | ✅ |
| Feedback | `practice.feedback` | ✅ |
| Tap to start recording | `practice.tapToRecord` | ✅ |
| Could not access microphone... | `practice.micPermission` | ✅ |
| Great job! Your pronunciation is improving... | `practice.greatJob` | ✅ |
| Connecting to AI | `audio.connectingToAI` | ✅ |
| Preparing your session... | `audio.preparingSession` | ✅ |

**Problema:** Todas as chaves acima **não estão traduzidas para PT** no `pt.json` — permanecem em inglês.

---

## 3. Diagnóstico de Problemas

### 3.1 Chaves Duplicadas

| Chave 1 | Chave 2 | Observação |
|---|---|---|
| `chat.noConversations` | `chat.noConversationsYet` | Mesmo texto, usar apenas uma |
| `chat.loadingMessages` | `chat.loadingConversations` | Mesmo texto, usar apenas uma |
| `chat.downloadConversation` | `profilePage.downloadConversation` | Mesmo texto em contextos diferentes — OK manter separado |
| Namespace `register.*` | Namespace `login.*` | Duplicatas — `register.tsx` absorvido por `login.tsx` |
| `chat.exitFullscreen` | `voiceChat.exitFullscreen` | Mesmo texto — candidato a `common.exitFullscreen` |
| `chat.fullscreen` | `voiceChat.fullscreen` | Mesmo texto — candidato a `common.fullscreen` |
| `chat.you` | `voiceChat.you` | Mesmo texto — candidato a `common.you` |

### 3.2 Textos Hardcoded Identificados

| Arquivo | Texto | Tipo | Prioridade |
|---|---|---|---|
| `pages/AvailablePlans.tsx` | `[OK]` / `[NO]` | Ícones de feature | 🔴 Alta |
| `pages/AvailablePlans.tsx` | `$2.00`, `$1.00`, `$3.00` | Preços | 🟡 Média (vêm da API idealmente) |
| `pages/AvailablePlans.tsx` | `51` (% de desconto) | Configuração | 🟡 Média |
| `pages/IaChat.tsx` | `← Back` | Navegação | 🔴 Alta |
| `pages/IaLibrary.tsx` | `videos[].title` (4 títulos de vídeos) | Conteúdo | 🟡 Média |
| `pages/MyProfile.tsx` | `alt="User Avatar"` | Acessibilidade | 🔴 Alta |
| `pages/Login.tsx` | `🛠️ Dev Login (local only)` | Dev-only | 🟢 Baixa |
| `gamification/components/LevelUpModal.tsx` | `topic.title` (tópicos desbloqueados) | Conteúdo dinâmico | 🔴 Alta |
| Traduções `avatar.locked.descHtml` | HTML `<strong>Level 3 (Communicator)</strong>` | Conteúdo | 🟡 Média |
| `voiceChat.practiceTime` | `"Tempo de prática: 45min"` em PT | Valor hardcoded | 🟡 Média |

### 3.3 Chaves Sem Tradução em PT

As seguintes chaves estão em inglês no arquivo `pt.json` (cobertura incompleta):

**Namespace `chat`:**
- `currentSession`, `startPracticing`, `tutorAvatar`, `msgs`, `downloadDate`, `downloadDuration`, `noConversationsYet`, `loadingConversations`, `youHistory`, `aiTutorHistory`, `exitFullscreen`, `fullscreen`, `tutorAvatarMale`, `tutorAvatarFemale`, `tutorLouis`, `tutorSarah`, `audioSettingsTitle`, `stopSpeaking`, `listenAgain`, `listenInsight`, `listen`, `noVoicesAvailable`, `welcomeFallback`, `welcomeFallbackShort`, `quickInsight`, `tip`, `whatsGoingWell`, `audioSettings`, `enableSound`, `voiceService`, `yourTutor`, `male`, `female`, `loadingVoices`, `browserVoices`, `premiumVoices`, `stop`, `listenToInsight`, `tapToStopRecording`, `tapToStartVoice`, `noEnglishVoices`, `selectValidVoice`, `speechPlaybackFailed`, `failedToLoadVoices`, `sorryError`, `apiKeyNotFound`, `downloadConversationTitle`, `conversationWith`, `dateLabel`, `youLabel`, `aiLabel`

**Namespace `session`:**
- `trialDone`, `sessionEnded`, `xpEarned`, `locked`, `progress`, `xpToLevel`, `continue`, `msg.trialOnly`, `msg.great`, `msg.longer`

**Namespace `gamification.levels`:**
- `1.name`, `1.benefit`, `2.benefit`, `3.benefit`, `4.benefit`, `5.benefit`

**Namespace `gamification.reasons`:**
- `voiceTimeout`, `voiceManual`

**Namespace `register`:**
- Tudo (namespace obsoleto, mesmos textos de `login`)

**Namespace `googleCallback`:**
- `authenticating`

**Namespace `avatar`:**
- Todo o namespace

**Namespace `audio` e `practice`:**
- Todo o namespace

**Namespace `levelUp`:**
- Todo o namespace

**Namespace `common`:**
- `loading`, `loadingAvatar`, `durationFormat`, `durationFormatSec`, `durationFormat0`, `minAbbr`, `secAbbr`

**Namespaces `voiceChatPage`, `iaChatPage`, `withAvatarChat`:**
- Não traduzidos para PT

### 3.4 Textos Misturados (Inglês no PT)

A `pt.json` tem cerca de **60–70 chaves** que permanecem em inglês. O mecanismo de streaming do backend (`loadLanguagePack`) foi desenhado para preencher essas lacunas automaticamente via API, mas a cobertura do arquivo estático local é incompleta.

### 3.5 Inconsistências de Nomenclatura

| Problema | Exemplo |
|---|---|
| Misturas de camelCase e kebab-case em IDs de badges | `level-2`, `xp-first`, `time-1h` vs. chaves camelCase no JSON |
| Namespace `iaChatPage` vs. `realLifePage` — mesma tela com nomes diferentes | IaChat usa tanto `iaChatPage.*` quanto `realLifePage.*` |
| `voiceChat.you` vs `chat.you` vs `audio.you` | Mesmo token "You" em 3 namespaces diferentes |
| `session.voiceChat` = "Voice Chat" e `navigation.voiceChat` = "Voice Chat" | Duplicata — OK para separação de contexto |

---

## 4. Estrutura de Traduções Recomendada (JSON Final)

### 4.1 Reorganização Sugerida dos Namespaces

A estrutura atual é boa. As melhorias recomendadas são:

```json
{
  "common": {
    "loading": "Loading...",
    "loadingAvatar": "Loading avatar...",
    "saving": "Saving...",
    "processing": "Processing...",
    "cancel": "Cancel",
    "delete": "Delete",
    "back": "Back",
    "close": "Close",
    "yes": "Yes",
    "no": "No",
    "you": "You",
    "aiTutor": "AI Tutor",
    "exitFullscreen": "Exit fullscreen",
    "fullscreen": "Fullscreen",
    "new": "New",
    "featureAvailable": "✓",
    "featureUnavailable": "✗",
    "durationFormat": "{{m}}m {{sec}}s",
    "durationFormatSec": "{{sec}}s",
    "durationFormat0": "0m",
    "minAbbr": "min",
    "secAbbr": "s"
  },
  "auth": {
    "login": {
      "title": "Sign In",
      "email": "Email",
      "emailPlaceholder": "Enter your email",
      "password": "Password",
      "passwordPlaceholder": "Enter your password",
      "signIn": "Sign In",
      "processing": "Processing...",
      "noAccount": "Don't have an account? Create Account",
      "continueWithGoogle": "Continue with Google",
      "or": "or",
      "terms": "By continuing, you agree to our Terms of Service and Privacy Policy.",
      "loginFailed": "Login failed",
      "genericError": "An error occurred. Check your connection.",
      "sakaeLogoAlt": "Sakae Logo"
    },
    "register": {
      "title": "Create your account",
      "name": "Name",
      "namePlaceholder": "Your full name",
      "createAccount": "Create Account",
      "hasAccount": "Already have an account? Sign In",
      "accountCreated": "Account created successfully! Log in to continue.",
      "registerFailed": "Registration failed",
      "passwordsDoNotMatch": "Passwords do not match",
      "passwordTooShort": "Password must be at least 6 characters"
    },
    "google": {
      "authenticating": "Authenticating..."
    }
  },
  "onboarding": {
    "step1Title": "What is your native language?",
    "step2Title": "What is your English level?",
    "step3Title": "What are your learning goals?",
    "step4Title": "Welcome to Flow Speak!",
    "stepLearningLangTitle": "Which language do you want to learn?",
    "stepInterfaceLangTitle": "Interface Language",
    "stepDailyGoalTitle": "What's your daily practice goal?",
    "nativeOption": "My native language ({{lang}})",
    "learningOption": "The language I am learning (English)",
    "btnBack": "Back",
    "btnNext": "Next",
    "btnFinish": "Finish",
    "btnSaving": "Saving...",
    "selectLanguage": "Select a language",
    "autoDetected": "Detected from your device.",
    "errorSaving": "An error occurred while saving your profile.",
    "fillAllFields": "Please fill in all fields.",
    "preparingInterface": "Preparing interface in your language...",
    "dailyGoals": { "...": "..." },
    "levels": { "Beginner": "Beginner", "Intermediate": "Intermediate", "Advanced": "Advanced" },
    "goals": { "...": "..." },
    "languages": { "...": "..." }
  },
  "navigation": {
    "home": "Home",
    "avatar": "Avatar",
    "realLife": "Real Life",
    "voiceChat": "Voice Chat",
    "learn": "Learn",
    "library": "Library",
    "profile": "Profile",
    "backToHome": "Back to Home",
    "back": "Back"
  },
  "dashboard": { "...": "..." },
  "chat": { "...": "..." },
  "voice": { "...": "..." },
  "session": { "...": "..." },
  "levelUp": { "...": "..." },
  "gamification": { "...": "..." },
  "onboardingMigration": "MOVER para auth.register o namespace register (obsoleto)",
  "realLife": { "...": "..." },
  "learn": { "...": "..." },
  "library": { "...": "..." },
  "plans": { "...": "..." },
  "profile": { "...": "..." },
  "scenarios": { "...": "..." },
  "avatar": { "...": "..." },
  "audio": { "...": "..." }
}
```

---

## 5. Arquitetura Recomendada

### 5.1 Biblioteca

**Recomendação: manter `i18next` + `react-i18next`** — já instalados, configuração sólida, SSE streaming do backend implementado.

Não há motivo para trocar. A biblioteca já oferece tudo que o projeto precisa:
- Interpolação com variáveis (`{{lang}}`, `{{xp}}`)
- Fallback automático para inglês
- `Trans` component para HTML seguro (substituir `dangerouslySetInnerHTML` em `avatar.locked.descHtml`)
- Namespaces para lazy loading por seção

### 5.2 Estrutura de Arquivos

```
translations/
├── en.json          ← arquivo base (fonte da verdade)
├── pt.json          ← português — cobertura ~60% (completar)
├── es.json          ← espanhol
├── de.json          ← alemão
├── fr.json          ← francês
├── it.json          ← italiano
├── ja.json          ← japonês
├── zh.json          ← chinês
└── README.md        ← guia de como adicionar/atualizar chaves
```

**Estrutura atual é correta.** Não é necessário dividir em múltiplos arquivos por namespace no curto prazo — o bundle é pequeno (~15KB por idioma). O streaming SSE já serve como lazy loading dinâmico para idiomas não bundled.

### 5.3 Lazy Loading

A estratégia atual é excelente:
- Idiomas bundled estaticamente: `en`, `pt`, `es`, `de`, `fr`, `it`, `ja`, `zh`
- Idiomas extras: carregados via SSE do backend (API `/api/v1/translations/stream/{lang}`)
- Cache em localStorage com fingerprint baseado no tamanho do bundle `en`

**Melhoria sugerida:** Adicionar invalidação de cache por `version` (hash do `en.json`) em vez de `length` para evitar colisões quando duas versões têm o mesmo número de caracteres.

### 5.4 Fallback de Idioma

Configuração atual: `fallbackLng: 'en'` — correto.

### 5.5 Detecção Automática

Já implementada em `utils/langUtils.ts` com `detectBrowserLangCode()`. Cadeia de prioridade correta:
1. Perfil salvo do usuário (returning user)
2. Locale do navegador/OS (new user)
3. Inglês (fallback final)

### 5.6 Boas Práticas para Manutenção

```
1. REGRA: Toda string visível ao usuário deve usar t('chave', { defaultValue: 'fallback' })
2. REGRA: Nunca committar texto hardcoded em JSX sem chave i18n (exceto ícones/símbolos)
3. REGRA: Ao adicionar nova chave em en.json, adicionar simultaneamente em pt.json
4. REGRA: Chaves devem refletir contexto: [namespace].[subnamespace].[identificador]
5. FERRAMENTA: Usar i18next-parser para audit automatizado de chaves não utilizadas
6. CI/CD: Adicionar step que valida cobertura de PT ≥ 95% via diff com EN
7. TRANS component: Para textos com HTML (ex: avatar.locked.descHtml), usar <Trans> em vez de dangerouslySetInnerHTML
```

---

## 6. Relatório Final

### 6.1 Totais

| Métrica | Valor |
|---|---|
| Total de telas analisadas | 11 páginas |
| Total de componentes analisados | 28 componentes |
| Total de chaves de tradução (en.json) | ~280 chaves |
| Cobertura PT (chaves com tradução real) | ~60% (~168 chaves) |
| Textos hardcoded críticos encontrados | 7 |
| Chaves duplicadas identificadas | 6 pares |
| Chaves obsoletas (namespace `register`) | ~14 |

### 6.2 Textos Não Internacionalizados (Pendentes)

1. `← Back` em `IaChat.tsx` (navegação legada, linha ~198)
2. `[OK]` / `[NO]` em `AvailablePlans.tsx` (ícones de feature)
3. `alt="User Avatar"` em `MyProfile.tsx`
4. Títulos dos vídeos em `IaLibrary.tsx` (`videos[]` array)
5. Titles de tópicos desbloqueados em `LevelUpModal.tsx` (usa string direta do `topicSlugs`)
6. `🛠️ Dev Login (local only)` em `Login.tsx` (baixa prioridade — dev only)

### 6.3 Problemas Identificados (Ranking de Prioridade)

| # | Problema | Impacto | Esforço | Prioridade |
|---|---|---|---|---|
| 1 | ~40% das chaves do `pt.json` sem tradução (inglês no PT) | 🔴 Alto | 🟡 Médio | **CRÍTICO** |
| 2 | Namespace `session.*` sem tradução PT | 🔴 Alto | 🟢 Baixo | **CRÍTICO** |
| 3 | Namespace `common.*` sem tradução PT | 🟡 Médio | 🟢 Baixo | Alta |
| 4 | `← Back` hardcoded no `IaChat.tsx` | 🟡 Médio | 🟢 Baixo | Alta |
| 5 | `[OK]`/`[NO]` hardcoded no `AvailablePlans.tsx` | 🟡 Médio | 🟢 Baixo | Alta |
| 6 | `alt="User Avatar"` hardcoded (acessibilidade) | 🟡 Médio | 🟢 Baixo | Alta |
| 7 | Chaves duplicadas (`chat.noConversations` / `chat.noConversationsYet`) | 🟢 Baixo | 🟢 Baixo | Média |
| 8 | Namespace `register` obsoleto | 🟢 Baixo | 🟢 Baixo | Média |
| 9 | Títulos de vídeos hardcoded no `IaLibrary.tsx` | 🟢 Baixo | 🟡 Médio | Baixa |
| 10 | `avatar.locked.descHtml` com HTML hardcoded | 🟢 Baixo | 🟡 Médio | Baixa |
| 11 | `gamification.levels.*.benefit` sem tradução PT | 🟡 Médio | 🟢 Baixo | Alta |

### 6.4 Estratégia de Longo Prazo

**Fase 1 — Imediato (1–2 dias)**
- Completar `pt.json` com tradução de todas as ~110 chaves faltantes
- Corrigir os 5 textos hardcoded críticos (← Back, [OK]/[NO], User Avatar alt)
- Remover namespace `register` obsoleto

**Fase 2 — Curto prazo (1 semana)**
- Adicionar `i18next-parser` ao workflow de desenvolvimento para detectar chaves novas/removidas automaticamente
- Adicionar validação no CI/CD que bloqueia merge se PT tiver cobertura < 95%
- Substituir `dangerouslySetInnerHTML` no `avatar.locked.descHtml` pelo componente `<Trans>`

**Fase 3 — Médio prazo (1 mês)**
- Consolidar chaves duplicadas (mover para `common.*`)
- Mover títulos de vídeos da `IaLibrary` para JSON ou API
- Usar `Trans` component em todos os lugares com HTML embutido
- Considerar dividir `en.json` em namespaces separados por arquivo quando superar 500 chaves

**Fase 4 — Longo prazo**
- Integrar ferramenta de tradução colaborativa (Localazy, Crowdin, ou Phrase)
- Implementar modo de "screenshot" automático para validação visual de traduções
- Adicionar suporte a pluralização explícita (`i18next Plural Forms`) para idiomas com regras complexas (árabe, russo)

---

## 7. Resumo de Comandos para Auditoria Contínua

```bash
# Instalar i18next-parser para auditoria de chaves
npm install --save-dev i18next-parser

# Criar configuração de parser
# i18next-parser.config.js:
# module.exports = {
#   locales: ['en', 'pt', 'es', 'de', 'fr', 'it', 'ja', 'zh'],
#   output: 'translations/$LOCALE.json',
#   input: ['**/*.tsx', '**/*.ts', '!node_modules/**'],
# };

# Rodar auditoria de chaves
npx i18next-parser

# Verificar chaves faltantes no PT vs EN
node -e "
const en = require('./translations/en.json');
const pt = require('./translations/pt.json');
const flat = (obj, p='') => Object.entries(obj).flatMap(([k,v]) => typeof v === 'object' ? flat(v, p+k+'.') : [[p+k, v]]);
const enKeys = flat(en).map(([k])=>k);
const ptKeys = flat(pt).map(([k])=>k);
const missing = enKeys.filter(k => !ptKeys.includes(k));
console.log('Missing in PT:', missing.length, missing);
"
```
