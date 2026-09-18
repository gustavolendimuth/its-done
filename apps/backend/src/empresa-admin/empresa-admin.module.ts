import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmpresaAdminAuthController } from './empresa-admin-auth.controller';
import { EmpresaAdminAuthService } from './empresa-admin-auth.service';
import { EmpresaAdminsService } from './empresa-admins.service';
import { EmpresaAdminJwtStrategy } from './strategies/empresa-admin-jwt.strategy';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule,
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
  controllers: [EmpresaAdminAuthController],
  providers: [
    EmpresaAdminAuthService,
    EmpresaAdminsService,
    EmpresaAdminJwtStrategy,
  ],
  exports: [EmpresaAdminsService, EmpresaAdminAuthService],
})
export class EmpresaAdminModule {}
