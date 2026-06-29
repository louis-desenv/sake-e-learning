# Guia de Teste do RAG

## Objetivo
Testar se o sistema RAG está funcionando corretamente e se o AI "lembra" das conversas anteriores.

---

## Teste Rápido: O AI "Lembra"?

### Passo a passo:

1. **Faça login** no app
2. **Vá para Phone Screen** (ou outro cenário)
3. **Na primeira mensagem**, escreva algo específico como:
   ```
   I'm looking for a job as a software developer
   ```

4. **Espere a resposta** do AI e responda mais 2-3 vezes
5. **Termine a conversa** (saia da página ou recarregue)
6. **Volte ao mesmo cenário** e faça uma nova pergunta:
   ```
   What was my professional background again?
   ```

### O que esperar:

Se o RAG estiver funcionando, o AI deve:
- Mencionar que você procura emprego como desenvolvedor
- Adaptar as respostas ao seu contexto
- Referenciar algo que você disse antes

---

## Verificação nos Logs

Abra o console do navegador (F12) > aba **Console** e procure por:

```
[TextChatUI] RAG Context loaded: {hasProfile: true, ...}
[GeminiService] Using RAG context - Level: intermediate
[ContextService] Conversation processed: {...}
```

---

## Verificação no Supabase

Execute no SQL Editor:

```sql
-- Verificar se perfil foi criado/atualizado
SELECT 
  scenario,
  total_conversations,
  total_messages,
  topics_practiced,
  areas_to_improve,
  last_practiced_at
FROM user_learning_profile
WHERE user_id = 'SeuNome';
```

---

## Checklist Rápido

| Item | Esperado |
|------|----------|
| Primeira conversa | hasProfile: false (normal) |
| Segunda conversa | hasProfile: true |
| AI menciona contexto anterior | Respondendo sobre seu background |
| Dados no Supabase | Perfil populado com métricas |

---

## Ideias de Teste para Verificar Contexto

**IMPORTANTE:** Cada cenário tem uma **welcome message** (mensagem de boas-vindas). Os testes abaixo partem dessa mensagem e continuam a conversa naturalmente.

---

### Teste 1: Contexto Profissional (Phone Screen)
**Cenário:** Phone Screen

**Welcome Message (exemplo):**
> "Hey [Nome]! Got a minute? Want to grab dinner tonight?"

**Conversa 1 - O que digitar:**
```
Actually, I can't tonight. I'm preparing for job interviews. I have 5 years of experience in digital marketing and I worked at Google before. I'm trying to switch careers!
```

**Responda** mais 2-3 vezes naturalmente (o AI vai perguntar sobre os planos, etc).

**Termine a conversa** e volte ao mesmo cenário.

**Conversa 2 - O que digitar:**
```
What did I tell you about my career last time we talked?
```

**Esperado:** O AI menciona "5 years of experience in digital marketing" e "Google" ou "job interviews".

---

### Teste 2: Contexto de Objetivos (Job Interviews)
**Cenário:** Job Interviews

**Welcome Message (exemplo):**
> "Good morning [Nome]! Thanks for joining us today. I'm the hiring manager for the Marketing Coordinator position. Let's start with you telling me about yourself."

**Conversa 1 - O que digitar:**
```
Thank you for having me. My goal is to work in a big tech company in the United States. I want to improve my English to work abroad and hopefully get a position at Amazon or Microsoft in the future. Can you help me practice?
```

**Responda** mais 2-3 vezes naturalmente (o AI vai fazer perguntas de entrevista).

**Termine a conversa** e volte ao mesmo cenário.

**Conversa 2 - O que digitar:**
```
What is my career goal according to our last conversation?
```

**Esperado:** O AI menciona "work in a big tech company in the United States" ou "Amazon/Microsoft".

---

### Teste 3: Contexto de Nível (Grammar Specialist)
**Cenário:** Grammar Specialist

**Welcome Message (exemplo):**
> "Hi [Nome]! I'm here to help you with English grammar. What topic would you like to practice today?"

