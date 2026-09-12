# Work Timer Specification

## Problem Statement

Hoje o usuário só registra horas manualmente, digitando quanto trabalhou depois do fato — o que é impreciso e fácil de esquecer. Ele quer apertar um botão no início do trabalho, ver um contador rodando, receber um aviso de hora em hora perguntando se ainda está na tarefa, e só preencher os detalhes (cliente, projeto, descrição) quando terminar. O contador precisa sobreviver a fechar o navegador e acompanhar o usuário entre dispositivos.

## Goals

- [ ] Iniciar/parar o registro de tempo com um clique, sem precisar saber a duração de antemão
- [ ] Contador confiável, que não perde tempo mesmo com o navegador fechado (fonte da verdade é sempre timestamp, nunca um contador que só incrementa)
- [ ] **Local-first**: iniciar, contar, ser avisado de hora em hora e parar funcionam mesmo sem nenhuma conexão com a internet, sincronizando depois — base pensada para uma futura versão mobile
- [ ] Aviso horário via push real (quando online) ou verificação local equivalente (quando offline), perguntando se o usuário ainda está trabalhando, com pausa automática se não responder
- [ ] Sessão visível e controlável a partir de qualquer dispositivo logado (uma sessão ativa por vez, com conflito resolvido automaticamente se duas nascerem offline ao mesmo tempo)
- [ ] Ao encerrar, gerar um `WorkHour` real, íntegro com o modelo de dados e o cálculo de fatura já existentes

## Out of Scope

| Feature                                       | Reason                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| Múltiplas sessões simultâneas                  | Recusado explicitamente pelo usuário — uma sessão ativa por vez         |
| Sincronização em tempo real via WebSocket      | Recusado — sync local-first ao reconectar é suficiente pro caso de uso  |
| Formulário final funcionando offline           | Recusado explicitamente — só o timer (início/contagem/parada) é local-first; o formulário exige conexão pra carregar cliente/projeto |
| Biblioteca de sync completa (RxDB/Dexie/etc.)  | Recusado explicitamente — IndexedDB com lib leve (`idb`) é suficiente, sem trazer dependência pesada |
| Edição de sessões passadas (retroativo)        | O `WorkHour` gerado é editável pelas telas que já existem hoje          |
| Relatórios/analytics sobre uso do timer        | Fora do escopo desta feature — dado bruto vira `WorkHour` normal        |
| Notificação por e-mail do aviso horário        | O aviso horário é só push/local; e-mail já existe para outros fluxos (limiar de horas) |
| App mobile de fato                             | Esta feature só prepara o terreno (arquitetura local-first); nenhum app mobile é entregue aqui |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | --------------- | --------- | ---------- |
| Descarte de sessão | Permitido a qualquer momento antes do formulário final ser confirmado, com confirmação explícita do usuário | Evita perda de dado por engano; usuário pode ter clicado sem querer | y (padrão, aceito) |
| Notificação negada/não concedida | Sessão continua contando normalmente; aviso vira banner in-app quando o app está aberto; **sem pausa automática** (não há como detectar "sem resposta" a algo que nunca foi entregue) | Push é best-effort; timer não pode depender de permissão do navegador pra funcionar | y (padrão, aceito) |
| Janela de graça antes de pausar automaticamente | 15 minutos após o push ser entregue | Dá tempo do usuário ver e responder sem pausar prematuramente | y (padrão, aceito) |
| Ciclo do aviso horário | A cada 60 min a partir do início da sessão, ou da última confirmação "ainda trabalhando" (o que for mais recente) | Evita perguntar de novo logo depois de uma confirmação recente | y (padrão, aceito) |
| Botão manual de parar | Sempre visível na UI, independente de push/pausa | Usuário não deveria depender de notificação pra encerrar a sessão | y (padrão, aceito) |
| Duração máxima de sessão sem confirmação | Sem limite rígido — UI mostra aviso visual se a sessão estiver rodando há mais de 12h corridas, mas não força encerramento | Evita "fatura fantasma" de sessão esquecida sem bloquear casos legítimos de sessão longa | y (padrão, aceito) |
| Subscription de push inválida/expirada | Removida da base ao receber erro de envio (ex.: 410/404 do serviço de push) | Evita acumular subscriptions mortas e tentar reenviar pra elas | y (padrão, aceito) |
| Limite de idade de um `startedAt` vindo de sincronização offline | Rejeitado (com erro claro pro usuário) se `startedAt` local for mais de 7 dias no passado; sempre limitado (clamp) a não ser no futuro em relação ao relógio do servidor | Proteção contra relógio de dispositivo desconfigurado/bug local, não é um controle antifraude | y (padrão, aceito) |
| Identificação da sessão | `id` da `WorkSession` é gerado no dispositivo (UUID local) no momento do `start`, não pelo banco | Necessário pra local-first: a sessão precisa existir com identidade própria antes de qualquer round-trip ao servidor | y (padrão, aceito) |
| Reenvio de evento já aplicado (retry de rede) | Idempotente por `eventId` gerado no cliente — reenviar o mesmo evento é no-op | Sincronização pode falhar a meio caminho (resposta perdida) e tentar de novo; não pode duplicar efeito | y (padrão, aceito) |

