# 📋 Planejamento: Avatar de Pessoa no Chat de Texto

## 📌 Objetivo
Substituir o ícone de robô (🤖) por uma imagem de avatar de pessoa no cabeçalho do chat de texto (`TextChatUI.tsx`).

---

## 🔍 Análise Atual

### Localização do Código
**Arquivo:** `components/TextChatUI.tsx`  
**Linha:** 656-658

```tsx
<div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30">
  <span className="text-white text-xl">🤖</span>
</div>
```

### Contexto
- O emoji 🤖 está dentro de um container circular de 48x48 pixels
- O container já possui `overflow-hidden` (ideal para imagens)
- Faz parte do header do chat junto com "Chat with" e "AI Tutor"

---

## 🎯 Opções de Implementação

### Opção 1: Imagem Local (Recomendado)
Usar uma imagem de avatar armazenada no projeto.

**Prós:**
- ✅ Carregamento rápido
- ✅ Funciona offline
- ✅ Total controle sobre a imagem

**Contras:**
- ⚠️ Aumenta tamanho do bundle
- ⚠️ Menos flexibilidade para mudanças

**Implementação:**
```tsx
// Criar pasta e adicionar imagem
// public/avatars/tutor-avatar.png ou .jpg

<div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30">
  <img 
    src="/avatars/tutor-avatar.png" 
    alt="AI Tutor" 
    className="w-full h-full object-cover"
  />
</div>
```

---

### Opção 2: Avatar Gerado (UI Avatars)
Usar serviço de geração de avatares como UI Avatars ou DiceBear.

**Prós:**
- ✅ Não aumenta bundle
- ✅ Variações automáticas

**Contras:**
- ⚠️ Depende de serviço externo
- ⚠️ Pode falhar sem internet

**Implementação:**
```tsx
// UI Avatars (baseado em iniciais)
<img 
  src="https://ui-avatars.com/api/?name=AI+Tutor&background=4a7cf5&color=fff&size=96" 
  alt="AI Tutor"
  className="w-full h-full object-cover"
/>

// DiceBear (avatares ilustrados)
<img 
  src="https://api.dicebear.com/7.x/personas/svg?seed=AITutor" 
  alt="AI Tutor"
  className="w-full h-full object-cover"
/>
```

---

### Opção 3: Imagem de CDN/URL Externa
Usar uma imagem de um banco de imagens.

**Prós:**
- ✅ Fácil implementação
- ✅ Imagens profissionais

**Contras:**
- ⚠️ Depende de serviço externo
- ⚠️ Possíveis problemas de licença

---

### Opção 4: Componente Avatar Reutilizável
Criar componente React para avatares do sistema.

**Prós:**
- ✅ Reutilizável em outras telas
- ✅ Fácil customização
- ✅ Suporte a fallback

**Implementação:**
```tsx
// components/ui/Avatar.tsx
interface AvatarProps {
  src?: string;
  fallback?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  fallback = '👤', 
  alt,
  size = 'md' 
}) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`${sizes[size]} rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30`}>
      {src ? (
        <img 
          src={src} 
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      <span className={`text-white text-xl ${src ? 'hidden' : ''}`}>{fallback}</span>
    </div>
  );
};
```

---

## 📁 Estrutura de Arquivos a Criar/Modificar

### Criar (se usar imagem local):
```
public/
└── avatars/
    └── tutor-avatar.png  (ou .jpg, .svg)
```

### Criar (se usar componente):
```
components/
└── ui/
    └── Avatar.tsx
```

### Modificar:
```
components/
└── TextChatUI.tsx (linhas 656-658)
```

---

## 🖼️ Sugestões de Imagem

### Gratuitas (Creative Commons):
1. **Unsplash** - Fotos profissionais gratuitas
   - https://unsplash.com/s/photos/teacher-portrait
   
2. **Generated.photos** - Rostos gerados por IA
   - https://generated.photos/faces

3. **This Person Does Not Exist** - Rostos únicos gerados por IA
   - https://thispersondoesnotexist.com/

### Estilizadas (Ilustrações):
1. **Undraw** - Ilustrações flat
   - https://undraw.co/illustrations

2. **Storyset** - Ilustrações animáveis
   - https://storyset.com/

---

## 📝 Passos para Implementação

### Opção Simples (Imagem Local):
1. [ ] Escolher/criar imagem do avatar
2. [ ] Criar pasta `public/avatars/`
3. [ ] Salvar imagem como `tutor-avatar.png`
4. [ ] Modificar `TextChatUI.tsx` linha 657
5. [ ] Testar responsividade
6. [ ] Commit e push

### Opção Avançada (Componente):
1. [ ] Criar `components/ui/Avatar.tsx`
2. [ ] Implementar com fallback
3. [ ] Criar pasta e adicionar imagem
4. [ ] Importar e usar em `TextChatUI.tsx`
5. [ ] Testar em diferentes cenários
6. [ ] Documentar uso do componente
7. [ ] Commit e push

---

## 🔄 Código Atual vs Proposto

### Atual (linha 656-658):
```tsx
<div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30">
  <span className="text-white text-xl">🤖</span>
</div>
```

### Proposto (Simples):
```tsx
<div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30">
  <img 
    src="/avatars/tutor-avatar.png" 
    alt="AI Tutor" 
    className="w-full h-full object-cover"
  />
</div>
```

### Proposto (Com Fallback):
```tsx
<div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30">
  <img 
    src="/avatars/tutor-avatar.png" 
    alt="AI Tutor" 
    className="w-full h-full object-cover"
    onError={(e) => {
      (e.target as HTMLImageElement).style.display = 'none';
      (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
    }}
  />
  <span className="text-white text-xl hidden">👤</span>
</div>
```

---

## ⚠️ Considerações

1. **Tamanho da imagem**: Recomendado mínimo 96x96px (2x o tamanho exibido)
2. **Formato**: PNG com transparência ou JPG otimizado
3. **Peso**: Máximo ~50KB para não impactar performance
4. **Aspect ratio**: 1:1 (quadrada) para caber no círculo
5. **Licença**: Verificar se a imagem pode ser usada comercialmente

---

## 🚀 Próximos Passos

Quando estiver pronto para implementar, me diga:
1. Qual opção você prefere?
2. Quer que eu ajude a encontrar/criar a imagem?
3. Posso implementar a mudança diretamente?

---

*Documentação criada em: $(date)*  
*Branch: feature/tts-eleven-labs (ou criar nova branch feature/avatar-pessoa)*
