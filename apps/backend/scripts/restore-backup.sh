#!/bin/sh
set -e

echo "🔄 Database Restore Script"
echo "=========================="

# Verificar se DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set"
  exit 1
fi

# Verificar se foi passado o arquivo de backup
if [ -z "$1" ]; then
  echo "❌ ERROR: Backup file not specified"
  echo ""
  echo "Usage: ./restore-backup.sh <backup_file>"
  echo ""
  echo "Available backups:"
  ls -lh /app/data/backups/backup_*.sql 2>/dev/null || echo "  No backups found"
  exit 1
fi

BACKUP_FILE="$1"

# Verificar se o arquivo existe
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Extrair informações do DATABASE_URL
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

export PGPASSWORD=$DB_PASSWORD

echo "⚠️  WARNING: This will restore the database to the state of:"
echo "   $BACKUP_FILE"
echo ""
echo "   Database: $DB_NAME"
echo "   Host: $DB_HOST:$DB_PORT"
echo ""
echo "⏳ Starting restore in 5 seconds... (Press Ctrl+C to cancel)"
sleep 5

echo "🔄 Restoring database..."

# Tentar restaurar usando pg_restore (formato custom)
if pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME --clean --if-exists $BACKUP_FILE 2>&1; then
  echo "✅ Database restored successfully!"
else
  echo "⚠️  pg_restore failed, trying psql (plain SQL format)..."
  if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < $BACKUP_FILE 2>&1; then
    echo "✅ Database restored successfully!"
  else
    echo "❌ Restore failed!"
    exit 1
  fi
fi

# Executar migrations para garantir que o schema está atualizado
echo "🔄 Running migrations to ensure schema is up to date..."
pnpm prisma migrate deploy

echo "✅ Restore completed successfully!"

unset PGPASSWORD
