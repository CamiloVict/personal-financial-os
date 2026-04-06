-- Bitácora de avances / novedades por meta (nota + aporte opcional al saldo).
CREATE TABLE "GoalProgressLog" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "amountDelta" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalProgressLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GoalProgressLog_goalId_createdAt_idx" ON "GoalProgressLog"("goalId", "createdAt" DESC);

ALTER TABLE "GoalProgressLog" ADD CONSTRAINT "GoalProgressLog_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "SavingGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
