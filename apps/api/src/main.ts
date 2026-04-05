import { config } from 'dotenv';
import { resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

config({ path: resolve(process.cwd(), '.env') });

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: true,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
    const port = Number(process.env.PORT) || 3001;
    await app.listen(port, '0.0.0.0');
  } catch (err) {
    console.log("BOOTSTRAP ERROR", err);
    process.exit(1);
  }
}
bootstrap();