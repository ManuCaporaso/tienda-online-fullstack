import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

/**
 * Permite orígenes de desarrollo: localhost, 127.0.0.1 y cualquier IP
 * de la red local 192.168.x.x (con cualquier puerto).
 */
function isLocalNetworkOrigin(origin: string): boolean {
  try {
    const { protocol, hostname } = new URL(origin);

    if (protocol !== 'http:' && protocol !== 'https:') {
      return false;
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    return /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname);
  } catch {
    return false;
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Imágenes de productos (se sirven en /assets/images/<archivo>)
  const imagesDir = join(process.cwd(), 'assets', 'images');
  mkdirSync(imagesDir, { recursive: true });
  app.useStaticAssets(imagesDir, { prefix: '/assets/images/' });

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  // CORS_ORIGIN admite una lista separada por comas:
  // CORS_ORIGIN="http://localhost:3000,http://192.168.0.147:3000"
  const allowedOrigins = (config.get<string>('CORS_ORIGIN') ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const isDevelopment =
    (config.get<string>('NODE_ENV') ?? 'development') !== 'production';

  app.enableCors({
    origin: (origin, callback) => {
      // Sin origin (curl, server-to-server, same-origin) → permitir.
      if (!origin) {
        callback(null, true);
        return;
      }

      // Orígenes explícitos configurados en .env.
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      // En desarrollo (o sin CORS_ORIGIN definido) permitir la red local.
      if (
        (isDevelopment || allowedOrigins.length === 0) &&
        isLocalNetworkOrigin(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(config.get('PORT')) || 3030;
  await app.listen(port);
  console.log(`🚀 Backend NestJS en http://localhost:${port}/api`);
}

void bootstrap();
