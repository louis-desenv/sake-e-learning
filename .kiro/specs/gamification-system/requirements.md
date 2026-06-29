# Documento de Requisitos — Sistema de Gamificação

## Introdução

O sistema de gamificação do Sakae E-Learning v3 tem como objetivo engajar os usuários através de pontos acumulados por tempo de uso dos chats, progressão de nível e desbloqueio progressivo dos 10 tópicos/cenários de conversa. Inicialmente todos os chats estão acessíveis; após a implementação, cada tópico só será acessível quando o usuário atingir o nível correspondente. A pontuação é baseada em tempo de sessão ativa nos chats, persistida no banco de dados Supabase existente.

---

## Glossário

- **Sistema_de_Gamificação**: O conjunto de regras, cálculos e interfaces que gerenciam pontos, níveis e desbloqueio de tópicos.
- **Pontos_de_Experiência (XP)**: Unidade de pontuação acumulada pelo usuário com base no tempo de uso dos chats.
- **Sessão_de_Chat**: Período contínuo em que o usuário está ativo em um tópico de chat, desde a abertura até o encerramento.
- **Nível**: Estágio de progressão do usuário (Nível 1 a Nível 5), determinado pela quantidade total de XP acumulada.
- **Tópico**: Um dos 10 cenários de chat disponíveis no app (`phone-screen`, `job-interviews`, `travel-conversations`, `business-meetings`, `grammar-essentials`, `vocabulary-builder`, `pronunciation-practice`, `business-english`, `travel-phrases`, `idioms-slang`).
- **Tópico_Bloqueado**: Tópico que o usuário ainda não pode acessar por não ter atingido o nível necessário.
- **Tópico_Desbloqueado**: Tópico acessível ao usuário dado seu nível atual.
- **Calculador_de_XP**: Módulo responsável por converter tempo de sessão em XP.
- **Gerenciador_de_Nível**: Módulo responsável por calcular o nível atual e o progresso com base no XP total.
- **Controlador_de_Acesso**: Módulo responsável por determinar quais tópicos estão desbloqueados para um dado nível.
- **Perfil_de_Aprendizado**: Registro na tabela `user_learning_profile` do Supabase que armazena métricas de uso por cenário.
- **Perfil_Global_de_Gamificação**: Registro na tabela `user_gamification_profile` (nova) que armazena XP total, nível atual e progresso global do usuário.

---

## Requisitos

### Requisito 1: Acúmulo de Pontos por Tempo de Uso

**User Story:** Como usuário, quero acumular pontos (XP) automaticamente enquanto pratico inglês nos chats, para que meu esforço seja reconhecido e eu me sinta motivado a continuar.

#### Critérios de Aceitação

1. WHEN o usuário abre um tópico de chat, THE Sistema_de_Gamificação SHALL iniciar uma contagem de tempo de sessão ativa.
2. WHEN o usuário encerra ou sai de um tópico de chat, THE Calculador_de_XP SHALL converter o tempo de sessão em XP na proporção de 1 XP por minuto completo de uso (60 segundos = 1 XP).
3. WHEN uma sessão de chat é encerrada com duração inferior a 60 segundos, THE Calculador_de_XP SHALL atribuir 0 XP para aquela sessão.
4. THE Calculador_de_XP SHALL acumular o XP da sessão ao total de XP do usuário no Perfil_Global_de_Gamificação.
5. WHEN o XP é acumulado, THE Sistema_de_Gamificação SHALL persistir o novo total de XP no banco de dados Supabase antes de retornar sucesso ao cliente.
6. IF a persistência do XP falhar, THEN THE Sistema_de_Gamificação SHALL registrar o erro e manter o XP anterior sem perda de dados.
7. THE Calculador_de_XP SHALL calcular XP de forma idempotente: registrar a mesma sessão duas vezes não deve duplicar o XP.

---

### Requisito 2: Sistema de Níveis

**User Story:** Como usuário, quero ver meu nível atual e o progresso para o próximo nível, para que eu saiba o quanto falta para desbloquear novos conteúdos.

#### Critérios de Aceitação

1. THE Gerenciador_de_Nível SHALL definir 5 níveis de progressão com os seguintes limiares de XP total acumulado:
   - Nível 1 (Iniciante): 0 XP — desbloqueado por padrão
   - Nível 2 (Básico): 30 XP
   - Nível 3 (Intermediário): 100 XP
   - Nível 4 (Avançado): 250 XP
   - Nível 5 (Fluente): 500 XP
2. WHEN o XP total do usuário é atualizado, THE Gerenciador_de_Nível SHALL recalcular o nível atual com base nos limiares definidos.
3. THE Gerenciador_de_Nível SHALL calcular o progresso percentual dentro do nível atual como: `(XP_atual - XP_limiar_nível_atual) / (XP_limiar_próximo_nível - XP_limiar_nível_atual) * 100`, arredondado para inteiro.
4. WHEN o usuário atinge o XP necessário para o próximo nível, THE Gerenciador_de_Nível SHALL atualizar o nível atual no Perfil_Global_de_Gamificação.
5. WHILE o usuário está no Nível 5, THE Gerenciador_de_Nível SHALL manter o progresso em 100% e não tentar calcular um próximo nível.
6. THE Gerenciador_de_Nível SHALL garantir que o nível calculado seja sempre um valor entre 1 e 5 inclusive.
7. FOR ALL valores de XP total não-negativos, THE Gerenciador_de_Nível SHALL produzir um nível válido entre 1 e 5 e um progresso entre 0 e 100 (propriedade de completude).

