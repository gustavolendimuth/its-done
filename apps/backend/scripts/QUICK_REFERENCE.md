# 🚀 Quick Reference - Migrations & Backups

## 📦 Deploy Automático (Railway)

Quando você faz push para o GitHub:

```
1. 🔄 Build do Docker
2. 💾 Backup automático do banco
3. 🔄 Migrations (prisma migrate deploy)
4. 🧹 Limpeza de backups antigos (mantém últimos 5)
5. ✅ Inicia aplicação
```

**Nada precisa ser feito manualmente!** ✨

---

## 🔍 Ver Backups Criados

```bash
# Ver backups no Railway
railway run --service backend ls -lh /app/data/backups/

# Baixar backups para máquina local
cd apps/backend
./scripts/download-backups.sh 3
```

---

## ⚠️ Restaurar Backup (Emergência)

```bash
# 1. Listar backups disponíveis
railway run --service backend ls -lh /app/data/backups/

# 2. Restaurar backup específico
railway run --service backend /app/scripts/restore-backup.sh \
  /app/data/backups/backup_20250310_143022.sql
```

---

## 🔄 Executar Migration Manual

```bash
# Com backup automático (RECOMENDADO)
railway run --service backend /app/scripts/migrate-with-backup.sh

# Sem backup (não recomendado)
railway run --service backend pnpm prisma migrate deploy
```

---

## 📥 Baixar Backups para Local

```bash
# Todos os backups
./scripts/download-backups.sh

# Últimos 3 backups
./scripts/download-backups.sh 3
```

Backups ficam em: `apps/backend/backups/`

---

## 🔄 Restaurar Backup Localmente

```bash
# Se baixou via download-backups.sh
pg_restore -h localhost -U postgres -d its_done \
  --clean --if-exists \
  ./backups/backup_20250310_143022.sql

# Ou com psql (se pg_restore falhar)
psql -h localhost -U postgres -d its_done \
  < ./backups/backup_20250310_143022.sql
```

---

## 🛠️ Criar Nova Migration

```bash
# 1. Editar schema.prisma
cd apps/backend

# 2. Criar migration
pnpm prisma migrate dev --name nome_da_migration

# 3. Commit e push
git add prisma/
git commit -m "feat: add nova tabela X"
git push

# 4. Railway faz deploy automático com backup ✅
```

---

## 📊 Monitorar Deploy

```bash
# Ver logs em tempo real
railway logs --service backend --follow

# Ver se backup foi criado
railway run --service backend ls -lh /app/data/backups/

# Ver status do banco
railway run --service backend pnpm prisma db pull
```

---

## ⚙️ Configuração do Sistema

### Retenção de Backups

Por padrão: **5 backups** (últimos 5 deploys)

Para mudar, edite `migrate-with-backup.sh`:
```bash
# Linha atual (mantém 5):
ls -t $BACKUP_DIR/backup_*.sql | tail -n +6 | xargs rm -f

# Para manter 10:
ls -t $BACKUP_DIR/backup_*.sql | tail -n +11 | xargs rm -f
```

### Local dos Backups

- **Production**: `/app/data/backups/` (Railway Volume)
- **Local**: `apps/backend/backups/` (após download)

### Tamanho Típico

- Banco pequeno: ~500KB - 2MB
- Banco médio: ~2MB - 10MB
- Banco grande: ~10MB - 50MB

---

## 🆘 Troubleshooting

### "No space left on device"

```bash
# Verificar espaço do volume
railway run --service backend df -h /app/data

# Limpar backups antigos manualmente
railway run --service backend rm /app/data/backups/backup_OLD*.sql

# Aumentar tamanho do volume no Railway Dashboard
```

### "Migration failed"

```bash
# 1. Ver logs do erro
railway logs --service backend

# 2. Verificar backups (deve ter criado antes da falha)
railway run --service backend ls -lh /app/data/backups/

# 3. Se necessário, restaurar último backup válido
railway run --service backend /app/scripts/restore-backup.sh \
  /app/data/backups/backup_ANTERIOR.sql
```

### "Backup não foi criado"

- Verifique se `postgresql-client` está instalado no Docker
- Veja logs: `railway logs --service backend`
- Migration continua normalmente, só não cria backup

---

## 📝 Checklist de Segurança

Antes de fazer migration em produção:

- [ ] Testei migration localmente
- [ ] Fiz commit das migrations
- [ ] Verifiquei que há backups recentes (`ls /app/data/backups/`)
- [ ] Tenho acesso ao Railway CLI (para restaurar se necessário)
- [ ] Sei qual é o último backup válido

---

## 🔗 Links Úteis

- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Railway Volumes](https://docs.railway.app/reference/volumes)
- [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [PostgreSQL pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html)
