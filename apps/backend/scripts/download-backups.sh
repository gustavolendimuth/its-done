#!/bin/bash
# Script para baixar backups do Railway para máquina local
# Uso: ./download-backups.sh [numero_de_backups]

set -e

# Verificar se railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado!"
    echo "   Instale com: npm install -g @railway/cli"
    exit 1
fi

# Número de backups para baixar (padrão: todos)
NUM_BACKUPS=${1:-0}

echo "📥 Downloading backups from Railway..."
echo "======================================"

# Criar diretório local para backups
LOCAL_BACKUP_DIR="./backups"
mkdir -p "$LOCAL_BACKUP_DIR"

echo "📁 Local backup directory: $LOCAL_BACKUP_DIR"
echo ""

# Listar backups disponíveis no Railway
echo "📋 Available backups on Railway:"
railway run --service backend ls -lh /app/data/backups/ 2>/dev/null || {
    echo "❌ Failed to list backups. Make sure you're linked to the project:"
    echo "   railway link"
    exit 1
}
echo ""

# Obter lista de arquivos de backup
BACKUP_FILES=$(railway run --service backend ls -1 /app/data/backups/backup_*.sql 2>/dev/null | sort -r)

if [ -z "$BACKUP_FILES" ]; then
    echo "⚠️  No backups found on Railway"
    exit 0
fi

# Contar backups disponíveis
TOTAL_BACKUPS=$(echo "$BACKUP_FILES" | wc -l)
echo "📊 Total backups found: $TOTAL_BACKUPS"

# Determinar quantos backups baixar
if [ "$NUM_BACKUPS" -eq 0 ] || [ "$NUM_BACKUPS" -gt "$TOTAL_BACKUPS" ]; then
    DOWNLOAD_COUNT=$TOTAL_BACKUPS
else
    DOWNLOAD_COUNT=$NUM_BACKUPS
fi

echo "⬇️  Downloading last $DOWNLOAD_COUNT backup(s)..."
echo ""

# Baixar backups
COUNT=0
for BACKUP_FILE in $BACKUP_FILES; do
    if [ "$COUNT" -ge "$DOWNLOAD_COUNT" ]; then
        break
    fi

    BASENAME=$(basename "$BACKUP_FILE")
    LOCAL_FILE="$LOCAL_BACKUP_DIR/$BASENAME"

    echo "📦 Downloading: $BASENAME"
    railway run --service backend cat "$BACKUP_FILE" > "$LOCAL_FILE"

    # Mostrar tamanho do arquivo baixado
    FILE_SIZE=$(du -h "$LOCAL_FILE" | cut -f1)
    echo "   ✅ Downloaded: $LOCAL_FILE ($FILE_SIZE)"
    echo ""

    COUNT=$((COUNT + 1))
done

echo "======================================"
echo "✅ Download completed!"
echo "   Location: $LOCAL_BACKUP_DIR"
echo "   Files downloaded: $COUNT"
echo ""
echo "💡 To restore locally:"
echo "   pg_restore -h localhost -U postgres -d its_done --clean --if-exists $LOCAL_BACKUP_DIR/backup_YYYYMMDD_HHMMSS.sql"
