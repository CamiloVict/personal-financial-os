import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'local@dev.local' },
    update: {},
    create: {
      id: 'u1',
      email: 'local@dev.local',
      firstName: 'Local',
      lastName: 'Dev',
    },
  });

  const systemTypes = await prisma.investmentTypeDefinition.count({
    where: { isSystem: true },
  });

  if (systemTypes === 0) {
    await prisma.investmentTypeDefinition.createMany({
      data: [
        {
          name: 'Fondo / ETF',
          description: 'Inversión en mercado con valorización y posible dividendo',
          isSystem: true,
          generatesCashflow: false,
          allowsProfitDistribution: true,
          expectedFrequency: 'QUARTERLY',
          allowsExtraContributions: true,
          allowsPartialWithdrawals: true,
          allowsLinkedDebt: false,
          hasManualValuation: true,
          hasMaturityDate: false,
          hasPaymentSchedule: false,
          showAsPatrimonialAsset: true,
        },
        {
          name: 'Propiedad en arriendo',
          description: 'Activo inmobiliario con ingreso recurrente',
          isSystem: true,
          generatesCashflow: true,
          allowsProfitDistribution: true,
          expectedFrequency: 'MONTHLY',
          allowsExtraContributions: true,
          allowsPartialWithdrawals: false,
          allowsLinkedDebt: true,
          hasManualValuation: true,
          hasMaturityDate: false,
          hasPaymentSchedule: false,
          showAsPatrimonialAsset: true,
        },
      ],
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
