import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export type DisplayValuationMode = 'NOMINAL_COP' | 'NOMINAL_USD' | 'REAL_COP';

export const DISPLAY_VALUATION_MODES: DisplayValuationMode[] = [
  'NOMINAL_COP',
  'NOMINAL_USD',
  'REAL_COP',
];

const COP = 'COP';
const USD = 'USD';
const CO_IPC_CODE = 'CO_IPC';

function normCcy(c: string): string {
  return String(c || '')
    .trim()
    .toUpperCase();
}

/** Primer día del mes UTC que contiene `d`. */
export function utcMonthStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function parseIsoDate(s: string): Date {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(`Fecha inválida: ${s}`);
  }
  return d;
}

@Injectable()
export class ConversionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Convierte montos nominales usando FX histórico: última cotización con asOfDate <= `date`.
   * Convención: `copPerUnit` = COP por 1 unidad de `quoteCurrency`.
   */
  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date: Date,
  ): Promise<{ amount: number; warnings: string[] }> {
    if (!Number.isFinite(amount)) {
      throw new BadRequestException('amount debe ser numérico');
    }
    const from = normCcy(fromCurrency);
    const to = normCcy(toCurrency);
    if (from === to) {
      return { amount, warnings: [] };
    }
    const warnings: string[] = [];
    const cop = await this.toCopNominal(amount, from, date, warnings);
    const out = await this.fromCopNominal(cop, to, date, warnings);
    return { amount: out, warnings };
  }

  private async toCopNominal(
    amount: number,
    from: string,
    date: Date,
    warnings: string[],
  ): Promise<number> {
    if (from === COP) return amount;
    const r = await this.getCopPerUnit(from, date);
    if (r == null) {
      warnings.push(`Sin FX ${from}/COP en o antes de ${date.toISOString().slice(0, 10)}; se usa 1 (equivale a COP).`);
      return amount;
    }
    return amount * r;
  }

  private async fromCopNominal(
    amountCop: number,
    to: string,
    date: Date,
    warnings: string[],
  ): Promise<number> {
    if (to === COP) return amountCop;
    const r = await this.getCopPerUnit(to, date);
    if (r == null) {
      warnings.push(`Sin FX ${to}/COP en o antes de ${date.toISOString().slice(0, 10)}; se devuelve COP.`);
      return amountCop;
    }
    return amountCop / r;
  }

  async getCopPerUnit(quoteCurrency: string, date: Date): Promise<number | null> {
    const c = normCcy(quoteCurrency);
    if (c === COP) return 1;
    const row = await this.prisma.fxRateDaily.findFirst({
      where: { quoteCurrency: c, asOfDate: { lte: date } },
      orderBy: { asOfDate: 'desc' },
    });
    if (!row) return null;
    return Number(row.copPerUnit);
  }

  async getInflationIndexAtOrBefore(
    seriesCode: string,
    monthStart: Date,
  ): Promise<{ indexValue: number; period: Date } | null> {
    const series = await this.prisma.inflationSeries.findUnique({
      where: { code: seriesCode },
    });
    if (!series) return null;
    const row = await this.prisma.inflationIndexPoint.findFirst({
      where: { seriesId: series.id, period: { lte: monthStart } },
      orderBy: { period: 'desc' },
    });
    if (!row) return null;
    return { indexValue: Number(row.indexValue), period: row.period };
  }

  /**
   * Presenta líneas de forma coherente:
   * - NOMINAL_*: FX única en `asOfDate` (snapshot comparable).
   * - REAL_COP: FX en `valueDate` de cada línea + deflactor IPC CO entre `valueDate` y `realTermsBaseMonth`.
   */
  async presentLines(params: {
    display: DisplayValuationMode;
    asOfDate: Date;
    realTermsBaseMonth?: Date;
    lines: Array<{
      id: string;
      amount: number;
      currency: string;
      valueDate: Date;
    }>;
  }): Promise<
    Array<{
      id: string;
      originalAmount: number;
      originalCurrency: string;
      presentedAmount: number;
      presentedCurrency: string;
      fxAsOfUsed: string;
      inflationFactor?: number;
      warnings: string[];
    }>
  > {
    const { display, asOfDate, realTermsBaseMonth, lines } = params;
    if (!DISPLAY_VALUATION_MODES.includes(display)) {
      throw new BadRequestException(`display inválido: ${display}`);
    }
    if (display === 'REAL_COP' && !realTermsBaseMonth) {
      throw new BadRequestException('realTermsBaseMonth es obligatorio para REAL_COP');
    }

    const baseMonth = realTermsBaseMonth
      ? utcMonthStart(realTermsBaseMonth)
      : null;

    const out: Array<{
      id: string;
      originalAmount: number;
      originalCurrency: string;
      presentedAmount: number;
      presentedCurrency: string;
      fxAsOfUsed: string;
      inflationFactor?: number;
      warnings: string[];
    }> = [];

    for (const line of lines) {
      const warnings: string[] = [];
      const cur = normCcy(line.currency);
      let presented: number;
      let inflationFactor: number | undefined;
      let fxLabel: string;

      if (display === 'NOMINAL_COP') {
        const r = await this.convert(line.amount, cur, COP, asOfDate);
        presented = r.amount;
        warnings.push(...r.warnings);
        fxLabel = asOfDate.toISOString().slice(0, 10);
      } else if (display === 'NOMINAL_USD') {
        const r = await this.convert(line.amount, cur, USD, asOfDate);
        presented = r.amount;
        warnings.push(...r.warnings);
        fxLabel = asOfDate.toISOString().slice(0, 10);
      } else {
        const vd = line.valueDate;
        const nominalCop = await this.convert(line.amount, cur, COP, vd);
        warnings.push(...nominalCop.warnings);
        const vMonth = utcMonthStart(vd);
        const baseIdx = await this.getInflationIndexAtOrBefore(
          CO_IPC_CODE,
          baseMonth!,
        );
        const valIdx = await this.getInflationIndexAtOrBefore(
          CO_IPC_CODE,
          vMonth,
        );
        if (!baseIdx || !valIdx || valIdx.indexValue === 0) {
          warnings.push(
            'IPC incompleto: se devuelve nominal COP a fecha económica sin ajuste real.',
          );
          presented = nominalCop.amount;
          inflationFactor = 1;
        } else {
          inflationFactor = baseIdx.indexValue / valIdx.indexValue;
          presented = nominalCop.amount * inflationFactor;
        }
        fxLabel = vd.toISOString().slice(0, 10);
      }

      out.push({
        id: line.id,
        originalAmount: line.amount,
        originalCurrency: cur,
        presentedAmount: presented,
        presentedCurrency: display === 'NOMINAL_USD' ? USD : COP,
        fxAsOfUsed: fxLabel,
        inflationFactor,
        warnings,
      });
    }

    return out;
  }

  async upsertFxRate(input: {
    asOfDate: string;
    quoteCurrency: string;
    copPerUnit: number;
    source?: string;
  }) {
    const d = parseIsoDate(input.asOfDate);
    const c = normCcy(input.quoteCurrency);
    if (c === COP) {
      throw new BadRequestException('No se almacena FX para COP (pivote).');
    }
    return this.prisma.fxRateDaily.upsert({
      where: {
        asOfDate_quoteCurrency: { asOfDate: d, quoteCurrency: c },
      },
      create: {
        asOfDate: d,
        quoteCurrency: c,
        copPerUnit: input.copPerUnit,
        source: input.source ?? 'manual',
      },
      update: {
        copPerUnit: input.copPerUnit,
        source: input.source ?? 'manual',
      },
    });
  }

  async listFxRates(quoteCurrency: string, from?: string, to?: string) {
    const c = normCcy(quoteCurrency);
    const fromD = from ? parseIsoDate(from) : undefined;
    const toD = to ? parseIsoDate(to) : undefined;
    return this.prisma.fxRateDaily.findMany({
      where: {
        quoteCurrency: c,
        ...(fromD || toD
          ? {
              asOfDate: {
                ...(fromD ? { gte: fromD } : {}),
                ...(toD ? { lte: toD } : {}),
              },
            }
          : {}),
      },
      orderBy: { asOfDate: 'asc' },
    });
  }

  async listInflationSeries() {
    return this.prisma.inflationSeries.findMany({
      include: {
        points: { orderBy: { period: 'asc' }, take: 3 },
      },
    });
  }

  /** Devuelve última cotización conocida para la moneda (para UI). */
  async lastFx(quoteCurrency: string) {
    const c = normCcy(quoteCurrency);
    if (c === COP) {
      return { quoteCurrency: c, copPerUnit: 1, asOfDate: null };
    }
    const row = await this.prisma.fxRateDaily.findFirst({
      where: { quoteCurrency: c },
      orderBy: { asOfDate: 'desc' },
    });
    if (!row) throw new NotFoundException(`Sin FX para ${c}`);
    return {
      quoteCurrency: c,
      copPerUnit: Number(row.copPerUnit),
      asOfDate: row.asOfDate,
    };
  }
}
