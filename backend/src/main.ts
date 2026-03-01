import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';

function isPrivateOrLocalHost(host: string): boolean {
  if (host === 'localhost' || host === '127.0.0.1') return true;
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  return false;
}

async function bootstrap() {
  const uploadsPath = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsPath)) {
    mkdirSync(uploadsPath, { recursive: true });
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useStaticAssets(uploadsPath, { prefix: '/uploads/' });
  const explicitOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean);
  const origin = (originUrl: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!originUrl) return callback(null, true);
    try {
      const u = new URL(originUrl);
      if (explicitOrigins?.length) {
        const inList = explicitOrigins.some((o) => {
          try {
            const a = new URL(o);
            return a.origin === u.origin;
          } catch {
            return false;
          }
        });
        if (inList) return callback(null, true);
      }
      if (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || isPrivateOrLocalHost(u.hostname))) {
        return callback(null, true);
      }
      callback(null, false);
    } catch {
      callback(null, false);
    }
  };
  app.enableCors({
    origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  const port = process.env.PORT ?? 3000;
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  console.log(`API listening on http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
}
bootstrap();
