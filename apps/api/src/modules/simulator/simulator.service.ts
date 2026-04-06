import { Injectable } from '@nestjs/common';
import { buildSimulatorExplanation } from '../../common/explanation/simulator-explanation';
import { ConfidenceService } from '../confidence/confidence.service';
import {
  SimulationResult,
  SimulationYearData,
  SimulatePropertyPurchaseInput,
  SimulateDebtVsInvestInput,
  SimulateTaxAdvantagedInput,
  SimulateBusinessInput,
  SimulateCustomInput,
} from './simulator.contracts';

@Injectable()
export class SimulatorService {
  constructor(private readonly confidenceService: ConfidenceService) {}

  // 1. Property Purchase vs Market
  async simulatePropertyPurchase(userId: string, input: SimulatePropertyPurchaseInput): Promise<SimulationResult> {
    const loanAmount = input.propertyValue - input.downPayment;
    const r = (input.interestRateAnnual / 100) / 12;
    const n = input.loanTermYears * 12;
    
    let monthlyMortgagePayment = 0;
    if (r > 0) {
      monthlyMortgagePayment = loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    } else {
      monthlyMortgagePayment = loanAmount / n;
    }
    
    const annualMortgagePayment = monthlyMortgagePayment * 12;
    const initialMonthlyCashflowImpact = input.expectedMonthlyRent - monthlyMortgagePayment - ((input.propertyValue * (input.maintenanceAnnualPercentage / 100)) / 12);
    
    const years: SimulationYearData[] = [];
    let currentLoanBalance = loanAmount;
    let currentPropertyValue = input.propertyValue;
    let currentBaselineNetWorth = input.downPayment;
    let cumulativeCashflow = 0;
    let totalTaxShield = 0;
    const marginalTaxRate = 0.35; 

    for (let year = 1; year <= input.loanTermYears; year++) {
      let interestPaid = 0;
      for (let m = 1; m <= 12; m++) {
        const monthlyInterest = currentLoanBalance * r;
        const monthlyPrincipal = monthlyMortgagePayment - monthlyInterest;
        interestPaid += monthlyInterest;
        currentLoanBalance -= monthlyPrincipal;
        if (currentLoanBalance < 0) currentLoanBalance = 0;
      }
      
      currentPropertyValue *= (1 + (input.expectedAnnualAppreciation / 100));
      const annualRent = input.expectedMonthlyRent * 12;
      const annualMaintenance = currentPropertyValue * (input.maintenanceAnnualPercentage / 100);
      const netCashflow = annualRent - annualMortgagePayment - annualMaintenance;
      cumulativeCashflow += netCashflow;
      
      const UVT_VALUE_2026 = 50000;
      const MAX_INTEREST_DEDUCTION = 1200 * UVT_VALUE_2026;
      const deductibleInterest = Math.min(interestPaid, MAX_INTEREST_DEDUCTION);
      const taxShieldValue = deductibleInterest * marginalTaxRate;
      totalTaxShield += taxShieldValue;

      currentBaselineNetWorth *= (1 + (input.baselineInvestmentReturn / 100));
      const propertyNetWorth = currentPropertyValue - currentLoanBalance + cumulativeCashflow + totalTaxShield;
      
      years.push({
        year,
        baselineNetWorth: Math.round(currentBaselineNetWorth),
        scenarioNetWorth: Math.round(propertyNetWorth)
      });
    }

    const finalYear = years[years.length - 1];
    let cashflowInsight = initialMonthlyCashflowImpact < 0 
      ? `Tu flujo de caja se reducirá en $${Math.abs(Math.round(initialMonthlyCashflowImpact)).toLocaleString()} mensual.`
      : `Generarás un flujo de caja positivo de $${Math.round(initialMonthlyCashflowImpact).toLocaleString()} desde el mes 1.`;
    
    const avgTaxShield = totalTaxShield / input.loanTermYears;
    const taxInsight = `Las deducciones por intereses bajarán tus impuestos en -$${Math.round(avgTaxShield).toLocaleString()}/año en promedio.`;
    const roiDiff = ((finalYear.scenarioNetWorth - finalYear.baselineNetWorth) / finalYear.baselineNetWorth) * 100;
    
    let netWorthInsight = roiDiff > 0 
      ? `A pesar de la iliquidez, tu patrimonio superará a tu inversión base en un ${roiDiff.toFixed(1)}%.`
      : `La inversión base supera al apartamento en un ${Math.abs(roiDiff).toFixed(1)}% debido al alto costo de la deuda.`;

    const explanation = buildSimulatorExplanation({
      domain: 'simulator.property_purchase',
      title: 'Vivienda en arriendo vs cartera alternativa',
      summary:
        'Proyección año a año: cuota hipotecaria, valor del inmueble, arriendo, mantenimiento y escudo por intereses.',
      paramLabels: [
        { label: 'Valor propiedad', value: input.propertyValue },
        { label: 'Cuota inicial', value: input.downPayment },
        { label: 'Tasa préstamo % EA', value: input.interestRateAnnual },
        { label: 'Plazo años', value: input.loanTermYears },
        { label: 'Arriendo mensual esperado', value: input.expectedMonthlyRent },
        { label: 'Apreciación anual %', value: input.expectedAnnualAppreciation },
        { label: 'Mantenimiento % anual del valor', value: input.maintenanceAnnualPercentage },
        { label: 'Retorno alternativo % EA', value: input.baselineInvestmentReturn },
      ],
      steps: [
        {
          label: 'Cuota hipotecaria (francés mensual)',
          description: 'Interés y capital sobre saldo; tasa nominal anual / 12.',
          ruleRef: 'SIM-PMT',
        },
        {
          label: 'Escudo fiscal intereses',
          description:
            'Intereses deducibles limitados a 1200 × UVT fija interna del simulador (50.000 COP en código).',
          ruleRef: 'SIM-TAX-SHIELD',
        },
        {
          label: 'Patrimonio escenario',
          description:
            'Valor vivienda − saldo préstamo + cashflows acumulados + escudo fiscal acumulado.',
        },
        {
          label: 'Línea base',
          description: `Solo inversión del enganche al ${input.baselineInvestmentReturn}% compuesto anual.`,
        },
      ],
      assumptions: [
        'Tasa marginal 35% fija para valorar escudo fiscal.',
        'UVT del simulador (50.000) puede diferir del motor fiscal principal (48.000).',
        'Sin vacantes, costos de transacción ni seguros explícitos.',
      ],
    });

    return {
      userId,
      primaryInsight: netWorthInsight,
      secondaryInsight: cashflowInsight,
      tertiaryInsight: taxInsight,
      years,
      finalScenarioNetWorth: finalYear.scenarioNetWorth,
      finalBaselineNetWorth: finalYear.baselineNetWorth,
      roiDifference: roiDiff,
      metrics: [
        { label: 'Impacto Mensual', value: `$${Math.round(initialMonthlyCashflowImpact).toLocaleString()}`, color: initialMonthlyCashflowImpact >= 0 ? 'emerald' : 'rose' },
        { label: 'Escudo Fiscal Promedio', value: `+$${Math.round(avgTaxShield).toLocaleString()}/año`, color: 'indigo' },
        { label: 'Veredicto Patrimonial', value: `${roiDiff > 0 ? '+' : ''}${roiDiff.toFixed(1)}% vs Base`, color: roiDiff >= 0 ? 'amber' : 'slate' }
      ],
      explanation,
      confidence: this.confidenceService.evaluateSimulation(),
    };
  }

