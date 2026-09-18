# Fundir Client em Empresa e adotar modelo multi-tenant com login opcional

**Status**: accepted

O It's Done hoje modela "quem o freelancer fatura" como `Client`: um registro privado, dono de `Project`/`WorkHour`/`Invoice`, sem login e sem noção de outras pessoas trabalhando para o mesmo cliente. Para suportar empresas gerenciando as horas de vários MEIs colaboradores, decidimos fundir `Client` no novo conceito `Empresa` em vez de criar uma entidade paralela: toda referência a "cliente" passa a ser uma Empresa, e o registro é único e compartilhado entre os Colaboradores vinculados a ela (não duplicado por Colaborador, como `Client` era).

Login é opcional e ativado depois: uma Empresa nasce como registro simples (igual ao `Client` de hoje) e só ganha credenciais próprias — com suporte a múltiplos Administradores nomeados — quando alguém a ativa como conta. Isso evita forçar todo "cliente" cadastrado por um Colaborador a virar um tenant completo, mantendo o caso de uso atual (freelancer avulso faturando alguém que nunca vai logar no sistema) funcionando sem fricção.

Vínculo de Colaborador a uma Empresa acontece por Convite Pendente (email específico) ou Domínio Autorizado (qualquer email daquele domínio), ambos resolvidos automaticamente no signup/login — nunca por aprovação manual no MVP. Domínios de provedores públicos de email são bloqueados de virar Domínio Autorizado, e um Domínio Autorizado só passa a valer após confirmação por email corporativo (sem prova via DNS).

Um Colaborador pode estar vinculado a N Empresas. Dados de trabalho (`WorkHour`, `Project`, `Task`, `Invoice`) continuam privados ao Colaborador que os criou — nenhum outro Colaborador da mesma Empresa os enxerga; só a conta da Empresa vê o agregado de todos os Colaboradores vinculados a ela, e no MVP apenas para visualizar/exportar, sem aprovar ou editar horas.

Clients existentes em produção são migrados automaticamente para Empresa (sem Domínio Autorizado nem Colaboradores configurados) na migração de dados. Billing diferenciado por Empresa fica fora de escopo deste esforço.

## Considered Options

- **Empresa como entidade nova e separada de Client**, com Client continuando a existir para quem não precisa de multi-tenant. Rejeitado: duplica o modelo de "quem eu faturo" em duas tabelas paralelas e obriga toda a UI/lógica de faturamento a decidir qual delas usar.
- **Toda Empresa nasce com login desde a criação.** Rejeitado: quebraria o fluxo de hoje, em que o freelancer cadastra um cliente sem nenhuma interação da outra parte.
