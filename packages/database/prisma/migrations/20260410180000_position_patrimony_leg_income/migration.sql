CREATE TYPE "PatrimonyLeg" AS ENUM ('ASSET', 'LIABILITY');

ALTER TABLE "InvestmentPosition" ADD COLUMN "patrimonyLeg" "PatrimonyLeg" NOT NULL DEFAULT 'ASSET';
ALTER TABLE "InvestmentPosition" ADD COLUMN "expectedPeriodicIncomeAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;
