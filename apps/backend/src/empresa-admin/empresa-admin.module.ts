import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmpresaAdminAuthController } from './empresa-admin-auth.controller';
import { EmpresaAdminAuthService } from './empresa-admin-auth.service';
import { EmpresaAdminsService } from './empresa-admins.service';
import { EmpresaAdminJwtStrategy } from './strategies/empresa-admin-jwt.strategy';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmpresaLinkingService } from './empresa-linking.service';
import { ConvitesPendentesController } from './convites-pendentes.controller';
import { ConvitesPendentesService } from './convites-pendentes.service';
import { DominiosAutorizadosController } from './dominios-autorizados.controller';
import { DominiosAutorizadosService } from './dominios-autorizados.service';

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
  controllers: [
    EmpresaAdminAuthController,
    ConvitesPendentesController,
    DominiosAutorizadosController,
  ],
  providers: [
    EmpresaAdminAuthService,
    EmpresaAdminsService,
    EmpresaAdminJwtStrategy,
    EmpresaLinkingService,
    ConvitesPendentesService,
    DominiosAutorizadosService,
  ],
  exports: [
    EmpresaAdminsService,
    EmpresaAdminAuthService,
    EmpresaLinkingService,
  ],
})
export class EmpresaAdminModule {}
