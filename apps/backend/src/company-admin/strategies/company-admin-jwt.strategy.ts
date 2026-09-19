import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CompanyAdminsService } from '../company-admins.service';
import { COMPANY_ADMIN_ACTOR_TYPE } from '../company-admin-auth.service';

@Injectable()
export class CompanyAdminJwtStrategy extends PassportStrategy(
  Strategy,
  'company-admin-jwt',
) {
  constructor(
    private configService: ConfigService,
    private companyAdminsService: CompanyAdminsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    if (payload.actorType !== COMPANY_ADMIN_ACTOR_TYPE) {
      return null;
    }

    const admin = await this.companyAdminsService.findById(payload.sub);
    if (!admin) {
      return null;
    }

    const { password: _password, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  }
}
