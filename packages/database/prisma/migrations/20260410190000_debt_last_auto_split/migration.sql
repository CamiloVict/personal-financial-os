-- Desglose de la última cuota automática (interés vs capital), para transparencia en UI.
ALTER TABLE "Debt" ADD COLUMN "lastAutoInterestPortion" DECIMAL(65,30);
ALTER TABLE "Debt" ADD COLUMN "lastAutoPrincipalPortion" DECIMAL(65,30);
