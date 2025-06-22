import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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

  // Enable CORS for frontend communication
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3002);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