**Open questions:** none — todas resolvidas em discussão ou registradas acima como premissa.

---

## User Stories

### P1: Iniciar e ver o timer rodando ⭐ MVP

**User Story**: Como usuário, quero clicar em um botão para começar a registrar meu tempo de trabalho e ver um contador rodando na tela, para não precisar calcular manualmente quanto tempo trabalhei.

**Why P1**: É o núcleo da feature — sem isso não há o que sincronizar, pausar ou notificar.

**Acceptance Criteria**:

1. WHEN o usuário clica em "Iniciar" e não há sessão ativa localmente THEN o sistema SHALL criar uma sessão de trabalho com status RUNNING e `startedAt` = timestamp do dispositivo no momento do clique, imediatamente, sem depender de round-trip ao servidor
2. WHEN uma sessão está RUNNING THEN a UI SHALL exibir um contador de tempo decorrido, atualizado a cada segundo, calculado a partir de timestamps armazenados (nunca de uma variável que só incrementa)
3. WHEN o usuário clica em "Iniciar" e já existe uma sessão RUNNING ou PAUSED conhecida localmente nesse dispositivo THEN o sistema SHALL rejeitar a criação e SHALL exibir a sessão já ativa em vez de criar uma nova
4. WHEN o usuário recarrega a página ou reabre o app com uma sessão RUNNING existente THEN a UI SHALL retomar a exibição do contador com o tempo decorrido correto, sem reiniciar do zero

**Independent Test**: Clicar em iniciar, ver o contador subir, recarregar a página e confirmar que o contador continua do valor correto (não zera).

---

### P1: Contador sobrevive ao fechamento do navegador ⭐ MVP

**User Story**: Como usuário, quero que o tempo continue sendo contado mesmo se eu fechar o navegador, para não perder o registro se eu esquecer a aba aberta.

**Why P1**: É um requisito explícito do usuário e distingue esta feature de um timer client-side comum.

**Acceptance Criteria**:

1. WHEN uma sessão está RUNNING e o navegador é fechado THEN o sistema SHALL continuar contando o tempo de forma implícita (a duração é sempre derivada de timestamps armazenados — localmente e, quando possível, sincronizados com o servidor — nunca de um timer rodando só na memória da aba)
2. WHEN o usuário reabre o app depois do navegador ter sido fechado por um período THEN a UI SHALL mostrar o tempo decorrido correto, incluindo o período em que o navegador esteve fechado (se a sessão continuou RUNNING nesse período), reconciliando com o servidor assim que houver conexão

**Independent Test**: Iniciar sessão, fechar a aba/navegador completamente, esperar alguns minutos, reabrir e conferir que o contador reflete o tempo total decorrido.

---

### P1: Sincronização entre dispositivos ⭐ MVP

**User Story**: Como usuário, quero que, se eu deslogar de um dispositivo e entrar em outro, o timer que estava rodando apareça lá, para poder controlar a sessão de onde eu estiver.

**Why P1**: Requisito explícito do usuário — o timer não pode ficar preso a um dispositivo.

**Acceptance Criteria**:

1. WHEN o usuário faz login em um dispositivo diferente do que iniciou a sessão, e há uma sessão RUNNING ou PAUSED autoritativa no servidor THEN a UI desse dispositivo SHALL exibir a mesma sessão ativa com o tempo decorrido correto
2. WHEN o usuário pausa, retoma ou encerra a sessão em um dispositivo (e esse dispositivo está online) THEN os demais dispositivos logados com esse usuário (também online) SHALL refletir a mudança de estado em até o intervalo de sincronização definido em Design (sem exigir reload manual)
3. WHEN não há sessão ativa para o usuário THEN qualquer dispositivo logado SHALL exibir o botão "Iniciar" (não um contador)
4. WHEN dois dispositivos criam uma sessão local cada um offline (sem saber um do outro) e ambos eventualmente sincronizam THEN o sistema SHALL manter como autoritativa apenas a sessão de `startedAt` mais antigo e SHALL descartar automaticamente a outra, avisando o dispositivo perdedor na resposta da sua própria sincronização (sem bloquear o uso)

**Independent Test**: Iniciar sessão em um dispositivo/aba, abrir a aplicação logada com o mesmo usuário em outro dispositivo/aba (ambos online), e confirmar que o timer aparece rodando lá também.

---

### P1: Aviso horário com push real ⭐ MVP

**User Story**: Como usuário, quero receber uma notificação a cada hora perguntando se ainda estou trabalhando naquela tarefa, mesmo com o navegador fechado, para não deixar o timer rodando à toa se eu esquecer de parar.

**Why P1**: É o mecanismo central de controle de qualidade do tempo registrado — requisito explícito do usuário.

**Acceptance Criteria**:

1. WHEN o usuário concede permissão de notificação THEN o sistema SHALL registrar uma push subscription vinculada ao usuário e ao dispositivo/navegador
2. WHEN uma sessão está RUNNING e se passam 60 minutos desde o início (ou desde a última confirmação "ainda trabalhando") THEN o sistema SHALL enviar uma notificação push, com ações "Sim, continuar" e "Não, encerrar", para todas as subscriptions ativas do usuário
3. WHEN o usuário clica em "Sim, continuar" na notificação THEN o sistema SHALL registrar a confirmação e reiniciar a contagem de 60 minutos para o próximo aviso, sem interromper a contagem de tempo
4. WHEN o usuário clica em "Não, encerrar" na notificação THEN o sistema SHALL levar o usuário ao formulário final de fim de sessão (ver história "Encerrar sessão e preencher detalhes")
5. WHEN o push é entregue e o usuário não responde dentro de 15 minutos THEN o sistema SHALL pausar automaticamente a sessão (status PASSA a PAUSED, parando de contar tempo)
6. WHEN o usuário não concedeu permissão de notificação (ou negou) THEN o sistema SHALL continuar contando a sessão normalmente e SHALL exibir o aviso apenas como banner in-app quando o app estiver aberto, aplicando a mesma regra local de 60min/15min descrita na história "Funciona offline (local-first)" pra decidir a pausa automática (não depende do push ter sido entregue)

**Independent Test**: Com permissão concedida, simular a passagem de 60 minutos (via ajuste de horário do dado de teste) e confirmar que a notificação é enviada; não respondê-la e confirmar que a sessão pausa após a janela de graça.

---

### P1: Retomar sessão pausada ⭐ MVP

**User Story**: Como usuário, quero poder retomar uma sessão pausada automaticamente, seja pela notificação, seja pelo app, para continuar contando o tempo de onde parei.

**Why P1**: Complementa o aviso horário — sem retomada, toda pausa automática viraria um encerramento forçado.

**Acceptance Criteria**:

1. WHEN a sessão está PAUSED e o usuário clica em "Sim, continuar" (na notificação ou na UI) THEN o sistema SHALL voltar o status para RUNNING e SHALL retomar a contagem de tempo a partir daquele momento (o tempo pausado não conta)
2. WHEN a sessão está PAUSED THEN ela SHALL permanecer pausada indefinidamente até o usuário retomar ou encerrar — nenhum processo automático a encerra por timeout

**Independent Test**: Forçar uma sessão para o estado PAUSED, clicar em retomar, e confirmar que o contador volta a subir sem incluir o tempo em que ficou pausada.

---

### P1: Funciona offline (local-first) ⭐ MVP

**User Story**: Como usuário, quero poder iniciar, ver o contador e parar o timer mesmo sem internet no momento, para não perder o registro por causa de uma queda de conexão — e pra essa base já nascer pronta pra uma versão mobile no futuro.

**Why P1**: Sem isso, qualquer instabilidade de rede faz o timer contar tempo errado ou perder ações do usuário — quebra a confiança no dado gerado, que é o propósito central da feature.

**Acceptance Criteria**:

1. WHEN o usuário clica em "Iniciar", "Parar" ou "Descartar" sem conexão com a internet THEN o sistema SHALL aplicar a ação imediatamente no armazenamento local do dispositivo (IndexedDB), com o timestamp real do clique, sem exibir erro de rede
2. WHEN uma ação é aplicada offline THEN o sistema SHALL enfileirá-la numa fila local de sincronização, preservando a ordem e o timestamp original de cada ação
3. WHEN a conexão volta (evento de reconexão do navegador) THEN o sistema SHALL enviar a fila pendente ao backend, que SHALL aplicar cada ação usando o timestamp original do dispositivo (limitado entre o início do segmento em RUNNING e o horário atual do servidor, nunca no futuro) — o tempo em que o dispositivo ficou offline sem ação do usuário não conta como pausado nem como perdido, ele é resolvido pela própria matemática de timestamps
4. WHEN uma sessão está RUNNING e o dispositivo está offline THEN o sistema SHALL aplicar localmente a mesma regra de aviso horário (60min) e pausa automática (15min de graça) descrita na história "Aviso horário com push real", usando o relógio do dispositivo, e SHALL sincronizar o resultado (inclusive uma pausa automática decidida offline) quando a conexão voltar
5. WHEN o mesmo evento de sincronização é enviado mais de uma vez (ex.: resposta perdida por falha de rede) THEN o sistema SHALL tratá-lo como no-op na segunda vez, sem duplicar efeito
6. WHEN o dispositivo está offline e o usuário fecha e reabre o app THEN a sessão local (e a fila pendente) SHALL persistir entre reaberturas, sem se perder por causa do fechamento

**Independent Test**: Colocar o navegador em modo offline (DevTools), iniciar e depois parar uma sessão, confirmar que tudo funciona sem erro; voltar o modo online e confirmar que a sessão aparece corretamente sincronizada no backend com os timestamps originais.

---

### P1: Encerrar sessão e preencher detalhes ⭐ MVP

**User Story**: Como usuário, quero, ao final da sessão de trabalho, preencher cliente, projeto e descrição, para que o tempo vire um registro de horas de verdade, igual aos que já uso hoje.

**Why P1**: É o valor final da feature — sem isso, o tempo contado nunca vira um `WorkHour` faturável.

**Acceptance Criteria**:

1. WHEN o usuário clica em "Parar" (manual, ou via ação "Não, encerrar" da notificação) THEN o sistema SHALL congelar o tempo imediatamente (status STOPPING, mesmo offline) e, assim que houver conexão, SHALL exibir um formulário com a duração calculada (soma dos intervalos RUNNING, excluindo tempo PAUSED) arredondada para o múltiplo de 15 minutos mais próximo — o formulário em si exige conexão pra carregar as opções de cliente/projeto
2. WHEN o usuário preenche cliente (obrigatório) e descrição (obrigatória), projeto (opcional), e confirma THEN o sistema SHALL criar um `WorkHour` com `hours` = duração arredondada, `clientId`, `projectId` (se informado) e `description`, e SHALL marcar a sessão como ENDED
4. WHEN o usuário tenta confirmar o formulário sem cliente ou sem descrição THEN o sistema SHALL bloquear o envio e SHALL indicar os campos obrigatórios faltantes
5. WHEN o usuário opta por descartar a sessão (antes de confirmar o formulário) THEN o sistema SHALL pedir confirmação explícita e, se confirmado, SHALL marcar a sessão como DISCARDED sem criar nenhum `WorkHour`

**Independent Test**: Rodar uma sessão por alguns minutos, parar, preencher cliente + descrição, confirmar, e verificar que um `WorkHour` correspondente aparece na listagem de horas.

---

### P2: Aviso visual de sessão muito longa

**User Story**: Como usuário, quero ver um aviso se minha sessão estiver rodando há muito tempo, para perceber se esqueci de parar.

**Why P2**: Melhora a qualidade dos dados sem ser bloqueante — não é essencial para o MVP funcionar ponta a ponta.

**Acceptance Criteria**:

1. WHEN uma sessão RUNNING ultrapassa 12 horas corridas de duração total THEN a UI SHALL exibir um destaque visual de alerta junto ao contador, sem interromper ou pausar a sessão

**Independent Test**: Forçar `startedAt` de uma sessão de teste para mais de 12h atrás e confirmar que o alerta visual aparece.

---