**Conversa 1 - O que digitar:**
```
I want to practice tenses. Yesterday I go to the market. She are my friend. They was happy. Can you correct me?
```

**Peça correções** e responda mais 2-3 vezes cometendo erros similares.

**Termine a conversa**.

**Conversa 2 - O que digitar:**
```
Can you explain the Present Perfect tense to me?
```

**Esperado:** O AI adapta a explicação ao seu nível, mentioning que você tem dificuldades com esse tema.

---

### Teste 4: Contexto de Tema (Travel Conversations)
**Cenário:** Travel Conversations

**Welcome Message (exemplo):**
> "Hi [Nome]! Ready to practice travel English? Where would you like to go today?"

**Conversa 1 - O que digitar:**
```
I'm planning a trip to Tokyo next year. I want to visit the Shibuya crossing and eat authentic Japanese food. I've always wanted to see Mount Fuji too. Can you help me with useful phrases?
```

**Responda** mais 2-3 vezes naturalmente (o AI pode ensinar frases úteis).

**Termine a conversa** e volte ao mesmo cenário.

**Conversa 2 - O que digitar:**
```
Where am I planning to travel?
```

**Esperado:** O AI menciona "Tokyo" ou "Japan".

---

### Teste 5: Múltiplos Tópicos (Real Life)
**Cenário:** Real Life / Phone Screen

**Welcome Message (exemplo):**
> "Hey [Nome]! What's going on?"

**Conversa 1 - O que digitar:**
```
Not much! Actually, I love cooking Italian food. Every Sunday I make pasta from scratch. My specialty is lasagna and carbonara. I learned from my grandmother who was from Italy.
```

**Responda** mais 2-3 vezes.

**Termine a conversa**.

**Conversa 2 (pode ser dias depois) - O que digitar:**
```
What did I tell you about my hobbies?
```

**Esperado:** O AI sugere receitas italianas ou menciona seu interesse por culinária italiana.

---

### Teste 6: Evitar Erros Anteriores (Grammar Specialist)
**Cenário:** Grammar Specialist

**Welcome Message (exemplo):**
> "Hi [Nome]! I'm here to help you with English grammar. What topic would you like to practice today?"

**Conversa 1 - O que digitar:**
```
I want to practice verb tenses. I am happy. She are my teacher. They is my friends. We was at the party. Can you help me correct these sentences?
```

**Peça correções** e responda mais 2-3 vezes cometendo os mesmos erros.

**Termine a conversa**.

**Conversa 2 - O que digitar:**
```
Is there anything I keep making mistakes with?
```

**Esperado:** O AI menciona que você está cometendo erros recorrentes com o "verb to be".

---

### Teste 7: Evolução do Nível (Grammar Specialist)
**Cenário:** Grammar Specialist

**Welcome Message:**
> "Hi [Nome]! I'm here to help you with English grammar. What topic would you like to practice today?"

**Faça 5+ conversas** onde vocêfoca emerrar muito o Present Perfect:
- "Yesterday I go to the store" (errado)
- "She has went to the market" (errado)
- "I already ate" vs "I ate yesterday" (confusão)

**Após as conversas, verifique no Supabase:**
```sql
SELECT areas_to_improve FROM user_learning_profile 
WHERE user_id = 'SeuNome';
```

**Esperado:** `areas_to_improve` deve conter "present-perfect" ou similar.

**Conversa 6 - O que digitar:**
```
Yesterday I went to the beach. Can you check my sentence?
```

**Esperado:** O AI menciona o erro recorrente de Present Perfect.

---

### Teste 8: Contexto de País (Travel Specialist)
**Cenário:** Travel Specialist

**Welcome Message (exemplo):**
> "Hi [Nome]! Ready to practice travel English? Where would you like to go today?"

**Conversa 1 - O que digitar:**
```
I'm planning a trip to the United States for my honeymoon. We want to visit New York and Los Angeles. It's our first time visiting America. Can you help me with useful phrases?
```

