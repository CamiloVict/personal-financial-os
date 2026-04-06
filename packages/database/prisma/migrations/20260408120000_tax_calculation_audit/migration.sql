-- CreateTable
CREATE TABLE "TaxCalculationAudit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT,
    "kind" TEXT NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "lawPackageId" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "appliedRuleRefs" JSONB NOT NULL,
    "auditPayload" JSONB NOT NULL,
    "inputHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxCalculationAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaxCalculationAudit_userId_createdAt_idx" ON "TaxCalculationAudit"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "TaxCalculationAudit_profileId_createdAt_idx" ON "TaxCalculationAudit"("profileId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "TaxCalculationAudit_lawPackageId_taxYear_idx" ON "TaxCalculationAudit"("lawPackageId", "taxYear");

-- AddForeignKey
ALTER TABLE "TaxCalculationAudit" ADD CONSTRAINT "TaxCalculationAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCalculationAudit" ADD CONSTRAINT "TaxCalculationAudit_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TaxProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
