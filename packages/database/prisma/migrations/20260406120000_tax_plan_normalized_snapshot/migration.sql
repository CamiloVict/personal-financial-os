-- Persistir snapshot de normalización fiscal junto al plan generado.

-- AlterTable
ALTER TABLE "TaxPlan" ADD COLUMN "normalizedSnapshot" JSONB;
