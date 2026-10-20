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
import { PendingInvitesController } from './pending-invites.controller';
import { PendingInvitesService } from './pending-invites.service';
import { AuthorizedDomainsController } from './authorized-domains.controller';
import { AuthorizedDomainsService } from './authorized-domains.service';
import { CollaboratorsController } from './collaborators.controller';
import { CollaboratorsService } from './collaborators.service';
import { CompanyDashboardController } from './company-dashboard.controller';
import { CompanyDashboardService } from './company-dashboard.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
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
    PendingInvitesController,
    AuthorizedDomainsController,
    CollaboratorsController,
    CompanyDashboardController,
  ],
  providers: [
    CompanyAdminAuthService,
    CompanyAdminsService,
    CompanyAdminJwtStrategy,
    CompanyLinkingService,
    PendingInvitesService,
    AuthorizedDomainsService,
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
