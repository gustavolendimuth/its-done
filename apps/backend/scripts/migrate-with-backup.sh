#!/bin/sh
set -e

echo "🚀 Starting migration process with automatic backup..."

# Verificar se DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set"
  exit 1
fi

# Extrair informações do DATABASE_URL
# Formato: postgresql://user:password@host:port/database
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Configurar PGPASSWORD para autenticação automática
export PGPASSWORD=$DB_PASSWORD

# Criar diretório de backups se não existir
BACKUP_DIR="/app/data/backups"
mkdir -p $BACKUP_DIR

# Nome do arquivo de backup com timestamp
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"

echo "📦 Creating database backup..."
echo "   Database: $DB_NAME"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Backup file: $BACKUP_FILE"

# Criar backup usando pg_dump
if command -v pg_dump > /dev/null 2>&1; then
  pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F c -b -v -f $BACKUP_FILE 2>&1 || {
    echo "⚠️  Warning: pg_dump failed, trying plain SQL format..."
    pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_FILE 2>&1 || {
      echo "⚠️  Warning: Backup failed but continuing with migration..."
      echo "   You can still rollback using Prisma migrations if needed"
    }
  }

  if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup created successfully: $BACKUP_FILE ($BACKUP_SIZE)"
  fi
else
  echo "⚠️  Warning: pg_dump not found, skipping backup"
  echo "   Install postgresql-client for automatic backups"
fi

# Limpar backups antigos (manter últimos 5)
echo "🧹 Cleaning old backups (keeping last 5)..."
ls -t $BACKUP_DIR/backup_*.sql 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true

# Executar migrações
echo "🔄 Running Prisma migrations..."
pnpm prisma migrate deploy

echo "✅ Migration completed successfully!"

# Limpar variável de senha
unset PGPASSWORD
