UPDATE "Debt"
SET "autoApplyMonthlyPayment" = true
WHERE "monthlyPayment" IS NOT NULL AND "monthlyPayment" > 0;
