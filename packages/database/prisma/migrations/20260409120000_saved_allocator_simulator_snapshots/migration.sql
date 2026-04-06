-- CreateTable
CREATE TABLE "SavedAllocatorAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "schemaVersion" TEXT NOT NULL DEFAULT '1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedAllocatorAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSimulationRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioType" TEXT NOT NULL,
    "inputs" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "schemaVersion" TEXT NOT NULL DEFAULT '1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedSimulationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedAllocatorAnalysis_userId_idx" ON "SavedAllocatorAnalysis"("userId");

-- CreateIndex
CREATE INDEX "SavedAllocatorAnalysis_expiresAt_idx" ON "SavedAllocatorAnalysis"("expiresAt");

-- CreateIndex
CREATE INDEX "SavedSimulationRun_userId_scenarioType_idx" ON "SavedSimulationRun"("userId", "scenarioType");

-- CreateIndex
CREATE INDEX "SavedSimulationRun_expiresAt_idx" ON "SavedSimulationRun"("expiresAt");

-- AddForeignKey
ALTER TABLE "SavedAllocatorAnalysis" ADD CONSTRAINT "SavedAllocatorAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSimulationRun" ADD CONSTRAINT "SavedSimulationRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
