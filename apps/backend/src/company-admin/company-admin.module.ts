import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CompanyAdminAuthController } from './company-admin-auth.controller';
import { CompanyAdminAuthService } from './company-admin-auth.service';
import { CompanyAdminsService } from './company-admins.service';
import { CompanyAdminJwtStrategy } from './strategies/company-admin-jwt.strategy';
import { NotificationsModule } from '../notifications/notifications.module';
import { InAppNotificationsModule } from '../in-app-notifications/in-app-notifications.module';
import { CompanyLinkingService } from './company-linking.service';
import { ConvitesPendentesController } from './pending-invites.controller';
import { ConvitesPendentesService } from './pending-invites.service';
import { DominiosAutorizadosController } from './authorized-domains.controller';
import { DominiosAutorizadosService } from './authorized-domains.service';
import { CollaboratorsController } from './collaborators.controller';
import { CollaboratorsService } from './collaborators.service';
import { CompanyDashboardController } from './company-dashboard.controller';
import { CompanyDashboardService } from './company-dashboard.service';

@Module({
  imports: [
    NotificationsModule,
    InAppNotificationsModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '30d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    CompanyAdminAuthController,
    ConvitesPendentesController,
    DominiosAutorizadosController,
    CollaboratorsController,
    CompanyDashboardController,
  ],
  providers: [
    CompanyAdminAuthService,
    CompanyAdminsService,
    CompanyAdminJwtStrategy,
    CompanyLinkingService,
    ConvitesPendentesService,
    DominiosAutorizadosService,
    CollaboratorsService,
    CompanyDashboardService,
  ],
  exports: [
    CompanyAdminsService,
    CompanyAdminAuthService,
    CompanyLinkingService,
  ],
})
export class CompanyAdminModule {}
