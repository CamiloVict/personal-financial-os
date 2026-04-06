-- FX diario (COP por 1 unidad de moneda extranjera) + inflación + preferencias de valuación.

-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN "displayValuationMode" VARCHAR(32) NOT NULL DEFAULT 'NOMINAL_COP';
ALTER TABLE "UserPreference" ADD COLUMN "realTermsBaseMonth" DATE;
ALTER TABLE "UserPreference" ADD COLUMN "valuationAsOfDate" DATE;

-- CreateTable
CREATE TABLE "FxRateDaily" (
    "id" TEXT NOT NULL,
    "asOfDate" DATE NOT NULL,
    "quoteCurrency" VARCHAR(8) NOT NULL,
    "copPerUnit" DECIMAL(24,8) NOT NULL,
    "source" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FxRateDaily_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FxRateDaily_asOfDate_quoteCurrency_key" ON "FxRateDaily"("asOfDate", "quoteCurrency");
CREATE INDEX "FxRateDaily_quoteCurrency_asOfDate_idx" ON "FxRateDaily"("quoteCurrency", "asOfDate");

-- CreateTable
CREATE TABLE "InflationSeries" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "InflationSeries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InflationSeries_code_key" ON "InflationSeries"("code");

-- CreateTable
CREATE TABLE "InflationIndexPoint" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "period" DATE NOT NULL,
    "indexValue" DECIMAL(24,8) NOT NULL,

    CONSTRAINT "InflationIndexPoint_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InflationIndexPoint_seriesId_period_key" ON "InflationIndexPoint"("seriesId", "period");
CREATE INDEX "InflationIndexPoint_seriesId_period_idx" ON "InflationIndexPoint"("seriesId", "period");

ALTER TABLE "InflationIndexPoint" ADD CONSTRAINT "InflationIndexPoint_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "InflationSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
