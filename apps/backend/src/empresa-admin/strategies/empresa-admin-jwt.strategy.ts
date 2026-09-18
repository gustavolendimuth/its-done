import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { EmpresaAdminsService } from '../empresa-admins.service';
import { EMPRESA_ADMIN_ACTOR_TYPE } from '../empresa-admin-auth.service';

@Injectable()
export class EmpresaAdminJwtStrategy extends PassportStrategy(
  Strategy,
  'empresa-admin-jwt',
) {
  constructor(
    private configService: ConfigService,
    private empresaAdminsService: EmpresaAdminsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    if (payload.actorType !== EMPRESA_ADMIN_ACTOR_TYPE) {
      return null;
    }

    const admin = await this.empresaAdminsService.findById(payload.sub);
    if (!admin) {
      return null;
    }

    const { password: _password, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  }
}