  // 2. Pay Debt vs Invest
  async simulateDebtVsInvest(userId: string, input: SimulateDebtVsInvestInput): Promise<SimulationResult> {
    const years: SimulationYearData[] = [];
    
    // Scenario A: Pay minimum on debt, invest the extra capital
    let debtA = input.debtBalance;
    let portfolioA = 0;
    
    // Scenario B: Put ALL extra capital + minimum to debt, once debt is 0, invest everything
    let debtB = input.debtBalance;
    let portfolioB = 0;

    const rDebt = (input.debtInterestRateAnnual / 100) / 12;
    const rInv = (input.investmentReturnAnnual / 100) / 12;

    let yearPaidOffA = -1;
    let yearPaidOffB = -1;

    for (let year = 1; year <= input.yearsToSimulate; year++) {
      for (let m = 1; m <= 12; m++) {
        // Scenario A
        if (debtA > 0) {
          const interest = debtA * rDebt;
          debtA += interest;
          debtA -= input.minimumMonthlyPayment;
          if (debtA < 0) debtA = 0;
        } else if (yearPaidOffA === -1) {
          yearPaidOffA = year;
        }
        
        // Invest the extra capital + any freed up minimum payment if debt is gone
        const amountToInvestA = input.monthlyExtraCapital + (debtA <= 0 ? input.minimumMonthlyPayment : 0);
        portfolioA *= (1 + rInv);
        portfolioA += amountToInvestA;

        // Scenario B
        if (debtB > 0) {
          const interest = debtB * rDebt;
          debtB += interest;
          const totalPayment = input.minimumMonthlyPayment + input.monthlyExtraCapital;
          debtB -= totalPayment;
          
          if (debtB < 0) {
            // Overpaid, invest the remainder this month
            portfolioB += Math.abs(debtB);
            debtB = 0;
            yearPaidOffB = year;
          }
        } else {
          // Debt is gone, invest all available cash flow
          if (yearPaidOffB === -1) yearPaidOffB = year;
          const totalToInvest = input.minimumMonthlyPayment + input.monthlyExtraCapital;
          portfolioB *= (1 + rInv);
          portfolioB += totalToInvest;
        }
      }

      years.push({
        year,
        baselineNetWorth: Math.round(portfolioA - debtA), // Investing extra
        scenarioNetWorth: Math.round(portfolioB - debtB), // Paying debt fast
      });
    }

    const finalYear = years[years.length - 1];
    const roiDiff = ((finalYear.scenarioNetWorth - finalYear.baselineNetWorth) / finalYear.baselineNetWorth) * 100;
    
    const primaryInsight = roiDiff > 0 
      ? `Pagar la deuda agresivamente (Escenario B) te deja con un ${roiDiff.toFixed(1)}% más de patrimonio.`
      : `Invertir el extra (Escenario A) te enriquece un ${Math.abs(roiDiff).toFixed(1)}% más gracias a que el interés de la deuda (${input.debtInterestRateAnnual}%) es menor al retorno de inversión (${input.investmentReturnAnnual}%).`;
    
    const secondaryInsight = yearPaidOffB !== -1 
      ? `Saldarías tu deuda en el Año ${yearPaidOffB} si eres agresivo.`
      : `Aún no saldarías la deuda agresivamente en este periodo.`;

    const tertiaryInsight = `Basado en aportes extra de $${input.monthlyExtraCapital.toLocaleString()} / mes.`;

    const explanation = buildSimulatorExplanation({
      domain: 'simulator.debt_vs_invest',
      title: 'Pagar deuda más rápido vs invertir el excedente',
      summary:
        'Escenario A: pago mínimo de deuda + inversión del extra. Escenario B: todo el flujo disponible a deuda hasta saldar, luego inversión.',
      paramLabels: [
        { label: 'Saldo deuda', value: input.debtBalance },
        { label: 'Tasa deuda % EA', value: input.debtInterestRateAnnual },
        { label: 'Pago mínimo mensual', value: input.minimumMonthlyPayment },
        { label: 'Capital extra mensual', value: input.monthlyExtraCapital },
        { label: 'Retorno inversión % EA', value: input.investmentReturnAnnual },
        { label: 'Años', value: input.yearsToSimulate },
      ],
      steps: [
        {
          label: 'Interés mensual sobre saldo',
          description: 'Cada mes se capitaliza interés y se aplican pagos según escenario.',
          ruleRef: 'SIM-DEBT-INTEREST',
        },
        {
          label: 'Patrimonio neto por año',
          description: 'Inversión − deuda restante al cierre de cada año.',
        },
      ],
      assumptions: [
        'Tasas y aportes constantes; sin nuevas deudas ni retiros.',
        'Mismo retorno de inversión todos los meses (compuesto mensual).',
      ],
    });

    return {
      userId,
      primaryInsight,
      secondaryInsight,
      tertiaryInsight,
      years,
      finalScenarioNetWorth: finalYear.scenarioNetWorth,
      finalBaselineNetWorth: finalYear.baselineNetWorth,
      roiDifference: roiDiff,
      metrics: [
        { label: 'Patrimonio Si Inviertes', value: `$${Math.round(finalYear.baselineNetWorth).toLocaleString()}`, color: 'slate' },
        { label: 'Patrimonio Si Pagas Deuda', value: `$${Math.round(finalYear.scenarioNetWorth).toLocaleString()}`, color: roiDiff >= 0 ? 'emerald' : 'amber' },
        { label: 'Diferencia', value: `${roiDiff > 0 ? '+' : ''}${roiDiff.toFixed(1)}%`, color: roiDiff >= 0 ? 'emerald' : 'slate' }
      ],
      explanation,
      confidence: this.confidenceService.evaluateSimulation(),
    };
  }

