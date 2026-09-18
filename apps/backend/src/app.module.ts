import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorkHoursModule } from './work-hours/work-hours.module';
import { ClientsModule } from './clients/clients.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { SettingsModule } from './settings/settings.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AddressesModule } from './addresses/addresses.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InAppNotificationsModule } from './in-app-notifications/in-app-notifications.module';
import { AdminModule } from './admin/admin.module';
import { EmpresaAdminModule } from './empresa-admin/empresa-admin.module';
import { WorkSessionsModule } from './work-sessions/work-sessions.module';
import { PushModule } from './push/push.module';
import { WorkSessionSchedulerService } from './work-sessions/services/work-session-scheduler.service';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    // MW-27 — Rate limiting básico, aplicado a toda a aplicação.
    // Camada 'default': 60 req/min por IP, teto geral pra tráfego autenticado
    // normal (não incomoda uso legítimo, mas barra abuso grosseiro).
    // Rotas sensíveis (login, forgot/reset-password, criar Convite Pendente,
    // criar/confirmar Domínio Autorizado) sobrescrevem esse teto com
    // @Throttle({ default: { limit, ttl } }) direto no controller/handler —
    // ver auth.controller.ts e empresa-admin/*.controller.ts.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 60,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    WorkHoursModule,
    ClientsModule,
    ProjectsModule,
    TasksModule,
    AddressesModule,
    SettingsModule,
    InvoicesModule,
    ReportsModule,
    DashboardModule,
    NotificationsModule,
    InAppNotificationsModule,
    AdminModule,
    EmpresaAdminModule,
    WorkSessionsModule,
    PushModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    WorkSessionSchedulerService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
