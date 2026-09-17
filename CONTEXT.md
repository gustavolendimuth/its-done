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
Conta com login próprio (credenciais separadas das de User, tabela própria) autorizada a gerenciar uma Empresa: configurar domínio autorizado, cadastrar convites e ver o agregado de horas de todos os Colaboradores vinculados. Uma Empresa pode ter múltiplos Administradores. O primeiro Administrador nasce por Ativação da Empresa ou por auto-cadastro direto; os demais entram por Convite de Administrador.
_Avoid_: dono da empresa, empresa (quando o sentido é "quem loga", não o registro em si)

**Ativação da Empresa**:
Ato de transformar um registro Empresa simples (sem login, criado por um Colaborador que a fatura) em conta com Administrador. Exige provar posse de um email que bate com o email de contato já cadastrado na Empresa, ou com um domínio declarado (sujeito às mesmas regras do Domínio Autorizado). Alternativa a essa via é o auto-cadastro direto, quando não existe registro Empresa prévio.
_Avoid_: reivindicar, claim

**Convite de Administrador**:
Convite que um Administrador da Empresa envia a um email para que essa pessoa também vire Administrador daquela Empresa, mediante confirmação por link. Não exige que o email seja do Domínio Autorizado da Empresa (permite contador/consultor externo).
_Avoid_: convite (sem qualificação — ambíguo com Convite Pendente, que vincula um Colaborador, não um Administrador)

**Convite Pendente**:
Regra de vínculo automático que um Administrador da Empresa cria pra um email específico, só disponível depois que a Empresa foi ativada. Se o email já tem User associado, o vínculo de Colaborador é criado na hora; senão, fica pendente até a pessoa se cadastrar ou logar com aquele email. Empresas diferentes podem ter Convite Pendente pro mesmo email de forma independente — todos se efetivam.
_Avoid_: invite, convite (sem qualificação — ambíguo com o vínculo já efetivado)

**Domínio Autorizado**:
Domínio de email que uma Empresa (já ativada) registra para vínculo automático: todo User que se cadastra ou loga com um email daquele domínio vira Colaborador da Empresa. Domínios de provedores públicos de email (lista mantida no próprio código/config do It's Done — gmail.com, outlook.com etc.) não podem ser registrados. A confirmação de posse usa o próprio email que o Administrador já usa pra logar (já provado na Ativação da Empresa), sem exigir endereço genérico do tipo admin@domínio.
_Avoid_: domínio corporativo (usar "Autorizado" para deixar claro que é o mecanismo de auto-vínculo, não uma propriedade genérica)

## Relationships

- **Empresa ↔ Colaborador**: N:N. Um Colaborador pode estar vinculado a várias Empresas; uma Empresa tem vários Colaboradores.
- **Empresa → Administrador da Empresa**: 1:N. Cada Empresa pode ter vários Administradores, cada um com login próprio.
- **Colaborador → WorkHour / Project / Task / Invoice**: mesma relação de posse que existe hoje entre User e esses registros — privados ao Colaborador, não visíveis a outros Colaboradores da mesma Empresa nem entre Empresas diferentes.
