-- Campos opcionales para mapear cashflow/inversiones al motor fiscal (tax-engine).

-- AlterTable
ALTER TABLE "Category" ADD COLUMN "fiscalExpenseHint" VARCHAR(64);

-- AlterTable
ALTER TABLE "InvestmentTypeDefinition" ADD COLUMN "fiscalAssetTreatment" VARCHAR(64);
