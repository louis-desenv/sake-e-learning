# Design Tokens - Cores

> Documento de referência das cores utilizadas no projeto SAke E-Learning v3
> Gerado em: 2026-01-29

---

## Índice

1. [Cores Primárias](#cores-primárias)
2. [Cores Secundárias](#cores-secundárias)
3. [Cores Neutras](#cores-neutras)
4. [Cores Semânticas](#cores-semânticas)
5. [Cores de Gradiente](#cores-de-gradiente)
6. [Opacidades e Transparências](#opacidades-e-transparências)
7. [Uso por Componente](#uso-por-componente)

---

## Cores Primárias

### Azul (Blue)
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `blue-50` | `#eff6ff` | Background geral da aplicação |
| `blue-500` | `#3b82f6` | Botões de ação principal |
| `blue-600` | `#2563eb` | Hover states, links |
| `blue-900` | `#1e3a8a` | Backgrounds escuros, gradientes |

**Cores personalizadas:**
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `#4a7cf5` | Custom | Cor principal da marca (chat) |
| `#3a6ce5` | Custom | Hover da cor principal |
| `#6b9cf7` | Custom | Gradientes suaves |

---

## Cores Secundárias

### Roxo (Purple)
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `purple-400` | `c084fc` | Hover states, destaques |
| `purple-500` | `#a855f7` | Botões de ação secundária |
| `purple-600` | `#9333ea` | Botões ativos, toggle on |
| `purple-700` | `#7c3aed` | Botões de controle |
| `purple-800` | `#6b21a8` | Botões inativos |
| `purple-900` | `#581c87` | Backgrounds escuros, gradientes |

### Ciano (Cyan)
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `cyan-50` | `#ecfeff` | Backgrounds sutis |
| `cyan-500` | `#06b6d4` | Botões de ação (Gemini) |
| `cyan-600` | `#0891b2` | Hover states |

---

## Cores Neutras

### Cinza (Gray)
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `gray-50` | `#f9fafb` | Background de cards |
| `gray-100` | `#f3f4f6` | Inputs, backgrounds claros |
| `gray-200` | `#e5e7eb` | Bordas, divisores |
| `gray-300` | `#d1d5db` | Toggle off, placeholders |
| `gray-400` | `#9ca3af` | Loading indicators |
| `gray-500` | `#6b7280` | Texto secundário |
| `gray-600` | `#4b5563` | Texto de descrição |
| `gray-700` | `#374151` | Tooltips, balões |
| `gray-800` | `#1f2937` | Títulos, texto principal |
| `gray-900` | `#111827` | Backgrounds muito escuros |

### Preto e Branco
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `white` | `#ffffff` | Backgrounds, texto sobre escuro |
| `black` | `#000000` | Backgrounds principais, overlay |

---

## Cores Semânticas

### Sucesso (Emerald/Green)
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `emerald-400` | `#34d399` | Indicador de fala ativa |
| `emerald-600` | `#059669` | Estados de sucesso |
| `emerald-700` | `#047857` | Cards de progresso |
| `green-50` | `#f0fdf4` | Background de sucesso |
| `green-500` | `#22c55e` | Estados positivos |
| `green-700` | `#15803d` | Texto de sucesso |

### Erro / Perigo (Red)
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `red-400` | `#f87171` | Erros suaves |
| `red-500` | `#ef4444` | Botão de encerrar chamada |
| `red-600` | `#dc2626` | Hover de encerrar |
| `red-700` | `#b91c1c` | Erros críticos |
| `rose-50` | `#fff1f2` | Background de alerta |
| `rose-400` | `#fb7185` | States de gravação |
| `rose-500` | `#f43f5e` | Botão de parar gravação |

### Aviso (Amber/Yellow)
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `amber-50` | `#fffbeb` | Background de aviso |
| `amber-100` | `#fef3c7` | Cards de dicas |
| `amber-200` | `#fde68a` | Borders de aviso |
| `amber-500` | `#f59e0b` | Ícones de aviso |
| `amber-600` | `#d97706` | Processando |
| `amber-800` | `#92400e` | Texto de dica |
| `yellow-500` | `#eab308` | Estado processando |

### Informação
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `blue-400` | `#60a5fa` | Indicadores |
| `slate-400` | `#94a3b8` | Texto de apoio |
| `slate-600` | `#475569` | Textos informativos |

---

## Cores de Gradiente

### Gradientes Identificados

| Gradiente | Direção | Uso |
|-----------|---------|-----|
| `from-blue-900 to-purple-900` | to-br | Background principal (AudioOnlyChat) |
| `from-purple-500 to-purple-700` | to-br | Botões de microfone |
| `from-purple-400 to-purple-600` | to-br | Hover de botões |
| `from-red-500 to-red-600` | to-br | Botão de encerrar |
| `from-red-400 to-red-500` | to-br | Hover de encerrar |
| `from-cyan-500 to-cyan-600` | to-br | Botões Gemini |
| `from-cyan-50 to-blue-50` | to-br | Background Gemini |
| `from-[#4a7cf5] via-[#6b9cf7] to-white` | to-b | Header TextChatUI |
| `from-black/60 via-transparent to-transparent` | to-t | Vignette overlay |
| `from-black/40 via-transparent to-black/30` | to-t | Vignette suave |

---

## Opacidades e Transparências

### White com opacidade
| Token | Valor | Uso |
|-------|-------|-----|
| `white/5` | 5% | Borders sutis |
| `white/6` | 6% | Background de controle |
| `white/8` | 8% | Borders de cards |
| `white/10` | 10% | Backgrounds de botões |
| `white/20` | 20% | Backdrop blur, overlays |
| `white/30` | 30% | Modal overlay |
| `white/40` | 40% | Badges, labels |
| `white/50` | 50% | Transcript bubble |
| `white/60` | 40% | Backdrop filters |
| `white/70` | 70% | Texto suave |
| `white/80` | 80% | Texto secundário |
| `white/90` | 90% | Cards de participante |

### Black com opacidade
| Token | Valor | Uso |
|-------|-------|-----|
| `black/40` | 40% | Labels, badges |
| `black/50` | 50% | Modal overlay |
| `black/60` | 60% | Footer background |
| `black/70` | 70% | Modal overlay |
| `black/80` | 80% | Spinner overlay |
| `black/90` | 90% | Autorespose |

### Cores com opacidade
| Token | Valor | Uso |
|-------|-------|-----|
| `purple-500/20` | 20% | Spinner rings |
| `purple-500/30` | 30% | Glow effects |
| `blue-50/50` | 50% | Background geral |

---

## Uso por Componente

### App.tsx
- Background: `bg-blue-50/50`
- Botão home: `bg-white/80` → hover: `bg-white`
- Ícone home: `text-gray-600` → hover: `text-blue-600`

### Card.tsx
- Background: `bg-white`
- Shadow: `shadow-lg` → hover: `shadow-xl`
- Título: `text-gray-800`
- Descrição: `text-gray-500`

### AudioOnlyChat.tsx
- Background card: `bg-black`
- Background gradiente: `from-blue-900 to-purple-900`
- Vignette: `from-black/60 via-transparent to-transparent`
- Botão mic: `from-purple-500 to-purple-700`
- Hover botão: `from-purple-400 to-purple-600`
- Tooltip: `bg-gray-700`
- Transcript: `bg-white/8`
- Controles: `bg-white/6`
- End call: `bg-red-600` → hover: `bg-red-700`

### VoiceChatUI.tsx
- Background: `bg-black`
- Botões controle: `bg-purple-600` (ativo) / `bg-purple-800` (inativo)
- End call: `from-red-500 to-red-600`
- Spinner glow: `bg-purple-500/30`
- Pontos modal: `text-purple-600`
- Cards progresso: `bg-purple-50`, `bg-green-50`

### GeminiVoiceChat.tsx
- Card: `bg-white`, border: `border-t-cyan-500`
- Background waves: `from-cyan-50 to-blue-50`
- Botão principal: `from-cyan-500 to-cyan-600`
- Status indicators: `bg-green-500`, `bg-cyan-500`, `bg-yellow-500`
- Transcript: `bg-white/50`

### TextChatUI.tsx
- Header gradiente: `from-[#4a7cf5] via-[#6b9cf7] to-white`
- Mensagens usuário: `bg-[#4a7cf5]`
- Mensagens AI: `bg-white`
- Botão enviar: `bg-[#4a7cf5]` → hover: `bg-[#3a6ce5]`
- Botão voz: `bg-blue-500` / `bg-rose-500` (gravando)
- Loading: `bg-gray-400`
- Corrections: `bg-amber-50`, border: `border-amber-100`

---

## Observações

1. **Paleta principal**: Azul (`#4a7cf5`) e Roxo (`purple-600`)
2. **Modo escuro**: A maioria dos componentes de voz usa `bg-black` como base
3. **Gradientes**: Muito uso de gradientes roxos para botões de ação
4. **Opacidades**: Uso extensivo de opacidades para overlays e efeitos de vidro
5. **Cores semânticas**: Padrão Tailwind (emerald para sucesso, red para perigo, amber para avisos)

---

## Próximos Passos

- [ ] Migrar cores hardcoded (`#4a7cf5`) para tokens nomeados
- [ ] Configurar `tailwind.config.js` com cores customizadas
- [ ] Criar variantes dark/light mode
- [ ] Documentar espaçamentos e tipografia
