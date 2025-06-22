import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
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
        RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'not-set',
        PORT: process.env.PORT || '3002',
      },
    };
  }
}