  // 3. Tax Advantaged Account (AFC/FPV vs Traditional)
  async simulateTaxAdvantaged(userId: string, input: SimulateTaxAdvantagedInput): Promise<SimulationResult> {
    const years: SimulationYearData[] = [];
    
    // Scenario A: Regular Account (Baseline)
    let portfolioA = 0;
    
    // Scenario B: Tax Advantaged Account
    let portfolioB = 0;

    const rAnnual = input.investmentReturnAnnual / 100;
    const rMonthly = rAnnual / 12;
    const taxShieldRatio = input.marginalTaxRate / 100; // e.g. 0.35

    for (let year = 1; year <= input.yearsToSimulate; year++) {
      // Annually, you get a tax return in B that you reinvest
      const annualContribution = input.monthlyContribution * 12;
      const taxReturn = annualContribution * taxShieldRatio;
      
      for (let m = 1; m <= 12; m++) {
        portfolioA *= (1 + rMonthly);
        portfolioA += input.monthlyContribution;

        portfolioB *= (1 + rMonthly);
        portfolioB += input.monthlyContribution;
      }
      
      // Reinvest the tax return at the end of the year into Scenario B
      portfolioB += taxReturn;

      years.push({
        year,
        baselineNetWorth: Math.round(portfolioA), 
        scenarioNetWorth: Math.round(portfolioB), 
      });
    }

    const finalYear = years[years.length - 1];
    const roiDiff = ((finalYear.scenarioNetWorth - finalYear.baselineNetWorth) / finalYear.baselineNetWorth) * 100;
    
    const primaryInsight = `Usar una cuenta exenta (AFC/FPV) y reinvertir el ahorro en impuestos aumenta tu patrimonio en un ${roiDiff.toFixed(1)}% extra en ${input.yearsToSimulate} años.`;
    const secondaryInsight = `El interés compuesto sobre el dinero que le dejaste de pagar al gobierno es magia pura.`;
    const tertiaryInsight = `Asumiendo que logras una retención marginal de ${input.marginalTaxRate}% sobre todo tu aporte.`;

    const explanation = buildSimulatorExplanation({
      domain: 'simulator.tax_advantaged',
      title: 'Cuenta con beneficio fiscal vs cuenta tradicional',
      summary:
        'Aportes mensuales iguales; en el escenario exento se reinvierte al final de cada año el ahorro tributario estimado.',
      paramLabels: [
        { label: 'Aporte mensual', value: input.monthlyContribution },
        { label: 'Tasa marginal %', value: input.marginalTaxRate },
        { label: 'Retorno % EA', value: input.investmentReturnAnnual },
        { label: 'Años', value: input.yearsToSimulate },
      ],
      steps: [
        {
          label: 'Crecimiento mensual compuesto',
          description: 'Mismo retorno en ambas carteras; escenario B recibe lump-sum anual por “devolución” simplificada.',
          ruleRef: 'SIM-TAX-ADV',
        },
      ],
      assumptions: [
        'La tasa marginal aplica sobre todo el aporte (simplificación).',
        'Sin retiros anticipados ni penalizaciones; liquidez igual en ambos casos.',
      ],
    });

    return {
      userId,
      primaryInsight,
      secondaryInsight,
      tertiaryInsight,
      years,
      finalScenarioNetWorth: finalYear.scenarioNetWorth,
      finalBaselineNetWorth: finalYear.baselineNetWorth,
      roiDifference: roiDiff,
      metrics: [
        { label: 'Inversión Tradicional', value: `$${Math.round(finalYear.baselineNetWorth).toLocaleString()}`, color: 'slate' },
        { label: 'Inversión AFC/FPV', value: `$${Math.round(finalYear.scenarioNetWorth).toLocaleString()}`, color: 'emerald' },
        { label: 'Ventaja del Escudo', value: `+${roiDiff.toFixed(1)}%`, color: 'indigo' }
      ],
      explanation,
      confidence: this.confidenceService.evaluateSimulation(),
    };
  }

