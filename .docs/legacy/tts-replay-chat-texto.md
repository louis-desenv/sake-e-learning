# Plano: TTS + Replay para Chats de Texto

## O Que Vamos Fazer

Adicionar voz (Text-to-Speech) às mensagens da IA em todos os chats de texto, com botão para ouvir novamente.

---

## 1. Como Funciona o Chat de Texto Hoje

### Fluxo Simples

```
Usuário clica em um assunto
         ↓
GuidedLearning ou IaChat
         ↓
TextChatUI (o componente do chat)
         ↓
geminiService (chama a IA)
         ↓
Mensagem aparece na tela
```

### Componentes

| Componente | O Que Faz |
|------------|-----------|
| **GuidedLearning** | Tela inicial com 6 assuntos. Clica → vai pro chat |
| **IaChat** | Roteador. Decide qual chat mostrar |
| **TextChatUI** | O chat de verdade. Aqui entram as mensagens |

> **Importante:** `TextChatUI` é usado por TODOS os chats de texto. Modificando ele, afeta tudo.

### Onde Fica Cada Coisa

```
src/
├── pages/
│   ├── GuidedLearning.tsx    (tela inicial)
│   └── IaChat.tsx             (roteador)
├── components/
│   └── TextChatUI.tsx         (⭐ AQUI VAMOS MODIFICAR ⭐)
└── services/
    └── geminiService.ts       (comunicação com a IA)
```

---

## 2. O Que Vamos Adicionar

### Funcionalidades

1. **IA já fala ao entrar** - Welcome message é falada automaticamente
2. **IA fala suas respostas** - Cada resposta da IA é falada
3. **Botão de replay** - Em cada mensagem da IA, um botão pra ouvir de novo
4. **Configurações** - Escolher voz e ligar/desligar o som

### Como Vai Ficar

```
┌─────────────────────────────────────┐
│  IA: Olá! Vamos praticar inglês?    │  🔊 ← Botão replay (clica pra ouvir)
└─────────────────────────────────────┘

☐ Text-to-Speech    [Voz: Google US English ▼]
```

---

## 3. Implementação Passo a Passo

### Arquivo Único a Modificar

**`components/TextChatUI.tsx`**

### Passo 1: Adicionar Estados

```typescript
// Coloque após os estados existentes (linha ~106)
const [currentSpeakingId, setCurrentSpeakingId] = useState<number | null>(null);
const [ttsEnabled, setTtsEnabled] = useState(true);
const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
```

**O que cada estado faz:**
- `currentSpeakingId` - Qual mensagem está tocando agora
- `ttsEnabled` - Se o som está ligado ou desligado
- `selectedVoice` - Voz escolhida pelo usuário
- `availableVoices` - Lista de vozes disponíveis no navegador

### Passo 2: Adicionar Funções de TTS

```typescript
// Função para falar texto
const speakText = useCallback((text: string, messageId: number) => {
  if (!ttsEnabled || !window.speechSynthesis) return;

  window.speechSynthesis.cancel(); // Para o que estiver tocando

  const utterance = new SpeechSynthesisUtterance(text);

  if (selectedVoice) utterance.voice = selectedVoice;
  utterance.rate = 1.0;  // Velocidade normal
  utterance.pitch = 1.0; // Tom normal
  utterance.volume = 1.0; // Volume máximo

  utterance.onstart = () => setCurrentSpeakingId(messageId);
  utterance.onend = () => setCurrentSpeakingId(null);
  utterance.onerror = () => setCurrentSpeakingId(null);

  window.speechSynthesis.speak(utterance);
}, [ttsEnabled, selectedVoice]);

// Função para parar
const stopSpeech = useCallback(() => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    setCurrentSpeakingId(null);
  }
}, []);

// Função para carregar vozes
const loadVoices = useCallback(() => {
  if (!window.speechSynthesis) return;

  const voices = window.speechSynthesis.getVoices();
  setAvailableVoices(voices);

  // Tenta carregar voz salva ou escolhe voz em inglês
  const savedVoiceUri = localStorage.getItem('preferredVoiceUri');
  if (savedVoiceUri) {
    const savedVoice = voices.find(v => v.voiceURI === savedVoiceUri);
    if (savedVoice) setSelectedVoice(savedVoice);
  } else if (!selectedVoice && voices.length > 0) {
    const englishVoice = voices.find(v => v.lang.startsWith('en-')) || voices[0];
    setSelectedVoice(englishVoice);
  }
}, [selectedVoice]);
```

