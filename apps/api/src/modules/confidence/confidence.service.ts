import { Injectable } from '@nestjs/common';
import {
  buildFinancialConfidence,
  type FinancialConfidence,
} from '@personal-finance-os/explanation';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class ConfidenceService {
  constructor(private readonly prisma: PrismaService) {}

  /** Proyección fiscal: perfil, ingresos/gastos Cashflow, clasificaciones. */
  async evaluateTax(userId: string): Promise<FinancialConfidence> {
    let score = 1;
    const reasons: string[] = [];

    const profile = await this.prisma.taxProfile.findFirst({
      where: { userId },
      orderBy: [{ taxYear: 'desc' }, { updatedAt: 'desc' }],
    });

    if (!profile) {
      score -= 0.35;
      reasons.push('No hay perfil fiscal guardado.');
    }

    const incomeStreams = await this.prisma.cashflowStream.findMany({
      where: { userId, flowType: 'INCOME', isActive: true },
    });
    const expenseStreams = await this.prisma.cashflowStream.findMany({
      where: { userId, flowType: 'EXPENSE', isActive: true },
    });

    if (incomeStreams.length === 0) {
      score -= 0.38;
      reasons.push('No hay ingresos activos registrados en Cashflow.');
    }

    if (expenseStreams.length === 0) {
      score -= 0.12;
      reasons.push('No hay gastos en Cashflow; el contexto no refleja tu estructura de gastos.');
    }

    if (profile) {
      const classifications = await this.prisma.taxIncomeClassification.findMany({
        where: { profileId: profile.id },
      });

      let low = 0;
      let med = 0;
      for (const c of classifications) {
        if (c.confidenceLevel === 'LOW') low += 1;
        else if (c.confidenceLevel === 'MEDIUM') med += 1;
      }
      if (low > 0) {
        score -= Math.min(0.28, low * 0.12);
        reasons.push(
          `${low} ingreso(s) con clasificación de confianza baja; conviene revisar contrato y fuente.`,
        );
      }
      if (med > 0) {
        score -= Math.min(0.14, med * 0.05);
        reasons.push(`${med} ingreso(s) con clasificación de confianza media.`);
      }

      if (profile.hasForeignIncome) {
        const anyForeignTax = classifications.some(
          (c) => Number(c.foreignTaxPaid) > 0,
        );
        const hasNonCopIncome = incomeStreams.some((s) => s.currency !== 'COP');
        if (!anyForeignTax && hasNonCopIncome) {
          score -= 0.1;
          reasons.push(
            'Ingreso en moneda extranjera sin impuesto en el exterior registrado en clasificaciones.',
          );
        }
      }

      const anyBenefit =
        profile.hasAFC ||
        profile.hasVoluntaryPension ||
        profile.hasHousingInterest ||
        profile.hasPrepaidMedicine ||
        profile.hasDependents;
      if (anyBenefit) {
        score -= 0.05;
        reasons.push(
          'Beneficios fiscales activos en perfil: el motor asume elegibilidad; valida con soportes reales.',
        );
      }
    }

    if (reasons.length === 0) {
      reasons.push(
        'Datos de ingreso y perfil suficientes para una proyección orientativa.',
      );
    }

    return buildFinancialConfidence(score, reasons, 'tax');
  }

  /** Deudas con saldo: campos completos y vínculos coherentes. */
  async evaluateDebts(userId: string): Promise<FinancialConfidence> {
    let score = 1;
    const reasons: string[] = [];

    const debts = await this.prisma.debt.findMany({
      where: { userId, remainingAmount: { gt: 0 } },
    });

    if (debts.length === 0) {
      return buildFinancialConfidence(
        0.92,
        [
          'No hay pasivos con saldo registrados; el análisis de deuda refleja ausencia de deuda en la app.',
        ],
        'debts',
      );
    }

    for (const d of debts) {
      const name = d.name || 'Deuda';
      if (d.interestRate == null || Number(d.interestRate) <= 0) {
        score -= 0.07;
        reasons.push(`"${name}": falta tasa de interés o es cero (estimación débil).`);
      }
      if (d.monthlyPayment == null || Number(d.monthlyPayment) <= 0) {
        score -= 0.05;
        reasons.push(`"${name}": sin cuota mensual estimada.`);
      }
      if (d.debtKind === 'MORTGAGE' && !d.linkedPositionId) {
        score -= 0.09;
        reasons.push(
          `Hipoteca "${name}" sin activo vinculado en portafolio (apalancamiento menos preciso).`,
        );
      }
    }

    if (reasons.length === 0) {
      reasons.push('Deudas con datos suficientes para el modelo de apalancamiento.');
    }

    return buildFinancialConfidence(score, reasons, 'debts');
  }

  /** Portafolio: valoraciones y tipos con valoración manual. */
  async evaluateInvestments(userId: string): Promise<FinancialConfidence> {
    let score = 1;
    const reasons: string[] = [];

    const positions = await this.prisma.investmentPosition.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { type: true },
    });

    if (positions.length === 0) {
      return buildFinancialConfidence(
        0.52,
        ['No hay posiciones activas en portafolio.'],
        'investments',
      );
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    for (const p of positions) {
      if (p.type?.hasManualValuation) {
        const recent = await this.prisma.investmentEvent.count({
          where: {
            investmentId: p.id,
            date: { gte: oneYearAgo },
            type: {
              in: [
                'VALUATION_INCREASE',
                'VALUATION_DECREASE',
                'MANUAL_ADJUSTMENT',
              ],
            },
          },
        });
        if (recent === 0) {
          score -= 0.08;
          reasons.push(
            `"${p.name}": tipo con valoración manual sin ajuste reciente en 12 meses.`,
          );
        }
      }

      const init = Number(p.initialCapital);
      const cur = Number(p.currentEstimatedValue);
      if (Math.abs(cur - init) < 1e-6 && p.startDate < oneYearAgo) {
        score -= 0.06;
        reasons.push(
          `"${p.name}": valor actual igual al capital inicial desde hace más de un año (posible desactualización).`,
        );
      }
    }

    if (reasons.length === 0) {
      reasons.push('Portafolio con datos razonables para métricas de patrimonio.');
    }

    return buildFinancialConfidence(score, reasons, 'investments');
  }

  /** Distribución ingresos/gastos (analytics cashflow). */
  async evaluateCashflow(userId: string): Promise<FinancialConfidence> {
    let score = 1;
    const reasons: string[] = [];

    const streams = await this.prisma.cashflowStream.findMany({
      where: { userId, isActive: true },
      include: { category: true },
    });

    const income = streams.filter((s) => s.flowType === 'INCOME');
    const expense = streams.filter((s) => s.flowType === 'EXPENSE');

    if (income.length === 0) {
      score -= 0.35;
      reasons.push('Sin ingresos activos en Cashflow.');
    }
    if (expense.length === 0) {
      score -= 0.18;
      reasons.push('Sin gastos activos en Cashflow.');
    }

    const genericExpense = expense.filter((s) => {
      const n = (s.category?.name || '').toLowerCase();
      return n === 'otros' || n === 'other' || n === '';
    });
    if (genericExpense.length > 0 && expense.length > 2) {
      score -= 0.06;
      reasons.push('Parte de los gastos está en categorías genéricas; refinar mejora el análisis.');
    }

    if (reasons.length === 0) {
      reasons.push('Flujos de ingreso y gasto registrados para la distribución mostrada.');
    }

    return buildFinancialConfidence(score, reasons, 'cashflow');
  }

  /** Apalancamiento: combina calidad de deudas y de activos vinculados. */
  async evaluateLeverageContext(userId: string): Promise<FinancialConfidence> {
    const [d, inv] = await Promise.all([
      this.evaluateDebts(userId),
      this.evaluateInvestments(userId),
    ]);
    const score = d.confidenceScore * 0.55 + inv.confidenceScore * 0.45;
    const reasons = [
      `Deudas (${d.level}): ${d.reasons[0] ?? '—'}`,
      `Inversiones (${inv.level}): ${inv.reasons[0] ?? '—'}`,
    ];
    return buildFinancialConfidence(score, reasons, 'composite');
  }

  /** Asignador: promedio de módulos que alimentan recomendaciones. */
  async evaluateAllocator(userId: string): Promise<FinancialConfidence> {
    const [t, d, i] = await Promise.all([
      this.evaluateTax(userId),
      this.evaluateDebts(userId),
      this.evaluateInvestments(userId),
    ]);
    const score = (t.confidenceScore + d.confidenceScore + i.confidenceScore) / 3;
    const reasons = [
      `Fiscal (${t.level}): ${t.reasons[0] ?? '—'}`,
      `Deudas (${d.level}): ${d.reasons[0] ?? '—'}`,
      `Inversiones (${i.level}): ${i.reasons[0] ?? '—'}`,
    ];
    return buildFinancialConfidence(score, reasons, 'allocator');
  }

  /** Simulaciones what-if: solo entradas del formulario. */
  evaluateSimulation(): FinancialConfidence {
    return buildFinancialConfidence(
      0.58,
      [
        'Simulación hipotética con parámetros del formulario.',
        'No se valida contra Cashflow, deudas ni perfil fiscal salvo que el flujo lo indique.',
      ],
      'simulation',
    );
  }
}
