import { Injectable } from '@nestjs/common';
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
    };
  }
}