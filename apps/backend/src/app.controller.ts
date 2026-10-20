import { Controller, Get, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('debug-sentry')
  getError(): void {
    // Public endpoint: never let anyone generate Sentry events in production
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    throw new Error('My first Sentry error!');
  }

  @Get('health')
  async getHealth(): Promise<{
    status: string;
    timestamp: string;
    database: string;
    environment: Record<string, string>;
  }> {
    let databaseStatus = 'unknown';

    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch (error) {
      databaseStatus = `error: ${error.message}`;
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: databaseStatus,
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'not-set',
        DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'missing',
        JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'missing',
        RESEND_API_KEY: process.env.RESEND_API_KEY ? 'configured' : 'missing',
        FROM_EMAIL: process.env.FROM_EMAIL || 'not-set',
        FRONTEND_URL: process.env.FRONTEND_URL || 'not-set',
        RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'not-set',
        PORT: process.env.PORT || '3002',
        SENTRY_DSN: process.env.SENTRY_DSN ? 'configured' : 'missing',
      },
    };
  }
}