**Responda** mais 2-3 vezes naturalmente (o AI pode ensinar frases de viagem).

**Termine a conversa** e volte ao mesmo cenário.

**Conversa 2 - O que digitar:**
```
What country am I planning to visit?
```

**Esperado:** O AI menciona "United States" ou "America" ou "USA".

---

### Teste 9: Contexto de Empresa (Business Meetings)
**Cenário:** Business Meetings

**Welcome Message (exemplo):**
> "Good morning [Nome]! Welcome to our business meeting practice. What would you like to discuss today?"

**Conversa 1 - O que digitar:**
```
I work at Tesla as a Sales Manager. I've been with the company for 3 years and I'm responsible for the South America region. We sell electric vehicles to enterprise clients. Can we practice a sales meeting?
```

**Responda** mais 2-3 vezes naturalmente.

**Termine a conversa** e volte ao mesmo cenário.

**Conversa 2 - O que digitar:**
```
Where do I work and what is my position?
```

**Esperado:** O AI menciona "Tesla" e "Sales Manager".

---

### Teste 10: Preferências de Estudo (Vocabulary Specialist)
**Cenário:** Vocabulary Specialist

**Welcome Message (exemplo):**
> "Hi [Nome]! Ready to expand your vocabulary? What topic would you like to explore today?"

**Conversa 1 - O que digitar:**
```
I learn better with practical examples and real conversations. I don't like too much grammar theory. Can you teach me with situations from everyday life? For example, when I go to a restaurant or travel.
```

**Responda** mais 2-3 vezes naturalmente.

**Termine a conversa**.

**Conversa 2 - O que digitar:**
```
Can you teach me some new vocabulary about food?
```

**Esperado:** O AI usa exemplos práticos e situações do dia-a-dia em vez de só teoria.

---

### Teste 11: Duração e Frequência
**Cenário:** Real Life (sugestão)

**Welcome Message (exemplo):**
> "Hey [Nome]! What's going on?"

**Faça 3 conversas curtas** (2-3 mensagens cada) no mesmo dia, cambiando o tema a cada vez.

**Após as 3, verifique no Supabase:**
```sql
SELECT total_conversations, total_messages, total_time_seconds 
FROM user_learning_profile 
WHERE user_id = 'SeuNome';
```

**Esperado:** `total_conversations` deve ser 3.

**No dia seguinte, faça mais 2 conversas.**

**Verifique novamente:**
```
total_conversations = 5
last_practiced_at = data recente
```

---

### Teste 12: Diferentes Cenários, Mesmo Usuário
**Cenário:** Phone Screen

**Welcome Message:**
> "Hey [Nome]! Got a minute?"

**Conversa 1 - O que digitar:**
```
I'm looking for a job as a software engineer. I have experience with JavaScript and Python.
```

**Responda** 2-3 vezes.

**Termine.**

---

**Cenário:** Travel Conversations

**Welcome Message:**
> "Hi [Nome]! Ready to practice travel English?"

**Conversa 2 - O que digitar:**
```
I'm planning a vacation to Paris next month. I want to visit the Eiffel Tower and Louvre Museum.
```

**Responda** 2-3 vezes.

**Termine.**

---

**Cenário:** Phone Screen (novamente)

**Welcome Message:**
> "Hey [Nome]! Got a minute?"

**Conversa 3 - O que digitar:**
```
What kind of job am I looking for?
```

**Esperado:** O AI menciona "software engineer" ou "software developer".

---

### Teste 13: Memória de Erros Específicos (Vocabulary Specialist)
**Cenário:** Vocabulary Specialist

**Welcome Message (exemplo):**
> "Hi [Nome]! Ready to expand your vocabulary? What topic would you like to explore today?"

**Conversa 1 - O que digitar:**
```
I want to learn business English. I'm very happy today because I got a new work. The weather is very good. Can you help me with better words?
```
*(Errado: "new work" deveria ser "new job", "very good" deveria ser "great", etc)*

