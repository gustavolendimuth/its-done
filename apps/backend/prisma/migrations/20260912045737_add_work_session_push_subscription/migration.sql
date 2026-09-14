-- CreateEnum
CREATE TYPE "WorkSessionStatus" AS ENUM ('RUNNING', 'PAUSED', 'STOPPING', 'ENDED', 'DISCARDED');

-- CreateTable
CREATE TABLE "WorkSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "WorkSessionStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "currentSegmentStartedAt" TIMESTAMP(3),
    "accumulatedSeconds" INTEGER NOT NULL DEFAULT 0,
    "lastPromptAt" TIMESTAMP(3),
    "lastConfirmedAt" TIMESTAMP(3),
    "promptNonce" TEXT,
    "clientId" TEXT,
    "projectId" TEXT,
    "description" TEXT,
    "hours" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkSessionSyncedEvent" (
    "eventId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkSessionSyncedEvent_pkey" PRIMARY KEY ("eventId")
);

-- CreateIndex
CREATE INDEX "WorkSession_userId_status_idx" ON "WorkSession"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex (partial unique index: at most one active session per user)
CREATE UNIQUE INDEX "WorkSession_one_active_per_user"
ON "WorkSession" ("userId")
WHERE status IN ('RUNNING', 'PAUSED', 'STOPPING');

-- AddForeignKey
ALTER TABLE "WorkSession" ADD CONSTRAINT "WorkSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
