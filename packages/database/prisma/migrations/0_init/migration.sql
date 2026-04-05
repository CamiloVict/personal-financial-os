-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CASH', 'CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'LOAN');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BudgetPeriod" AS ENUM ('MONTHLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FeasibilityLevel" AS ENUM ('CONSERVATIVE', 'REASONABLE', 'AGGRESSIVE', 'UNREALISTIC');

-- CreateEnum
CREATE TYPE "ScenarioType" AS ENUM ('INCREASE_INCOME', 'REDUCE_EXPENSES', 'OPTIMIZE_INVESTMENTS', 'COMBINED_STRATEGY');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "StreamType" AS ENUM ('FIXED', 'VARIABLE');

-- CreateEnum
CREATE TYPE "PeriodFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'FOUR_MONTHLY', 'SEMIANNUALLY', 'ANNUALLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InvestmentStatus" AS ENUM ('ACTIVE', 'CLOSED', 'PENDING');

-- CreateEnum
CREATE TYPE "InvestmentEventType" AS ENUM ('CAPITAL_CONTRIBUTION', 'CAPITAL_WITHDRAWAL', 'PROFIT_DISTRIBUTION', 'PROFIT_REINVESTMENT', 'VALUATION_INCREASE', 'VALUATION_DECREASE', 'INITIAL_PURCHASE', 'PARTIAL_SALE', 'TOTAL_SALE', 'ASSOCIATED_EXPENSE', 'MANUAL_ADJUSTMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "jurisdiction" TEXT NOT NULL DEFAULT 'CO',
    "isResident" BOOLEAN NOT NULL DEFAULT true,
    "daysInCountry" INTEGER NOT NULL DEFAULT 365,
    "primaryNationality" TEXT NOT NULL DEFAULT 'CO',
    "hasForeignIncome" BOOLEAN NOT NULL DEFAULT false,
    "hasForeignAssets" BOOLEAN NOT NULL DEFAULT false,
    "hasDependents" BOOLEAN NOT NULL DEFAULT false,
    "hasVoluntaryPension" BOOLEAN NOT NULL DEFAULT false,
    "hasAFC" BOOLEAN NOT NULL DEFAULT false,
    "hasPrepaidMedicine" BOOLEAN NOT NULL DEFAULT false,
    "hasHousingInterest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxIncomeClassification" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "suggestedCedula" TEXT NOT NULL,
    "confidenceLevel" TEXT NOT NULL,
    "isForeignSource" BOOLEAN NOT NULL DEFAULT false,
    "hasWithholding" BOOLEAN NOT NULL DEFAULT false,
    "foreignTaxPaid" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "engineVersion" TEXT NOT NULL,
    "explanation" TEXT,
    "missingConditions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxIncomeClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxPlan" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxScenario" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "estimatedGrossIncome" DECIMAL(65,30) NOT NULL,
    "estimatedDeductions" DECIMAL(65,30) NOT NULL,
    "estimatedExemptions" DECIMAL(65,30) NOT NULL,
    "estimatedTaxableBase" DECIMAL(65,30) NOT NULL,
    "estimatedTaxLiability" DECIMAL(65,30) NOT NULL,
    "estimatedForeignCredit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "estimatedNetTaxPayable" DECIMAL(65,30) NOT NULL,
    "explanation" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "requirements" TEXT[],

    CONSTRAINT "TaxScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
    "country" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "enableBudgets" BOOLEAN NOT NULL DEFAULT false,
    "enableInvestments" BOOLEAN NOT NULL DEFAULT false,
    "enableDebts" BOOLEAN NOT NULL DEFAULT false,
    "enableSavingGoals" BOOLEAN NOT NULL DEFAULT false,
    "enableSubscriptions" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "color" TEXT,
    "icon" TEXT,
    "isIncludedInNetWorth" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "destinationAccountId" TEXT,
    "categoryId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "period" "BudgetPeriod" NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" DECIMAL(65,30) NOT NULL,
    "currentAmount" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "targetDate" TIMESTAMP(3),
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavingGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalRecommendation" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentMonthlySavings" DECIMAL(65,30) NOT NULL,
    "targetAmount" DECIMAL(65,30) NOT NULL,
    "currentAmount" DECIMAL(65,30) NOT NULL,
    "monthsRemaining" INTEGER NOT NULL,
    "monthlyAmountNeeded" DECIMAL(65,30) NOT NULL,
    "monthlyShortfall" DECIMAL(65,30) NOT NULL,
    "currentProjectedMonths" INTEGER,
    "feasibilityLevel" "FeasibilityLevel" NOT NULL,

    CONSTRAINT "GoalRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationScenario" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "type" "ScenarioType" NOT NULL,
    "incomeIncreaseAmount" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "expenseReductionAmount" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "reinvestmentIncreaseAmount" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "newProjectedMonths" INTEGER,
    "monthsSaved" INTEGER,
    "explanation" TEXT NOT NULL,
    "feasibilityLevel" "FeasibilityLevel" NOT NULL,

    CONSTRAINT "RecommendationScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Debt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "remainingAmount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "interestRate" DECIMAL(65,30),
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "debtKind" TEXT,
    "monthlyPayment" DECIMAL(65,30),
    "linkedPositionId" TEXT,

    CONSTRAINT "Debt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "nextDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "estimatedValue" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "isIncludedInNetWorth" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentTypeDefinition" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "generatesCashflow" BOOLEAN NOT NULL DEFAULT false,
    "allowsProfitDistribution" BOOLEAN NOT NULL DEFAULT false,
    "expectedFrequency" "PeriodFrequency",
    "allowsExtraContributions" BOOLEAN NOT NULL DEFAULT false,
    "allowsPartialWithdrawals" BOOLEAN NOT NULL DEFAULT false,
    "allowsLinkedDebt" BOOLEAN NOT NULL DEFAULT false,
    "hasManualValuation" BOOLEAN NOT NULL DEFAULT false,
    "hasMaturityDate" BOOLEAN NOT NULL DEFAULT false,
    "hasPaymentSchedule" BOOLEAN NOT NULL DEFAULT false,
    "showAsPatrimonialAsset" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentTypeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentPosition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "assetId" TEXT,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "initialCapital" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "currentEstimatedValue" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "status" "InvestmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "isIncludedInNetWorth" BOOLEAN NOT NULL DEFAULT true,
    "generatesPeriodicIncome" BOOLEAN NOT NULL DEFAULT false,
    "frequency" "PeriodFrequency",
    "customFrequencyMonths" INTEGER,
    "nextExpectedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentEvent" (
    "id" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "InvestmentEventType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "observations" TEXT,
    "wasMoneyWithdrawn" BOOLEAN NOT NULL DEFAULT false,
    "wasMoneyReinvested" BOOLEAN NOT NULL DEFAULT false,
    "hadAdditionalContribution" BOOLEAN NOT NULL DEFAULT false,
    "supportingDocument" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetDebtLink" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "assignedAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetDebtLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseFundingLink" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "assignedAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseFundingLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashflowStream" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "flowType" "TransactionType" NOT NULL,
    "streamType" "StreamType" NOT NULL,
    "expectedAmount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "frequency" "PeriodFrequency" NOT NULL,
    "customFrequencyMonths" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashflowStream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashflowEvent" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashflowEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TaxProfile_userId_taxYear_jurisdiction_key" ON "TaxProfile"("userId", "taxYear", "jurisdiction");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetDebtLink_assetId_debtId_key" ON "AssetDebtLink"("assetId", "debtId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseFundingLink_transactionId_debtId_key" ON "ExpenseFundingLink"("transactionId", "debtId");

-- AddForeignKey
ALTER TABLE "TaxProfile" ADD CONSTRAINT "TaxProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxIncomeClassification" ADD CONSTRAINT "TaxIncomeClassification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TaxProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxPlan" ADD CONSTRAINT "TaxPlan_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TaxProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxScenario" ADD CONSTRAINT "TaxScenario_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TaxPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_destinationAccountId_fkey" FOREIGN KEY ("destinationAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingGoal" ADD CONSTRAINT "SavingGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalRecommendation" ADD CONSTRAINT "GoalRecommendation_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "SavingGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationScenario" ADD CONSTRAINT "RecommendationScenario_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "GoalRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_linkedPositionId_fkey" FOREIGN KEY ("linkedPositionId") REFERENCES "InvestmentPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentTypeDefinition" ADD CONSTRAINT "InvestmentTypeDefinition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentPosition" ADD CONSTRAINT "InvestmentPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentPosition" ADD CONSTRAINT "InvestmentPosition_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "InvestmentTypeDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentPosition" ADD CONSTRAINT "InvestmentPosition_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentEvent" ADD CONSTRAINT "InvestmentEvent_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "InvestmentPosition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDebtLink" ADD CONSTRAINT "AssetDebtLink_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDebtLink" ADD CONSTRAINT "AssetDebtLink_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseFundingLink" ADD CONSTRAINT "ExpenseFundingLink_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseFundingLink" ADD CONSTRAINT "ExpenseFundingLink_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashflowStream" ADD CONSTRAINT "CashflowStream_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashflowStream" ADD CONSTRAINT "CashflowStream_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashflowEvent" ADD CONSTRAINT "CashflowEvent_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "CashflowStream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