### Passo 3: Carregar Vozes ao Iniciar

```typescript
// Adicione após os useEffects existentes (linha ~160)
useEffect(() => {
  loadVoices();

  // Alguns navegadores carregam vozes de forma assíncrona
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  return () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = null;
    }
  };
}, [loadVoices]);

// Limpa o som ao sair da página
useEffect(() => {
  return () => stopSpeech();
}, [stopSpeech]);
```

### Passo 4: Falar Welcome Message

**Modifique o useEffect existente (linhas 108-122):**

```typescript
useEffect(() => {
  (async () => {
    setIsWelcomeLoading(true);
    try {
      const welcomeMsg = scenario
        ? await getWelcomeMessage(scenario)
        : "Hi there 👋 If you need any assistance, I'm always here.";

      setMessages([{ sender: 'ai', text: welcomeMsg }]);

      // ⭐ ADICIONADO: Falar welcome message
      setTimeout(() => {
        if (ttsEnabled && window.speechSynthesis) {
          speakText(welcomeMsg, 0);
        }
      }, 500);
    } catch (error) {
      setMessages([{ sender: 'ai', text: "Hi there! 👋" }]);
    } finally {
      setIsWelcomeLoading(false);
    }
  })();
}, [scenario, ttsEnabled, speakText]);
```

### Passo 5: Falar Respostas da IA

**Modifique a função `handleSend` (linhas 162-190):**

```typescript
const handleSend = useCallback(async () => {
  if (!input.trim() || isLoading) return;

  // ⭐ ADICIONADO: Parar som ao enviar mensagem
  stopSpeech();

  const userMessage: MessageWithCorrections = { sender: 'user', text: input };
  setMessages((prev) => [...prev, userMessage]);
  setInput('');
  setIsLoading(true);

  try {
    const conversationHistory = getRecentHistory(messages, MAX_HISTORY_MESSAGES);
    const aiResponse = await sendChatMessage(
      userMessage.text,
      conversationHistory,
      scenario,
      correctionsEnabled,
    );
    const { corrections, cleanedText } = parseCorrectionsFromResponse(aiResponse);
    const aiMessage = {
      sender: 'ai' as const,
      text: cleanedText,
      corrections: correctionsEnabled ? corrections : undefined
    };
    setMessages((prev) => [...prev, aiMessage]);

    // ⭐ ADICIONADO: Falar resposta da IA
    const newMessageIndex = messages.length + 1;
    setTimeout(() => {
      if (ttsEnabled && window.speechSynthesis) {
        speakText(cleanedText, newMessageIndex);
      }
    }, 100);
  } catch (error) {
    setMessages((prev) => [
      ...prev,
      { sender: 'ai', text: 'Sorry, there was an error. Please try again.' },
    ]);
  } finally {
    setIsLoading(false);
  }
}, [input, isLoading, messages, scenario, correctionsEnabled, ttsEnabled, speakText, stopSpeech]);
```

### Passo 6: Adicionar Botão de Replay

**Modifique a renderização de mensagens (linhas 386-425):**

