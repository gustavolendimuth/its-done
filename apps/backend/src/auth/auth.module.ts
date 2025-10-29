import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

// Provider condicional para Google OAuth
const googleStrategyProvider = {
  provide: 'GOOGLE_STRATEGY',
  useFactory: (configService: ConfigService) => {
    const clientId = configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get('GOOGLE_CLIENT_SECRET');

    // Só retorna o GoogleStrategy se as credenciais estiverem configuradas
    if (clientId && clientSecret) {
      return new GoogleStrategy(configService);
    }

    console.log('⚠️  Google OAuth não configurado - autenticação via Google desabilitada');
    return null;
  },
  inject: [ConfigService],
};

@Module({
  imports: [
    UsersModule,
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
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    googleStrategyProvider,
  ],
  exports: [AuthService],
})
export class AuthModule {}
