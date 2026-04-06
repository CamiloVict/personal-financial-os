-- Amortización mensual opcional (cuota fija) + idempotencia por mes calendario (UTC)
ALTER TABLE "Debt" ADD COLUMN "autoApplyMonthlyPayment" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Debt" ADD COLUMN "lastAutoPaymentMonth" VARCHAR(7);
