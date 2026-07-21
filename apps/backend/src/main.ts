import './instrument';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { YourCatchAllExceptionFilter } from './global.filter';

async function bootstrap() {
  try {
    console.log('🚀 Starting application bootstrap...');

    // Log environment info
    console.log('📋 Environment variables:');
    console.log('- NODE_ENV:', process.env.NODE_ENV || 'not-set');
    console.log(
      '- DATABASE_URL:',
      process.env.DATABASE_URL ? 'configured' : '❌ MISSING',
    );
    console.log(
      '- JWT_SECRET:',
      process.env.JWT_SECRET ? 'configured' : '❌ MISSING',
    );
    console.log('- PORT:', process.env.PORT || '3002');
    console.log(
      '- RAILWAY_ENVIRONMENT:',
      process.env.RAILWAY_ENVIRONMENT || 'not-set',
    );

    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const configService = app.get(ConfigService);
    const httpAdapterHost = app.get(HttpAdapterHost);

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Configure static file serving based on environment
    const railwayVolumePath = process.env.RAILWAY_VOLUME_PATH || '/app/data';
    const isRailwayEnv = !!process.env.RAILWAY_ENVIRONMENT;
    const railwayUploadsPath = join(railwayVolumePath, 'uploads');
    const localUploadsPath = join(process.cwd(), 'uploads');

    // Serve static files - priority: Railway Volume > Local
    if (isRailwayEnv && fs.existsSync(railwayUploadsPath)) {
      console.log(
        '🚂 Using Railway Volume for static files:',
        railwayUploadsPath,
      );
      app.useStaticAssets(railwayUploadsPath, {
        prefix: '/uploads/',
      });
    } else {
      console.log('📁 Using local storage for static files:', localUploadsPath);
      app.useStaticAssets(localUploadsPath, {
        prefix: '/uploads/',
      });
    }

    // Enable CORS for frontend communication.
    // The frontend origin is driven by the FRONTEND_URL env var (set per
    // environment on Railway); localhost and *.up.railway.app stay allowed
    // for local dev and Railway-generated domains.
    const allowedOrigins: (string | RegExp)[] = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL,
      /^https:\/\/.*\.up\.railway\.app$/,
    ].filter((origin): origin is string | RegExp => Boolean(origin));

    console.log('🌐 CORS allowed origins:', allowedOrigins);

    app.enableCors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
      credentials: true,
    });

    app.setGlobalPrefix('api');

    // Attach Sentry global error filter for Nest (Catch-all)
    app.useGlobalFilters(new YourCatchAllExceptionFilter(httpAdapterHost));
    console.log('✅ Catch-all Sentry exception filter configured.');

    const port = configService.get('PORT') || 3002;
    await app.listen(port);
    console.log(`✅ Application is running on port: ${port}`);
    console.log(
      `🌐 Health check available at: http://localhost:${port}/api/health`,
    );
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('💥 Bootstrap failed:', error);
  process.exit(1);
});
