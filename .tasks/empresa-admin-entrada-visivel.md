# Ponto de entrada visível pro login da Empresa

> Build this with **tlc-implement**.
> Every criterion below becomes a check with a proof, referenced by its number. Nothing under
> `Unresolved` gets settled while building.

## Intent

`/empresa-admin/login` e `/empresa-admin/dashboard` existem e funcionam, mas nenhum menu, link ou
botão em nenhum lugar da aplicação leva até eles - nem no menu principal do Colaborador
(`main-layout.tsx`, `nav.tsx`, `mobile-nav.tsx`, que só linkam pra `/empresas`, a antiga tela de
Clientes renomeada por MW-25), nem na tela de login de `User` (`/login`), nem em nenhuma landing
pública. Hoje só quem já sabe a URL exata e a digita manualmente consegue chegar lá - nenhum ticket
de MW-6 a MW-27 pediu esse ponto de entrada, e ele nunca foi decidido em lugar nenhum do mapa
original.

Com a mudança, existe pelo menos um link visível, alcançável sem conhecimento prévio da URL, que
leva a `/empresa-admin/login`.

2 criterios em 1 slice · 0 one-way doors · 1 open, dos quais 0 bloqueiam

## Criteria

1. Always, a tela de login de `User` (`/login`) mostra um link "É administrador de uma empresa?
   Entre aqui" (ou texto equivalente) apontando pra `/empresa-admin/login`.
2. Always, esse link é visível sem estar autenticado (a tela `/login` já é pública hoje).

## Out of scope

- Adicionar o link também no menu autenticado do Colaborador (`main-layout.tsx`/`nav.tsx`) - um
  Colaborador logado não é necessariamente um Administrador de Empresa; adicionar lá misturaria os
  dois papéis na navegação principal sem uma decisão de UX sobre como diferenciá-los (ver
  Unresolved 1).
- Landing pública/institucional fora da aplicação (marketing) - fora do repositório desta feature.

## Observable

| Surface | Decision | Landing |
| --- | --- | --- |
| screen `/login` (User) | novo elemento visual | 1 |
| screen `/login` (User) | estado não-autenticado | 2 |

## Swept

- validation: n/a - link estático, sem input
- failure modes: n/a - link estático, sem chamada de rede própria
- idempotency and retry: n/a - navegação, não há escrita
- authorization: existing - `/login` já é pública, `/empresa-admin/login` já é pública, nenhuma mudança de guard
- concurrency and ordering: n/a - sem estado compartilhado
- data lifecycle: n/a - nenhuma entidade envolvida
- external-dependency failure: n/a - nenhuma dependência externa nova
- state transitions: n/a - nenhuma máquina de estados envolvida
- observability: n/a - sem requisito novo

## Impact

| Front | What changes |
|---|---|
| domain | nenhum termo novo |
| stored data | nada a migrar |

## Decided

`None - adicionar um link estático a uma tela existente não é uma decisão de uma via.`

## Surface

`None - nenhuma interface nova consumida fora desta task.`

## Sources

- Investigação desta conversa - busca em `apps/frontend/src` por `href`/`Link` apontando pra
  `/empresa-admin/login` ou `/empresa-admin/dashboard` fora da própria pasta da feature não retornou
  nenhuma ocorrência; `main-layout.tsx:44`, `nav.tsx:23`, `mobile-nav.tsx:59` só referenciam
  `/empresas`.

Esta task é o registro da decisão. Se um documento vinculado divergir depois, perguntar antes de
construir.

## Unresolved

| # | Kind | Question | Until answered |
|---|---|---|---|
| 1 | open | O link deve aparecer só em `/login` (User), ou também em algum lugar acessível a quem nunca teve conta nenhuma (uma landing pública, se existir uma fora do escopo desta task)? | Critério 1 assume, como default, só a tela `/login` de `User`, por ser o único ponto de entrada de auth público já mapeado nesta investigação |

