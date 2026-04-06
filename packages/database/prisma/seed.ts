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

  await prisma.userPreference.upsert({
    where: { userId: 'u1' },
    create: {
      userId: 'u1',
      displayValuationMode: 'NOMINAL_COP',
      valuationAsOfDate: new Date(),
      realTermsBaseMonth: new Date(Date.UTC(2020, 0, 1)),
    },
    update: {},
  });

  const coIpc = await prisma.inflationSeries.upsert({
    where: { code: 'CO_IPC' },
    create: {
      code: 'CO_IPC',
      name: 'IPC Colombia (serie demo)',
      description:
        'Índice sintético ~0,5% mensual para pruebas de términos reales. Sustituir por DANE en producción.',
    },
    update: {},
  });

  let idx = 100;
  for (let y = 2020; y <= 2027; y++) {
    const lastM = y === 2027 ? 1 : 12;
    for (let m = 1; m <= lastM; m++) {
      const period = new Date(Date.UTC(y, m - 1, 1));
      await prisma.inflationIndexPoint.upsert({
        where: {
          seriesId_period: { seriesId: coIpc.id, period },
        },
        create: { seriesId: coIpc.id, period, indexValue: idx },
        update: { indexValue: idx },
      });
      idx *= 1.005;
    }
  }

  const startFx = new Date(Date.UTC(2020, 0, 1));
  const endFx = new Date(Date.UTC(2026, 11, 31));
  for (let t = startFx.getTime(); t <= endFx.getTime(); t += 7 * 86400000) {
    const asOfDate = new Date(t);
    const progress =
      (t - startFx.getTime()) / (endFx.getTime() - startFx.getTime());
    const copPerUnit = 3800 + progress * 800;
    await prisma.fxRateDaily.upsert({
      where: {
        asOfDate_quoteCurrency: { asOfDate, quoteCurrency: 'USD' },
      },
      create: {
        asOfDate,
        quoteCurrency: 'USD',
        copPerUnit,
        source: 'seed-synthetic',
      },
      update: { copPerUnit, source: 'seed-synthetic' },
    });
  }

  await prisma.fxRateDaily.upsert({
    where: {
      asOfDate_quoteCurrency: {
        asOfDate: new Date(Date.UTC(2024, 5, 15)),
        quoteCurrency: 'EUR',
      },
    },
    create: {
      asOfDate: new Date(Date.UTC(2024, 5, 15)),
      quoteCurrency: 'EUR',
      copPerUnit: 4200,
      source: 'seed-synthetic',
    },
    update: { copPerUnit: 4200 },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
