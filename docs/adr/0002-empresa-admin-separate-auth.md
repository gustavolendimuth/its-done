# Administrador da Empresa é uma tabela própria, não um User com role

**Status**: accepted

O sistema já tem uma noção de "admin" — `UserRole.ADMIN`, concedido automaticamente ao primeiro `User` cadastrado, usado pelo `AdminGuard` pra proteger o painel administrativo da plataforma. Ao desenhar quem gerencia uma Empresa (ver ADR-0001), a opção mais óbvia seria reaproveitar esse mesmo mecanismo: dar a um `User` existente uma flag "é admin desta Empresa".

Rejeitamos isso porque são dois conceitos diferentes que só parecem iguais pelo nome. `UserRole.ADMIN` é sobre administrar a plataforma It's Done; um Administrador da Empresa administra uma Empresa específica, é uma identidade separada da conta de Colaborador da mesma pessoa (nada impede alguém de ser Colaborador de uma Empresa com seu `User` pessoal e, à parte, Administrador de outra Empresa), e sua sessão precisa carregar qual Empresa ele administra. Misturar os dois nesse mesmo `User`/`UserRole` criaria uma segunda dimensão de permissão dentro do que hoje é uma dimensão só, e obrigaria toda rota de plataforma a passar a checar também "admin de qual empresa".

Decidimos então: `Administrador da Empresa` é uma tabela própria (`EmpresaAdmin`), independente de `User`, com suas próprias credenciais. A autenticação, porém, reaproveita a infraestrutura do módulo `auth/` existente — `JwtService`, hashing de senha com bcrypt, o padrão de token de reset por email — em vez de duplicar essa machinery num módulo à parte. O JWT emitido pra um Administrador carrega um claim de tipo (`type: 'empresa_admin'`) que o diferencia do JWT de `User`, e guards/estratégias próprios (`EmpresaJwtStrategy`, `EmpresaAuthGuard`) validam esse claim — o `AdminGuard` e o `JwtStrategy` de `User` continuam intocados.

## Considered Options

- **Reaproveitar `User`/`UserRole`**: adicionar um relacionamento `User` ↔ `Empresa` com uma flag de admin. Rejeitado: conflita semanticamente com `UserRole.ADMIN` (admin de plataforma) e não modela bem uma pessoa administrando várias Empresas com identidades separadas da sua conta de Colaborador.
- **Módulo de autenticação totalmente separado**, sem reaproveitar `JwtService`/bcrypt/fluxo de reset do `auth/` atual. Rejeitado: duplicaria machinery que já funciona, sem ganho real de isolamento — o isolamento que importa (tabela própria, claim próprio, guard próprio) já é alcançado sem duplicar a infraestrutura.
