# It's Done

Sistema de registro de horas e faturamento para profissionais autônomos (MEI/freelancers) e, a partir da feature empresarial, para empresas que gerenciam as horas de MEIs colaboradores.

## Language

**Empresa**:
Entidade que um Colaborador fatura pelas horas trabalhadas. Registro único e compartilhado — não duplicado por Colaborador. Nasce como registro simples (nome, email, telefone), sem credenciais, e pode opcionalmente ser ativada como conta com login próprio para gerenciar Colaboradores e ver o agregado de horas deles.
_Avoid_: Client, cliente, empresa cliente

**Colaborador**:
Um User vinculado a uma Empresa — a pessoa MEI que registra horas trabalhadas para ela e a fatura. Um Colaborador pode estar vinculado a N Empresas simultaneamente. Mantém WorkHour, Project, Task e Invoice próprios e privados; nenhum outro Colaborador da mesma Empresa os vê.
_Avoid_: funcionário, employee, membro

**Administrador da Empresa**:
Conta com login próprio (credenciais separadas das de User) autorizada a gerenciar uma Empresa: configurar domínio autorizado, cadastrar convites e ver o agregado de horas de todos os Colaboradores vinculados. Uma Empresa pode ter múltiplos Administradores.
_Avoid_: dono da empresa, empresa (quando o sentido é "quem loga", não o registro em si)

**Convite Pendente**:
Regra de vínculo automático criada por um Administrador da Empresa para um email específico que ainda não tem conta no It's Done. Vira vínculo de Colaborador assim que alguém se cadastra ou loga com aquele email.
_Avoid_: invite, convite (sem qualificação — ambíguo com o vínculo já efetivado)

**Domínio Autorizado**:
Domínio de email que uma Empresa registra para vínculo automático: todo User que se cadastra ou loga com um email daquele domínio vira Colaborador da Empresa. Domínios de provedores públicos de email (gmail.com, outlook.com etc.) não podem ser registrados como Domínio Autorizado. Exige confirmação por email corporativo antes de valer para vínculo automático.
_Avoid_: domínio corporativo (usar "Autorizado" para deixar claro que é o mecanismo de auto-vínculo, não uma propriedade genérica)

## Relationships

- **Empresa ↔ Colaborador**: N:N. Um Colaborador pode estar vinculado a várias Empresas; uma Empresa tem vários Colaboradores.
- **Empresa → Administrador da Empresa**: 1:N. Cada Empresa pode ter vários Administradores, cada um com login próprio.
- **Colaborador → WorkHour / Project / Task / Invoice**: mesma relação de posse que existe hoje entre User e esses registros — privados ao Colaborador, não visíveis a outros Colaboradores da mesma Empresa nem entre Empresas diferentes.