```typescript
{messages.map((message, index) => (
  <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[85%] sm:max-w-[80%] px-4 py-4 sm:px-4 sm:py-3 rounded-2xl ${
      message.sender === 'user'
        ? 'bg-[#4a7cf5] text-white rounded-br-sm'
        : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
    }`}>
      {/* ⭐ MODIFICADO: Adicionar container para texto + botão */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-base sm:text-[15px] whitespace-pre-wrap flex-1">{message.text}</p>

        {/* ⭐ ADICIONADO: Botão TTS para mensagens da IA */}
        {message.sender === 'ai' && (
          <button
            onClick={() => {
              if (currentSpeakingId === index) {
                stopSpeech();
              } else {
                speakText(message.text, index);
              }
            }}
            className="shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
            title={currentSpeakingId === index ? 'Parar' : 'Ouvir novamente'}
            disabled={!window.speechSynthesis}
          >
            {currentSpeakingId === index ? (
              // Ícone de parar (vermelho pulsando)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              // Ícone de speaker
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Corrections - manter como está */}
      {message.sender === 'ai' && message.corrections && message.corrections.length > 0 && (
        // ... código existente de correções ...
      )}
    </div>
  </div>
))}
```

### Passo 7: Adicionar Configurações de Voz

**Adicione no header (após linha ~365):**

```typescript
{/* ⭐ ADICIONADO: Configurações de TTS */}
<div className="px-4 pb-2">
  <div className="flex items-center justify-between">
    <label className="flex items-center space-x-2 text-white/90 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={ttsEnabled}
        onChange={(e) => setTtsEnabled(e.target.checked)}
        className="rounded"
      />
      <span>🔊 Text-to-Speech</span>
    </label>

    {ttsEnabled && availableVoices.length > 0 && (
      <select
        value={selectedVoice?.voiceURI || ''}
        onChange={(e) => {
          const voice = availableVoices.find(v => v.voiceURI === e.target.value);
          if (voice) {
            setSelectedVoice(voice);
            localStorage.setItem('preferredVoiceUri', voice.voiceURI);
          }
        }}
        className="text-xs bg-white/20 text-white border border-white/30 rounded px-2 py-1"
      >
        {availableVoices
          .filter(v => v.lang.startsWith('en-'))
          .map(voice => (
            <option key={voice.voiceURI} value={voice.voiceURI} className="text-gray-800">
              {voice.name} ({voice.lang})
            </option>
          ))}
      </select>
    )}
  </div>
</div>
```

---

## 4. O Que Cada Modificação Faz

| Modificação | O Que Faz |
|-------------|-----------|
| **4 estados novos** | Controlam o TTS |
| **speakText()** | Fala um texto usando Web Speech API |
| **stopSpeech()** | Para o som que estiver tocando |
| **loadVoices()** | Carrega as vozes disponíveis |
| **useEffect vozes** | Inicia as vozes quando o componente carrega |
| **useEffect cleanup** | Para o som ao sair da página |
| **Welcome message** | Fala automaticamente ao entrar |
| **handleSend** | Para o som ao enviar, fala a resposta |
| **Botão replay** | Permite ouvir de novo cada mensagem |
| **Configurações** | Liga/desliga e escolhe a voz |

---

## 5. Casos Especiais

| Situação | O Que Acontece |
|----------|----------------|
| Usuário envia mensagem enquanto a IA fala | Para o som e envia a mensagem |
| Usuário clica replay enquanto toca | Para o anterior e começa o novo |
| Browser não tem suporte a TTS | Botões ficam desabilitados |
| Usuário muda de página | Som para automaticamente |
| Múltiplas mensagens rápidas | Só a última é falada |

---

## 6. Checklist de Testes

- [ ] Welcome message é falada ao entrar
- [ ] Botão aparece em cada mensagem da IA
- [ ] Clicar no botão funciona
- [ ] Clicar novamente para o som
- [ ] Enviar mensagem para o som atual
- [ ] Checkbox liga/desliga funciona
- [ ] Escolha de voz funciona
- [ ] Voz escolhida é salva
- [ ] Funciona em diferentes navegadores

---

## 7. Resumo

**Arquivo:** `components/TextChatUI.tsx`

**Linhas modificadas:**
- ~106: Adicionar 4 estados
- ~90: Adicionar 3 funções (~60 linhas)
- ~160: Adicionar 2 useEffects
- 108-122: Modificar welcome message
- 162-190: Modificar handleSend
- 386-425: Modificar renderização (botão replay)
- ~365: Adicionar configurações

**Resultado:** Todos os chats de texto terão TTS + replay automático.
