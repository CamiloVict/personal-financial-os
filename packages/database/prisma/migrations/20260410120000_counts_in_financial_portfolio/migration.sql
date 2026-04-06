-- Categorías "solo patrimonio de uso" (ej. vehículo) no entran en totales de portafolio financiero.
ALTER TABLE "InvestmentTypeDefinition" ADD COLUMN "countsInFinancialPortfolio" BOOLEAN NOT NULL DEFAULT true;
