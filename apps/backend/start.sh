#!/bin/bash

echo "🚀 Starting backend with database setup..."

# Run database migrations
echo "🔄 Running Prisma migrations..."
pnpm prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migration failed, but continuing..."
fi

# Optionally run seed (only if needed)
echo "🌱 Checking if seed is needed..."
if [ "$RAILWAY_ENVIRONMENT" = "production" ]; then
    pnpm prisma db seed 2>/dev/null || echo "ℹ️ Seed skipped (already exists or not needed)"
fi

# Start the application
echo "🚀 Starting NestJS application..."
exec node dist/main.js 