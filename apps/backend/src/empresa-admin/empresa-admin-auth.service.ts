import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmpresaAdminsService } from './empresa-admins.service';
import {
  RegisterEmpresaAdminDto,
  ForgotPasswordEmpresaAdminDto,
  ResetPasswordEmpresaAdminDto,
} from './dto/empresa-admin-auth.dto';

export const EMPRESA_ADMIN_ACTOR_TYPE = 'EMPRESA_ADMIN';

@Injectable()
export class EmpresaAdminAuthService {
  constructor(
    private prisma: PrismaService,
    private empresaAdminsService: EmpresaAdminsService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  async register(dto: RegisterEmpresaAdminDto) {
    const existing = await this.empresaAdminsService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(
        'An EmpresaAdmin already exists with this email',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const empresa = await this.prisma.empresa.create({
      data: {
        company: dto.company,
        email: dto.email,
        empresaAdmins: {
          create: { email: dto.email, password: hashedPassword },
        },
      },
      include: { empresaAdmins: true },
    });

    const admin = empresa.empresaAdmins[0];

    await this.notificationsService.sendWelcomeEmail(
      admin.email,
      dto.company,
    );

    return this.buildAuthResponse(admin);
  }

  async validateEmpresaAdmin(email: string, password: string) {
    const admin = await this.empresaAdminsService.findByEmail(email);
    if (!admin) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return null;
    }

    return admin;
  }

  async login(admin: { id: string; email: string; empresaId: string }) {
    return this.buildAuthResponse(admin);
  }

  async forgotPassword(dto: ForgotPasswordEmpresaAdminDto) {
    const admin = await this.empresaAdminsService.findByEmail(dto.email);
    if (!admin) {
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    const resetToken = this.jwtService.sign(
      {
        email: admin.email,
        sub: admin.id,
        actorType: EMPRESA_ADMIN_ACTOR_TYPE,
        type: 'password-reset',
      },
      { expiresIn: '1h' },
    );

    await this.notificationsService.sendPasswordResetEmail(
      admin.email,
      admin.email,
      resetToken,
    );

    return { message: 'If the email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordEmpresaAdminDto) {
    const { token, newPassword } = dto;

    try {
      const payload = this.jwtService.verify(token);

      if (
        payload.type !== 'password-reset' ||
        payload.actorType !== EMPRESA_ADMIN_ACTOR_TYPE
      ) {
        throw new BadRequestException('Invalid reset token');
      }

      const admin = await this.empresaAdminsService.findByEmail(
        payload.email,
      );
      if (!admin) {
        throw new NotFoundException('EmpresaAdmin not found');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.prisma.empresaAdmin.update({
        where: { id: admin.id },
        data: { password: hashedPassword },
      });

      return { message: 'Password reset successfully' };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Reset token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid reset token');
      }
      throw error;
    }
  }

  private buildAuthResponse(admin: {
    id: string;
    email: string;
    empresaId: string;
  }) {
    const payload = {
      email: admin.email,
      sub: admin.id,
      actorType: EMPRESA_ADMIN_ACTOR_TYPE,
      empresaId: admin.empresaId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: admin.id,
        email: admin.email,
        empresaId: admin.empresaId,
      },
    };
  }
}