---

### Requisito 3: Desbloqueio Progressivo de Tópicos

**User Story:** Como usuário, quero desbloquear novos tópicos de chat conforme avanço de nível, para que haja uma progressão de aprendizado com desafios crescentes.

#### Critérios de Aceitação

1. THE Controlador_de_Acesso SHALL associar cada tópico a um nível mínimo de desbloqueio conforme a tabela abaixo:
   - Nível 1: `phone-screen`, `grammar-essentials`
   - Nível 2: `job-interviews`, `vocabulary-builder`
   - Nível 3: `travel-conversations`, `pronunciation-practice`
   - Nível 4: `business-meetings`, `business-english`
   - Nível 5: `travel-phrases`, `idioms-slang`
2. WHEN o usuário tenta acessar um tópico, THE Controlador_de_Acesso SHALL verificar se o nível atual do usuário é maior ou igual ao nível mínimo do tópico.
3. IF o nível do usuário for inferior ao nível mínimo do tópico, THEN THE Controlador_de_Acesso SHALL bloquear o acesso e retornar o nível necessário para desbloqueio.
4. WHEN o usuário atinge um novo nível, THE Controlador_de_Acesso SHALL tornar acessíveis todos os tópicos cujo nível mínimo seja igual ao novo nível do usuário.
5. THE Controlador_de_Acesso SHALL garantir que tópicos de nível inferior ao nível atual do usuário permaneçam sempre acessíveis (desbloqueio é permanente e não reversível).
6. FOR ALL combinações de nível de usuário (1–5) e tópico, THE Controlador_de_Acesso SHALL retornar um resultado determinístico e consistente de acesso (propriedade de determinismo).
7. THE Controlador_de_Acesso SHALL garantir que o número de tópicos desbloqueados seja monotonicamente crescente conforme o nível aumenta (propriedade de monotonicidade).

---

### Requisito 4: Persistência do Perfil Global de Gamificação

**User Story:** Como usuário, quero que meu progresso de gamificação seja salvo no servidor, para que eu não perca meus pontos e níveis ao trocar de dispositivo ou sessão.

#### Critérios de Aceitação

1. THE Sistema_de_Gamificação SHALL criar e manter uma tabela `user_gamification_profile` no Supabase com os campos: `user_id`, `total_xp`, `current_level`, `level_progress`, `created_at`, `updated_at`.
2. WHEN um usuário faz login pela primeira vez, THE Sistema_de_Gamificação SHALL criar um registro em `user_gamification_profile` com `total_xp = 0`, `current_level = 1` e `level_progress = 0`.
3. WHEN o XP do usuário é atualizado, THE Sistema_de_Gamificação SHALL atualizar atomicamente os campos `total_xp`, `current_level`, `level_progress` e `updated_at` no mesmo registro.
4. THE Sistema_de_Gamificação SHALL garantir que exista no máximo um registro de gamificação por `user_id` (unicidade).
5. IF o registro de gamificação não existir no momento de uma atualização de XP, THEN THE Sistema_de_Gamificação SHALL criar o registro com os valores calculados antes de retornar sucesso.
6. THE Sistema_de_Gamificação SHALL ler o perfil de gamificação do Supabase no carregamento do app para exibir o estado atual ao usuário.

---

### Requisito 5: Exibição do Progresso na Interface

**User Story:** Como usuário, quero ver meu XP total, nível atual e progresso para o próximo nível na interface do app, para que eu tenha feedback visual constante do meu avanço.

#### Critérios de Aceitação

1. THE Sistema_de_Gamificação SHALL exibir o nível atual do usuário, o XP total e a barra de progresso para o próximo nível na tela inicial (HomeDashboard).
2. WHEN o usuário encerra uma sessão de chat com XP ganho maior que 0, THE Sistema_de_Gamificação SHALL exibir uma notificação com o XP ganho naquela sessão.
3. WHEN o usuário sobe de nível, THE Sistema_de_Gamificação SHALL exibir uma mensagem de parabéns e listar os novos tópicos desbloqueados.
4. THE Sistema_de_Gamificação SHALL exibir em cada card de tópico bloqueado o nível necessário para desbloqueio e o XP faltante.
5. WHILE o usuário está em uma sessão de chat ativa, THE Sistema_de_Gamificação SHALL exibir um indicador de tempo de sessão em andamento.
6. IF o usuário estiver no Nível 5, THEN THE Sistema_de_Gamificação SHALL exibir uma mensagem de "Nível Máximo Atingido" no lugar da barra de progresso.

---