**Peça correções** e responda mais 2-3 vezes com erros similares.

**Termine a conversa**.

**Verifique no Supabase:**
```sql
SELECT common_mistakes FROM user_learning_profile 
WHERE user_id = 'SeuNome';
```

**Conversa 2 - O que digitar:**
```
I got a new work yesterday.
```

**Esperado:** O AI menciona que você tem o hábito de usar "work" ao invés de "job".

---

### Teste 14: Conexão Entre Conversas (Real Life)
**Cenário:** Real Life

**Welcome Message (exemplo):**
> "Hey [Nome]! What's going on?"

**Conversa 1 - O que digitar:**
```
I'm learning English because I want to immigrate to Canada. My plan is to apply for Express Entry next year. I need to improve my CLB score. Can you help me practice?
```

**Responda** 2-3 vezes.

**Termine.**

**Conversa 2 (pode ser no dia seguinte) - O que digitar:**
```
Where do I want to live in the future?
```

**Esperado:** O AI menciona "Canada" ou conecta com seu plano de imigração.

---

### Teste 15: Nível Beginner vs Advanced
**Cenário:** Real Life

**Welcome Message (exemplo):**
> "Hey [Nome]! What's going on?"

**Verifique seu nível no app** (Beginner, Intermediate ou Advanced).

**Se Beginner - O que digitar:**
```
I am have a car. I go to store yesterday.
```

**Esperado:** O AI usa explicações simples e vocabulário básico.

**Se Advanced - O que digitar:**
```
I have been contemplating the ramifications of the recent policy changes.
```

**Esperado:** O AI usa linguagem mais sofisticada.

**Para testar adaptação - O que digitar:**
```
What did I tell you about myself?
```

**Esperado:** O AI adapta a resposta ao seu nível.

**Verifique seu nível no app** (ou nos dados do usuário).

**Se Beginner:**
- O que digitar: "I am have car."
- O que esperar: O AI usa explicações simples e vocabulário básico.

**Se Advanced:**
- O que digitar: "I have been contemplating the ramifications of the recent policy changes."
- O que esperar: O AI usa linguagem mais sofisticada e的高端 vocabulário.

**Para testar adaptação:**
- Pergunte ao AI sobre um tópico e observe se ele adapta o vocabulário ao seu nível.

---

## Como Executar os Testes

### Preparação:
1. Faça login no app
2. Abra o console do navegador (F12) > aba Console
3. Tenha o SQL Editor do Supabase aberto

### Para cada teste:
1. Siga as instruções de "O que digitar"
2. Observe os logs no console
3. Verifique os dados no Supabase quando indicado

### Dica:
- Faça testes em sequência para ver a evolução
- Anote o que o AI respondeu em cada teste
- Compare com o esperado

---

## Verificação no Supabase

```sql
-- Ver perfil do usuário
SELECT * FROM user_learning_profile 
WHERE user_id = 'SeuNome'
ORDER BY last_practiced_at DESC;

-- Ver conversas
SELECT id, scenario, total_messages, created_at 
FROM conversations 
WHERE user_id = 'SeuNome'
ORDER BY created_at DESC;

-- Ver áreas a melhorar detectadas
SELECT user_id, scenario, areas_to_improve, common_mistakes 
FROM user_learning_profile 
WHERE user_id = 'SeuNome';

-- Ver tópicos praticados
SELECT user_id, scenario, topics_practiced 
FROM user_learning_profile 
WHERE user_id = 'SeuNome';
```

---

## Problemas Comuns

| Problema | Solução |
|----------|---------|
| Log não aparece no console | Faça login e tenha conversas anteriores |
| hasProfile sempre false | Verifique se as tabelas foram criadas no Supabase |
| AI não lembra | Aguarde 2-3 conversas para o perfil ser populado |
| Dados não aparecem no Supabase | Execute o SQL do arquivo supabase-tables.sql |
