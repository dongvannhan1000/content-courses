import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ENV } from './config/environment.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const logger = new Logger('Bootstrap');

// Environment-based CORS origins
function getCorsOrigins(): string[] {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const ngrokUrl = process.env.NGROK_URL || '';

  if (ENV.isDevelopment) {
    // Development: allow all local origins
    const origins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:4173',
      frontendUrl,
    ];
    if (ngrokUrl) {
      origins.push(ngrokUrl);
    }
    return origins.filter(Boolean);
  }

  // Production: only allow configured frontend URL
  return frontendUrl ? [frontendUrl] : [];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ENV.isDevelopment
      ? ['log', 'error', 'warn', 'debug', 'verbose']
      : ['log', 'error', 'warn'],
  });

  // Log environment info
  logger.log(`🚀 Starting in ${ENV.current.toUpperCase()} mode`);
  logger.log(`📋 Features: Swagger=${ENV.features.enableSwagger}, VerboseLog=${ENV.features.verboseLogging}`);

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Enable cookie parser for HTTP-only cookies
  app.use(cookieParser());

  // CORS configuration
  const origins = getCorsOrigins();
  logger.log(`🔒 CORS origins: ${origins.join(', ')}`);

  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger API documentation (not in production)
  if (ENV.features.enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('Learning Lab API')
      .setDescription('Vocab & SRS endpoints')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      jsonDocumentUrl: 'openapi.json',
    });
    logger.log('📚 Swagger docs available at /api');
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  logger.log(`✅ API running on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application', error);
  process.exit(1);
});