### Requisito 6: Integridade e Consistência dos Dados

**User Story:** Como desenvolvedor, quero que o sistema de gamificação mantenha dados consistentes e íntegros, para que os usuários não percam progresso e o sistema seja confiável.

#### Critérios de Aceitação

1. THE Sistema_de_Gamificação SHALL garantir que `total_xp` nunca seja negativo em nenhum registro de `user_gamification_profile`.
2. THE Sistema_de_Gamificação SHALL garantir que `current_level` seja sempre um inteiro entre 1 e 5 inclusive.
3. THE Sistema_de_Gamificação SHALL garantir que `level_progress` seja sempre um inteiro entre 0 e 100 inclusive.
4. FOR ALL atualizações de XP com valor delta não-negativo, THE Sistema_de_Gamificação SHALL garantir que o `total_xp` resultante seja maior ou igual ao `total_xp` anterior (propriedade de monotonicidade do XP).
5. FOR ALL valores de `total_xp`, THE Sistema_de_Gamificação SHALL garantir que o `current_level` calculado seja consistente com os limiares definidos no Requisito 2 (propriedade de consistência nível-XP).
6. THE Sistema_de_Gamificação SHALL garantir que recalcular o nível a partir do `total_xp` armazenado produza o mesmo `current_level` e `level_progress` armazenados (propriedade de round-trip de cálculo).

---

### Requisito 7: Sessão de Chat — Rastreamento de Tempo

**User Story:** Como sistema, preciso rastrear com precisão o tempo de cada sessão de chat para calcular o XP corretamente.

#### Critérios de Aceitação

1. THE Sistema_de_Gamificação SHALL registrar o timestamp de início da sessão quando o componente de chat é montado.
2. WHEN o componente de chat é desmontado ou o usuário navega para fora, THE Sistema_de_Gamificação SHALL calcular a duração da sessão como `timestamp_fim - timestamp_início` em segundos.
3. THE Sistema_de_Gamificação SHALL associar cada sessão ao `user_id` e ao `topic_id` correspondentes.
4. IF o app for fechado abruptamente durante uma sessão, THEN THE Sistema_de_Gamificação SHALL utilizar o evento `beforeunload` do navegador para tentar salvar o tempo parcial acumulado.
5. THE Sistema_de_Gamificação SHALL ignorar sessões com duração negativa ou zero ao calcular XP (proteção contra erros de clock).
6. FOR ALL durações de sessão em segundos (valor inteiro não-negativo), THE Calculador_de_XP SHALL produzir um XP não-negativo e proporcional ao tempo (propriedade de proporcionalidade).


---

### Requisito 8: Configurabilidade e Modularidade do Sistema

**User Story:** Como desenvolvedor, quero que todas as regras de gamificação estejam centralizadas em um único arquivo de configuração e que o sistema aceite essa configuração como parâmetro, para que seja fácil ajustar taxas de XP, limiares de nível e mapeamento de tópicos sem precisar modificar múltiplos arquivos.

#### Critérios de Aceitação

1. THE Sistema_de_Gamificação SHALL centralizar todas as regras de negócio de gamificação — incluindo a taxa de conversão de tempo em XP, os limiares de XP por nível e o mapeamento de tópico para nível mínimo — em um único arquivo de configuração dedicado.
2. WHEN qualquer regra de negócio de gamificação precisar ser alterada, THE Sistema_de_Gamificação SHALL exigir modificação em apenas um arquivo de configuração para que a mudança se propague a todos os módulos dependentes.
3. THE Calculador_de_XP SHALL aceitar a configuração de gamificação como parâmetro de entrada (injeção de dependência) em vez de importar valores diretamente de constantes globais.
4. THE Gerenciador_de_Nível SHALL aceitar a configuração de gamificação como parâmetro de entrada (injeção de dependência) em vez de importar valores diretamente de constantes globais.
5. THE Controlador_de_Acesso SHALL aceitar a configuração de gamificação como parâmetro de entrada (injeção de dependência) em vez de importar valores diretamente de constantes globais.
6. THE Sistema_de_Gamificação SHALL fornecer uma configuração padrão exportada que corresponda exatamente às regras definidas nos Requisitos 1, 2 e 3, utilizada em produção quando nenhuma configuração alternativa for fornecida.
7. IF uma configuração fornecida omitir campos obrigatórios, THEN THE Sistema_de_Gamificação SHALL rejeitar a configuração com uma mensagem de erro descritiva antes de executar qualquer cálculo.
8. FOR ALL configurações válidas fornecidas ao sistema, THE Sistema_de_Gamificação SHALL se comportar de forma consistente e determinística: os mesmos inputs de XP e nível produzem os mesmos outputs independentemente de quando ou quantas vezes o cálculo é executado (propriedade de consistência por configuração).
9. FOR ALL pares de configurações válidas distintas, THE Sistema_de_Gamificação SHALL produzir resultados diferentes quando os parâmetros de configuração diferirem, garantindo que a configuração efetivamente controla o comportamento do sistema (propriedade de sensibilidade à configuração).
