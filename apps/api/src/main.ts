import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

function assertProductionSecurity(): void {
  if (process.env.NODE_ENV !== 'production') return;
  if (process.env.AUTH_DISABLED === 'true') {
    throw new Error('AUTH_DISABLED must not be enabled in production');
  }
  if (!process.env.CORS_ORIGINS?.trim()) {
    throw new Error('CORS_ORIGINS must be set in production (comma-separated allowed origins)');
  }
}

function corsOriginConfig(): boolean | string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CORS_ORIGINS required in production');
    }
    return true;
  }
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

async function bootstrap() {
  try {
    assertProductionSecurity();
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.enableCors({
      // origin: corsOriginConfig(),  
      origin: '*',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'x-cron-secret', 'x-fx-upsert-secret'],
    });
    const port = Number(process.env.PORT) || 3001;
    await app.listen(port, '0.0.0.0');
  } catch (err) {
    console.log('BOOTSTRAP ERROR', err);
    process.exit(1);
  }
}
bootstrap();