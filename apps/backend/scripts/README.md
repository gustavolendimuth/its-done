# Scripts de Migração e Backup

## 📋 Scripts Disponíveis

1. **migrate-with-backup.sh** - Migração com backup automático (usado no deploy)
2. **restore-backup.sh** - Restaurar backup específico
3. **download-backups.sh** - Baixar backups do Railway para máquina local

---

## 1. migrate-with-backup.sh

Script que executa migrations do Prisma com backup automático do banco de dados.

### O que faz:

1. ✅ Verifica se `DATABASE_URL` está configurada
2. 💾 Cria backup automático do banco antes da migração
3. 🔄 Executa `prisma migrate deploy`
4. 🧹 Mantém apenas os últimos 5 backups (remove os mais antigos)

### Backups

- **Localização**: `/app/data/backups/` (Railway Volume)
- **Formato**: `backup_YYYYMMDD_HHMMSS.sql`
- **Retenção**: Últimos 5 backups
- **Tipo**: PostgreSQL custom format (`.sql`)

### Como restaurar um backup

#### No Railway (via CLI):

```bash
# 1. Listar backups disponíveis
railway run --service backend ls -lh /app/data/backups/

# 2. Restaurar um backup específico
railway run --service backend sh -c "pg_restore -h HOST -p PORT -U USER -d DATABASE --clean --if-exists /app/data/backups/backup_YYYYMMDD_HHMMSS.sql"
```

#### Localmente:

```bash
# Baixar backup do Railway
railway run --service backend cat /app/data/backups/backup_YYYYMMDD_HHMMSS.sql > backup_local.sql

# Restaurar no banco local
pg_restore -h localhost -p 5432 -U postgres -d its_done --clean --if-exists backup_local.sql
```

### Rollback de migração

Se a migração falhar, você pode fazer rollback usando Prisma:

```bash
# Via Railway CLI
railway run --service backend pnpm prisma migrate resolve --rolled-back MIGRATION_NAME
```

### Logs

O script mostra logs detalhados durante a execução:
- 📦 Criando backup
- ✅ Backup criado com sucesso (tamanho)
- 🧹 Limpando backups antigos
- 🔄 Executando migrações
- ✅ Migração concluída

### Troubleshooting

**Backup falha mas migração continua:**
- Script mostra warning mas não interrompe o deploy
- Você ainda pode fazer rollback usando histórico de migrations do Prisma

**Sem espaço no volume:**
- Aumente o tamanho do Railway Volume
- Ou reduza a retenção de backups no script (linha com `tail -n +6`)

**pg_dump não encontrado:**
- Verifique se `postgresql-client` está no Dockerfile
- O script mostra warning mas continua sem backup

---

## 2. restore-backup.sh

Script para restaurar um backup específico do banco de dados.

### Uso:

```bash
# No Railway
railway run --service backend /app/scripts/restore-backup.sh /app/data/backups/backup_YYYYMMDD_HHMMSS.sql

# Listar backups disponíveis
railway run --service backend ls -lh /app/data/backups/
```

### O que faz:

1. ✅ Verifica se o arquivo de backup existe
2. ⚠️ Aviso de 5 segundos antes de restaurar (Ctrl+C para cancelar)
3. 🔄 Restaura o backup usando `pg_restore` ou `psql`
4. 🔄 Executa `prisma migrate deploy` para garantir schema atualizado
5. ✅ Confirmação de sucesso

### Segurança:

- Mostra preview antes de restaurar
- Delay de 5 segundos para cancelar
- Tenta múltiplos formatos (custom e plain SQL)

---

## 3. download-backups.sh

Script para baixar backups do Railway para sua máquina local.

### Uso:

```bash
# Baixar todos os backups
./scripts/download-backups.sh

# Baixar apenas os últimos 3 backups
./scripts/download-backups.sh 3
```

### O que faz:

1. ✅ Verifica se Railway CLI está instalado
2. 📋 Lista backups disponíveis no Railway
3. 📥 Baixa backups para diretório `./backups` local
4. 📊 Mostra progresso e tamanho dos arquivos
5. 💡 Fornece comando para restaurar localmente

### Pré-requisitos:

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Fazer login
railway login

# Conectar ao projeto
railway link
```

### Exemplo de saída:

```
📥 Downloading backups from Railway...
======================================
📁 Local backup directory: ./backups

📋 Available backups on Railway:
backup_20250310_143022.sql
backup_20250310_120015.sql
...

📊 Total backups found: 5
⬇️  Downloading last 3 backup(s)...

📦 Downloading: backup_20250310_143022.sql
   ✅ Downloaded: ./backups/backup_20250310_143022.sql (2.5M)
...

✅ Download completed!
   Location: ./backups
   Files downloaded: 3
```