  // 4. Business/Side-Hustle vs Passive Market
  async simulateBusiness(userId: string, input: SimulateBusinessInput): Promise<SimulationResult> {
    const years: SimulationYearData[] = [];
    
    // Scenario A: Passive Market
    let portfolioA = input.initialCapital;
    const rPassive = (input.passiveMarketReturnAnnual / 100) / 12;
    
    // Scenario B: Business
    let netWorthB = 0; // Capital is spent on the business setup

    for (let year = 1; year <= input.yearsToSimulate; year++) {
      for (let m = 1; m <= 12; m++) {
        // A
        portfolioA *= (1 + rPassive);

        // B: The business yields profit, which we assume is saved/invested passively or kept
        const monthlyProfit = input.expectedMonthlyRevenue - input.monthlyOperatingCost;
        netWorthB *= (1 + rPassive); // assume we invest the profits passively
        netWorthB += monthlyProfit;
      }
      
      years.push({
        year,
        baselineNetWorth: Math.round(portfolioA), 
        scenarioNetWorth: Math.round(netWorthB), 
      });
    }

    const finalYear = years[years.length - 1];
    const roiDiff = ((finalYear.scenarioNetWorth - finalYear.baselineNetWorth) / finalYear.baselineNetWorth) * 100;
    
    let primaryInsight = roiDiff > 0 
      ? `El negocio supera al mercado. Tras ${input.yearsToSimulate} años tu patrimonio es ${roiDiff.toFixed(1)}% mayor.`
      : `El mercado gana pasivamente. Emprender te deja un ${Math.abs(roiDiff).toFixed(1)}% por debajo de haber invertido tus $${input.initialCapital.toLocaleString()} sin hacer nada.`;
    
    const secondaryInsight = input.expectedMonthlyRevenue < input.monthlyOperatingCost 
      ? `El negocio pierde dinero mensual. Ajusta tus expectativas de ventas o costos.`
      : `Tu negocio genera $${(input.expectedMonthlyRevenue - input.monthlyOperatingCost).toLocaleString()} de flujo neto mensual.`;

    const tertiaryInsight = `Ojo: Este modelo no cuantifica el valor de las horas extra (sudor) que le metes al negocio vs la pasividad total.`;

    const explanation = buildSimulatorExplanation({
      domain: 'simulator.business_vs_passive',
      title: 'Negocio propio vs solo invertir en mercado',
      summary:
        'Línea base: capital inicial compuesto al retorno pasivo. Escenario: flujo neto mensual del negocio reinvertido al mismo retorno.',
      paramLabels: [
        { label: 'Capital inicial', value: input.initialCapital },
        { label: 'Costo operativo mensual', value: input.monthlyOperatingCost },
        { label: 'Ingreso mensual esperado', value: input.expectedMonthlyRevenue },
        { label: 'Retorno pasivo % EA', value: input.passiveMarketReturnAnnual },
        { label: 'Años', value: input.yearsToSimulate },
      ],
      steps: [
        {
          label: 'Flujo neto del negocio',
          description: 'Ingresos − costos mensuales, acumulado al patrimonio del negocio.',
        },
        {
          label: 'Reinversión al retorno pasivo',
          description: 'Utilidades del negocio compuestas al mismo r mensual que la línea base.',
        },
      ],
      assumptions: [
        'No se valora tiempo trabajado ni salario implícito.',
        'Mismo retorno de mercado para ambos escenarios después del flujo.',
      ],
    });

    return {
      userId,
      primaryInsight,
      secondaryInsight,
      tertiaryInsight,
      years,
      finalScenarioNetWorth: finalYear.scenarioNetWorth,
      finalBaselineNetWorth: finalYear.baselineNetWorth,
      roiDifference: roiDiff,
      metrics: [
        { label: 'Mercado (S&P 500)', value: `$${Math.round(finalYear.baselineNetWorth).toLocaleString()}`, color: 'slate' },
        { label: 'Negocio Propio', value: `$${Math.round(finalYear.scenarioNetWorth).toLocaleString()}`, color: roiDiff >= 0 ? 'amber' : 'rose' },
        { label: 'Spread Patrimonial', value: `${roiDiff > 0 ? '+' : ''}${roiDiff.toFixed(1)}%`, color: roiDiff >= 0 ? 'amber' : 'slate' }
      ],
      explanation,
      confidence: this.confidenceService.evaluateSimulation(),
    };
  }