### P3: Gerenciar subscriptions de push obsoletas

**User Story**: Como sistema, quero remover subscriptions de push que não funcionam mais, para não desperdiçar tentativas de envio nem acumular lixo no banco.

**Why P3**: Housekeeping — não afeta a experiência do usuário no MVP, mas evita degradação a longo prazo.

**Acceptance Criteria**:

1. WHEN um envio de push retorna erro indicando subscription inválida/expirada (410/404 do serviço de push) THEN o sistema SHALL remover essa subscription do banco

---

## Edge Cases

- WHEN o usuário tenta iniciar uma sessão e já existe uma sessão local conhecida nesse dispositivo THEN o sistema SHALL simplesmente mostrar essa sessão (local-first: não depende do backend estar acessível pra saber disso)
- WHEN dois dispositivos criam sessões locais offline quase ao mesmo tempo e sincronizam em momentos diferentes THEN o sistema SHALL resolver pela regra de `startedAt` mais antigo (ver história "Funciona offline"), inclusive de forma **retroativa**: se o dispositivo que já estava sincronizado e "ativo" perder o conflito depois, sua sessão SHALL ser descartada mesmo já tendo sido usada por alguns minutos — comportamento aceito explicitamente, avisado por toast discreto
- WHEN o usuário clica duas vezes seguidas em "Sim, continuar" (ex.: duplo clique, ou clique na notificação de dois dispositivos) THEN o sistema SHALL tratar a segunda confirmação como no-op, sem erro visível ao usuário
- WHEN a sessão está PAUSED e o usuário fecha o navegador sem responder THEN o sistema SHALL manter o estado PAUSED indefinidamente, preservando o tempo já acumulado até a reabertura
- WHEN o `projectId` informado no formulário final não pertence ao `clientId` selecionado THEN o sistema SHALL rejeitar a criação do `WorkHour` com erro de validação (mesma regra já aplicada na criação manual de `WorkHour` hoje)
- WHEN o `startedAt` de uma sessão sincronizada estiver implausivelmente no passado (mais de 7 dias) THEN o sistema SHALL rejeitar a sincronização dessa sessão com um erro claro, em vez de aceitar um dado de relógio local corrompido

---

## Requirement Traceability

| Requirement ID | Story                                          | Phase  | Status  |
| --------------- | ----------------------------------------------- | ------ | ------- |
| WKT-01          | P1: Iniciar e ver o timer rodando               | Verified | ✅ Verified |
| WKT-02          | P1: Contador sobrevive ao fechamento do navegador | Verified | ✅ Verified |
| WKT-03          | P1: Sincronização entre dispositivos            | Verified | ✅ Verified (bloqueador de wiring corrigido na rodada 1 de fix) |
| WKT-04          | P1: Aviso horário com push real                 | Verified | ✅ Verified (UAT de push real com VAPID pendente — ver validation.md) |
| WKT-05          | P1: Retomar sessão pausada                      | Verified | ✅ Verified |
| WKT-06          | P1: Encerrar sessão e preencher detalhes        | Verified | ✅ Verified |
| WKT-07          | P2: Aviso visual de sessão muito longa          | Verified | ✅ Verified |
| WKT-08          | P3: Gerenciar subscriptions de push obsoletas   | Verified | ✅ Verified |
| WKT-09          | P1: Funciona offline (local-first)              | Verified | ✅ Verified |

**ID format:** `WKT-[NUMBER]`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 9 total, 9 mapped to tasks, 0 unmapped. Verificado pelo Verifier independente na rodada 2 (ver `.specs/features/work-timer/validation.md`) — PASS, 25/30 acceptance criteria numerados confirmados com evidência direta, 0 gaps bloqueantes, 4 gaps menores não-bloqueantes remanescentes (documentados no relatório).

---

## Success Criteria

- [ ] Usuário consegue iniciar, deixar rodando com o navegador fechado, e retomar em outro dispositivo sem perder tempo contado
- [ ] Aviso push chega em até 60 min de sessão ativa e a pausa automática funciona quando não respondido
- [ ] Ao encerrar, o `WorkHour` gerado aparece corretamente na listagem de horas e entra no cálculo de fatura do projeto, igual a um registro manual
- [ ] Iniciar e parar uma sessão inteiramente offline funciona sem erro, e ao reconectar os timestamps corretos chegam ao backend (sem contar tempo ocioso de queda de conexão)
