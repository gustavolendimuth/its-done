# Work Timer Context

**Gathered:** 2026-09-12
**Spec:** `.specs/features/work-timer/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Um timer de registro de horas: botão para iniciar, contador visível na UI, aviso push a cada hora perguntando se o usuário ainda está trabalhando, persistência de sessão que sobrevive ao fechamento do navegador, sincronização entre dispositivos, e um formulário ao final da sessão para preencher cliente/projeto/descrição e gerar um `WorkHour`.

---

## Implementation Decisions

### Mecanismo de push

- Web Push real (Service Worker + VAPID). Precisa chegar mesmo com a aba fechada.
- Backend hoje não tem nenhuma infra de push funcional (`/push/send` do frontend aponta pra endpoint inexistente) — isso é infra nova, não reaproveitável.
- Push é enviado pra **todos os dispositivos com subscription ativa do usuário**, não só o que iniciou a sessão (ele pode estar no celular quando o PC dispara o aviso).
- A notificação tem ações diretas: "Sim, continuar" e "Não, encerrar" — resolvidas pelo clique na própria notificação (service worker faz a chamada à API), sem precisar abrir o app.

### Local-first (pensando em mobile futuro) — supersede parcialmente a decisão original de sincronização

Decisão revisada após identificar o caso de queda de conexão: o timer (início/contagem/pausa automática/parada) é **local-first**, não só "online com polling". Motivação explícita do usuário: preparar terreno pra uma versão mobile futura.

- **Fonte da verdade imediata é o dispositivo local** (IndexedDB, via lib leve tipo `idb`). O usuário consegue iniciar, ver o contador, ser avisado de hora em hora e parar a sessão **mesmo sem nenhuma conexão com a internet**.
- Toda ação do timer (`start`, `confirm`, `pause`, `stop`, `discard`) é gravada localmente na hora, com o timestamp real do dispositivo, e enfileirada numa "outbox" local pra sincronizar quando a conexão existir.
- Ao ficar online (evento `online` do navegador + verificação periódica), o dispositivo envia a outbox pro backend num único endpoint de sincronização, que aplica os eventos em ordem e devolve o estado autoritativo atual da sessão do usuário.
- **O aviso horário e a pausa automática por falta de resposta também são replicados localmente**: o dispositivo, mesmo offline, roda a mesma regra (60min sem confirmação → avisa; 15min sem resposta → pausa), usando o relógio local, e sincroniza o resultado quando reconectar. O Web Push real continua existindo, mas cobre o caso "app fechado com internet disponível" — não substitui a checagem local.
- **Formulário final continua exigindo conexão** — decisão explícita do usuário: não vale a pena cachear listas de cliente/projeto localmente agora. Enquanto offline, a sessão fica em STOPPING (tempo já congelado, timestamp preservado) esperando a conexão voltar pra abrir o formulário.
- **Engine de storage local**: IndexedDB com lib leve (`idb`), não uma biblioteca de sync completa (RxDB/Dexie) — decisão explícita pra não trazer uma dependência pesada só por causa desta feature.

### Sessão única com conflito local-first

- Ainda vale: **uma sessão ativa por usuário**. Mas como a sessão pode nascer 100% offline em qualquer dispositivo, a garantia não é mais só uma constraint de escrita síncrona — é resolvida na hora da sincronização.
- **Regra de conflito**: se dois dispositivos criaram sessões locais offline (cada um sem saber do outro) e ambas chegam pro servidor, **vence a de `startedAt` mais antigo** (quem começou a trabalhar primeiro).
- **A sessão perdedora é descartada automaticamente** pelo servidor, sem intervenção do usuário — o dispositivo perdedor recebe essa informação na resposta da sua própria sincronização e mostra um toast discreto avisando (ex.: "uma sessão duplicada de outro dispositivo foi descartada").
- **Aceito explicitamente**: essa resolução pode ser retroativa — se o dispositivo B já sincronizou e ficou "ativo" por um tempo, e depois o dispositivo A sincroniza uma sessão com `startedAt` anterior à de B, o servidor troca a sessão autoritativa pra A e descarta a de B, mesmo que B já estivesse em uso há minutos. Ver Risco correspondente em `design.md`.

### Comportamento sem resposta ao aviso horário

- Se o usuário não responder o aviso dentro de uma janela de graça, a sessão **pausa automaticamente** (para de contar tempo) até ele confirmar.
- Enquanto pausada, fica pausada **indefinidamente** — sem timeout que force o encerramento sozinho. Só volta a contar ou encerra quando o usuário agir.
- Retomar: clicando em "Sim, continuar" na própria notificação (ou, se abrir o app, um botão de retomar na UI).
- Encerrar a partir da pausa: clicando em "Não, encerrar" leva ao formulário final de detalhes.

### Cálculo das horas

- O tempo pausado não conta. `hours` final é a soma dos intervalos em que a sessão esteve RUNNING.
- Arredondamento: **sempre para cima**, para o próximo múltiplo de 15 minutos (ex.: 1min → 15min/0.25h; 61min → 75min/1.25h; 60min exatos permanece 60min/1h). Decisão revisada pelo usuário após a primeira entrega — substitui a decisão original de "arredondamento matemático padrão" (mais próximo, empate pra cima).

### Formulário final (fim de sessão)

- Campos: **cliente** (obrigatório) + **descrição** (obrigatória) + **projeto** (opcional) — mesmo padrão do formulário atual de `WorkHour`.
- Ao confirmar, gera um `WorkHour` com `hours` = duração calculada (arredondada), `date` = data de início (ou fim — decisão de Design), `clientId`, `projectId?`, `description`.

### Agent's Discretion

- Formato exato do polling (intervalo em segundos) e do payload retornado pelo endpoint de "sessão ativa" — Design decide.
- Estrutura de dados pra representar segmentos RUNNING/PAUSED (ex.: `accumulatedSeconds` + `currentSegmentStartedAt`, ou lista de intervalos) — Design decide, desde que o resultado (hours excluindo tempo pausado) seja correto.
- Layout visual do contador na UI e da tela do formulário final — segue os padrões visuais já usados no projeto (BigStatsDisplay, Card themes, etc.), sem necessidade de nova direção visual.
- Texto exato da notificação push.

### Declined / Undiscussed Gray Areas → Assumptions

Itens que o usuário optou por deixar como premissa (decidido pelo agente, documentado no spec):

1. **Descarte de sessão** — usuário pode descartar a sessão (não gerar `WorkHour`) a qualquer momento antes de confirmar o formulário final, com uma confirmação explícita ("tem certeza?") pra evitar perda acidental.
2. **Permissão de notificação negada/não concedida** — a sessão continua rodando normalmente (contando via timestamp no servidor); sem a permissão, os avisos horários não chegam como push, mas aparecem como banner in-app quando o usuário tiver o app aberto. A sessão **não pausa automaticamente** nesse caso (não há como saber que o aviso "não foi respondido" se ele nunca foi entregue) — só pausa quando o push foi entregue e não respondido dentro da janela de graça.
3. **Janela de graça antes de pausar automaticamente** — 15 minutos após o envio do push sem resposta.
4. **Ciclo do aviso horário** — a cada 60 minutos contados a partir do início da sessão (ou da última confirmação "ainda estou trabalhando", o que for mais recente) — não é "de hora em hora" do relógio.
5. **Botão manual de parar** — sempre disponível na UI, independente de push/pausa automática, levando direto ao formulário final.
6. **Múltiplas subscriptions por usuário** — cada dispositivo/navegador em que o usuário conceder permissão de notificação gera uma subscription própria; todas recebem o push.

---

## Specific References

Nenhuma referência visual/produto específica foi trazida pelo usuário — segue os padrões visuais já estabelecidos no projeto (cards temáticos, PageHeader, BigStatsDisplay).

---

## Deferred Ideas

- Múltiplas sessões simultâneas (recusado — fora de escopo, ver decisão "Sessão única").
- WebSocket/tempo real (recusado a favor de polling — pode ser revisitado no futuro se o atraso do polling incomodar).