  // 5. Custom / Other
  async simulateCustom(userId: string, input: SimulateCustomInput): Promise<SimulationResult> {
    const years: SimulationYearData[] = [];
    
    let baselineNetWorth = input.baselineInitialCapital;
    let scenarioNetWorth = input.scenarioInitialCapital;

    const rBaseline = (input.baselineAnnualReturn / 100) / 12;
    const rScenario = (input.scenarioAnnualReturn / 100) / 12;
    const cScenario = (input.scenarioAnnualCost / 100) / 12;

    for (let year = 1; year <= input.yearsToSimulate; year++) {
      for (let m = 1; m <= 12; m++) {
        // Baseline
        baselineNetWorth *= (1 + rBaseline);
        baselineNetWorth += input.baselineMonthlyContribution;

        // Scenario
        scenarioNetWorth *= (1 + rScenario - cScenario);
        scenarioNetWorth += input.scenarioMonthlyContribution;
      }
      
      years.push({
        year,
        baselineNetWorth: Math.round(baselineNetWorth), 
        scenarioNetWorth: Math.round(scenarioNetWorth), 
      });
    }

    const finalYear = years[years.length - 1];
    const roiDiff = ((finalYear.scenarioNetWorth - finalYear.baselineNetWorth) / finalYear.baselineNetWorth) * 100;
    
    const primaryInsight = roiDiff > 0 
      ? `El Escenario Customizado supera a la Línea Base en un ${roiDiff.toFixed(1)}% después de ${input.yearsToSimulate} años.`
      : `El Escenario Base te deja con un ${Math.abs(roiDiff).toFixed(1)}% más de patrimonio que el Escenario Customizado.`;
    
    const secondaryInsight = `El interés compuesto hizo que tu capital inicial y tus aportes mensuales crecieran significativamente a lo largo del tiempo.`;
    const tertiaryInsight = `Esta simulación personalizada toma en cuenta tanto los retornos como los costos anuales que parametrizaste.`;

    const explanation = buildSimulatorExplanation({
      domain: 'simulator.custom',
      title: 'Comparación custom línea base vs escenario',
      summary:
        'Dos trayectorias con aportes mensuales, retornos anuales efectivos mensuales y costo anual deducido del escenario.',
      paramLabels: [
        { label: 'Base: capital inicial', value: input.baselineInitialCapital },
        { label: 'Base: aporte mensual', value: input.baselineMonthlyContribution },
        { label: 'Base: retorno % EA', value: input.baselineAnnualReturn },
        { label: 'Escenario: capital inicial', value: input.scenarioInitialCapital },
        { label: 'Escenario: aporte mensual', value: input.scenarioMonthlyContribution },
        { label: 'Escenario: retorno % EA', value: input.scenarioAnnualReturn },
        { label: 'Escenario: costo % EA', value: input.scenarioAnnualCost },
        { label: 'Años', value: input.yearsToSimulate },
      ],
      steps: [
        {
          label: 'Valor futuro mes a mes',
          description:
            'r_mensual = retorno_anual/12; escenario neto = r_escenario − costo_escenario por mes.',
          ruleRef: 'SIM-CUSTOM-FV',
        },
      ],
      assumptions: ['Retornos y costos constantes en el horizonte.'],
    });

    return {
      userId,
      primaryInsight,
      secondaryInsight,
      tertiaryInsight,
      years,
      finalScenarioNetWorth: finalYear.scenarioNetWorth,
      finalBaselineNetWorth: finalYear.baselineNetWorth,
      roiDifference: roiDiff,
      metrics: [
        { label: 'Patrimonio Base', value: `$${Math.round(finalYear.baselineNetWorth).toLocaleString()}`, color: 'slate' },
        { label: 'Patrimonio Customizado', value: `$${Math.round(finalYear.scenarioNetWorth).toLocaleString()}`, color: roiDiff >= 0 ? 'emerald' : 'amber' },
        { label: 'Diferencia', value: `${roiDiff > 0 ? '+' : ''}${roiDiff.toFixed(1)}%`, color: roiDiff >= 0 ? 'emerald' : 'slate' }
      ],
      explanation,
      confidence: this.confidenceService.evaluateSimulation(),
    };
  }
}