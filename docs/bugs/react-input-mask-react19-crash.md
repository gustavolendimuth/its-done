# Bug: `react-input-mask` quebra com React 19 (`findDOMNode is not a function`)

Status: aberto, não corrigido ainda. Severidade alta: trava a tela inteira (error boundary do
Next.js) ao abrir qualquer formulário afetado. Descoberto na sessão de e2e da feature de
arredondamento de horas (MW-3), em 2026-09-14, testando via Playwright contra a app real, não
mockada.

## Resumo

`react-input-mask@2.0.4` usa `ReactDOM.findDOMNode` internamente para obter a ref do input. Essa
API foi removida no React 19 (o projeto está em `react@^19` e `react-dom@^19`), então qualquer
componente que renderiza `<InputMask>` explode com:

```
Runtime TypeError: reactDom.findDOMNode is not a function
  src/components/ui/phone-input.tsx (84:7) @ PhoneInput
```

Stack completa capturada ao abrir "Adicionar Cliente" em `/clients`:

```
PhoneInput          src/components/ui/phone-input.tsx (84:7)
ClientForm          src/components/clients/client-form.tsx (221:9)
ClientsPage         src/app/[locale]/(authenticated)/clients/page.tsx (118:9)
```

O mesmo acontece em qualquer outra tela que monte `<InputMask>`, inclusive o formulário de
lançar horas, que usa a mesma lib pra máscara `HH:mm`.

## Onde acontece

Só existem dois usos de `<InputMask>` no frontend, mas eles são consumidos por vários lugares:

- `apps/frontend/src/components/ui/phone-input.tsx:84` (`PhoneInput`)
  - `apps/frontend/src/components/clients/client-form.tsx`, criar cliente
  - `apps/frontend/src/components/clients/edit-client-modal.tsx`, editar cliente
  - `apps/frontend/src/components/profile/profile-form.tsx`, editar telefone do perfil
  - `apps/frontend/src/components/clients/client-card.tsx` (renderiza `ClientForm`/`EditClientModal`)
- `apps/frontend/src/components/work-hours/work-hour-form.tsx:203` (máscara `HH:mm` das horas)
  - `apps/frontend/src/app/[locale]/(authenticated)/work-hours/page.tsx`, lançar/editar horas
  - `apps/frontend/src/components/layout/topbar.tsx`, modal rápido de "Adicionar Horas"

Na prática, qualquer fluxo de criar ou editar cliente, editar perfil, ou lançar ou editar horas
quebra a tela ao abrir o formulário.

## Como reproduzir

1. Rodar a app localmente (backend e frontend) com um usuário logado.
2. Ir em `/clients` e clicar em "Adicionar Cliente" (ou `/work-hours`, "Adicionar Horas").
3. A tela quebra ao montar o formulário, com o overlay de erro do Next.js
   (`Application error: a client-side exception has occurred`).

Não depende de nenhuma interação do usuário. Quebra só de o componente montar.

## Causa raiz

`react-input-mask@2.0.4`, a última versão publicada, foi escrita pra React até a versão 18 e usa
`ReactDOM.findDOMNode(this)` pra achar o nó DOM do input por trás dos panos. O React 19 removeu
`ReactDOM.findDOMNode` de vez (já vinha deprecated desde o React 16 em strict mode), e
`@types/react-input-mask@^3.0.6` não alerta sobre essa quebra em runtime, porque é só os types.

A lib está sem manutenção há tempo e não recebeu correção pra isso; é um problema conhecido de
quem tenta usá-la com React 19.

## Impacto

Bloqueia pela UI: criar cliente, editar cliente, editar telefone no perfil, lançar horas, editar
horas. É provavelmente a causa raiz (ou uma das causas) de boa parte das cerca de 130 falhas que
sobraram na suíte de frontend depois da correção do bug de `jest.mock`/`@jest/globals` (commit
`f60d50a`, "fix: stop hoisting jest.mock above the jest import in test files") — qualquer teste
que monta `ClientForm`, `WorkHourForm`, `PhoneInput` ou uma tela que os inclua deve estar batendo
no mesmo `findDOMNode`.

Não bloqueia a API nem o backend, só a montagem desses componentes React no browser (e em testes
que renderizam DOM real via `@testing-library/react`).

## Workaround usado durante o e2e

Pra validar a feature de arredondamento de horas sem esse bug no caminho, os lançamentos de
cliente e de horas foram feitos via chamada direta à API (`curl` contra os endpoints REST),
contornando os formulários quebrados. Isso não é uma correção, só destravou o teste manual.

## Sugestões de correção

Nenhuma decidida ainda.

1. Trocar `react-input-mask` por uma lib mantida e compatível com React 19. Candidatas:
   `react-imask` (usa `imask` por baixo, mantida ativamente) ou `input-format`. É a mudança de
   API mais trabalhosa, mas resolve de raiz.
2. Implementar a máscara nativamente. Pro caso de `HH:mm` (`work-hour-form.tsx`) e
   `(11) 99999-9999` (`phone-input.tsx`) as regras são simples, um `onChange` com regex cobre os
   dois casos sem depender de lib externa. Já existe um regex de validação de horário duplicado
   entre `work-hour-form.tsx` e `lib/utils.ts`/`work-hour-card.tsx`; trocar a lib é uma boa
   chance de também unificar essa duplicação.
3. Fork ou patch local de `react-input-mask`, trocando a chamada a `findDOMNode` por um
   `forwardRef` ou callback ref. É a mais rápida de aplicar, mas fica mantendo um patch de uma
   lib morta.

A opção 2 parece a mais barata e a única que remove a dependência problemática de vez. Qualquer
uma resolve o crash; fica pra quem for corrigir decidir olhando o código com calma.

## Referências

- `apps/frontend/package.json`: `"react": "^19"`, `"react-dom": "^19"`,
  `"react-input-mask": "^2.0.4"`, `"@types/react-input-mask": "^3.0.6"`.
- Causa raiz verificada diretamente: `react-input-mask@2.0.4` chama `ReactDOM.findDOMNode`
  internamente, e essa API não existe mais no pacote `react-dom@19` (removida, não é só um
  warning de depreciação).
