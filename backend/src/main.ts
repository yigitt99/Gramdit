import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    const configService = app.get(ConfigService);

    // Serve uploaded files statically
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
    app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

    // Global prefix
    const apiPrefix = configService.get<string>('API_PREFIX', '/api/v1');
    app.setGlobalPrefix(apiPrefix);

    // CORS
    const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:5173');
    app.enableCors({
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Global filters
    app.useGlobalFilters(new HttpExceptionFilter());

    // Global interceptors
    app.useGlobalInterceptors(new LoggingInterceptor());

    const port = configService.get<number>('PORT', 3000);
    
    await app.listen(port, '0.0.0.0');

    logger.log(`═══════════════════════════════════════════════════════`);
    logger.log(`✅ Application is running on: http://0.0.0.0:${port}${apiPrefix}`);
    logger.log(`✅ Environment: ${configService.get('NODE_ENV')}`);
    logger.log(`✅ Database: ${configService.get('DB_HOST')}:${configService.get('DB_PORT')}/${configService.get('DB_DATABASE')}`);
    logger.log(`✅ Redis: ${configService.get('REDIS_HOST')}:${configService.get('REDIS_PORT')}`);
    logger.log(`═══════════════════════════════════════════════════════`);
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

bootstrap();
