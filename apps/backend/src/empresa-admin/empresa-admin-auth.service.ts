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
import { InAppNotificationsService } from '../in-app-notifications/in-app-notifications.service';
import { EmpresaAdminsService } from './empresa-admins.service';
import {
  RegisterEmpresaAdminDto,
  ForgotPasswordEmpresaAdminDto,
  ResetPasswordEmpresaAdminDto,
  RequestEmpresaActivationDto,
  ConfirmEmpresaActivationDto,
  InviteEmpresaAdminDto,
  ConfirmEmpresaAdminInviteDto,
} from './dto/empresa-admin-auth.dto';

export const EMPRESA_ADMIN_ACTOR_TYPE = 'EMPRESA_ADMIN';

const EMPRESA_ACTIVATION_TOKEN_TYPE = 'empresa-activation';
const EMPRESA_ADMIN_INVITE_TOKEN_TYPE = 'empresa-admin-invite';

// Minimal blocklist of public email providers. MW-19 only needs this to
// reject an obviously-not-a-company domain on the "domain declared"
// activation path; Domínio Autorizado (MW-22) owns the real, maintained
// list later — this is intentionally small and local to this file.
const PUBLIC_EMAIL_PROVIDER_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'protonmail.com',
  'aol.com',
]);

@Injectable()
export class EmpresaAdminAuthService {
  constructor(
    private prisma: PrismaService,
    private empresaAdminsService: EmpresaAdminsService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
    private inAppNotificationsService: InAppNotificationsService,
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

  // MW-19 — Ativação de uma Empresa existente
  async requestEmpresaActivation(
    empresaId: string,
    dto: RequestEmpresaActivationDto,
  ) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });
    if (!empresa) {
      throw new NotFoundException('Empresa not found');
    }

    await this.assertEmpresaNotActivated(empresaId);

    const email = dto.email.trim().toLowerCase();

    if (dto.domain) {
      const domain = dto.domain.trim().toLowerCase();
      if (PUBLIC_EMAIL_PROVIDER_DOMAINS.has(domain)) {
        throw new BadRequestException(
          'Public email provider domains cannot be used to prove domain ownership',
        );
      }
      if (!email.endsWith(`@${domain}`)) {
        throw new BadRequestException(
          'The email must belong to the declared domain',
        );
      }
    } else if (email !== empresa.email.trim().toLowerCase()) {
      throw new BadRequestException(
        "The email must match the Empresa's registered contact email, or a domain must be declared",
      );
    }

    const activationToken = this.jwtService.sign(
      {
        empresaId,
        email,
        type: EMPRESA_ACTIVATION_TOKEN_TYPE,
      },
      { expiresIn: '1h' },
    );

    await this.notificationsService.sendEmpresaActivationEmail(
      email,
      empresa.company,
      activationToken,
    );

    return {
      message: 'If eligible, a confirmation link has been sent.',
    };
  }

  async confirmEmpresaActivation(dto: ConfirmEmpresaActivationDto) {
    const payload = this.verifyToken(dto.token, EMPRESA_ACTIVATION_TOKEN_TYPE);
    const { empresaId, email } = payload;

    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });
    if (!empresa) {
      throw new NotFoundException('Empresa not found');
    }

    await this.assertEmpresaNotActivated(empresaId);
    await this.assertEmailNotTaken(email);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const admin = await this.prisma.empresaAdmin.create({
      data: {
        empresaId,
        email,
        password: hashedPassword,
        invitedById: null,
      },
    });

    return this.buildAuthResponse(admin);
  }

  // MW-20 — Convite de Administrador
  async inviteEmpresaAdmin(
    admin: { id: string; empresaId: string },
    dto: InviteEmpresaAdminDto,
  ) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: admin.empresaId },
    });
    if (!empresa) {
      throw new NotFoundException('Empresa not found');
    }

    const email = dto.email.trim().toLowerCase();
    await this.assertEmailNotTaken(email);

    const inviteToken = this.jwtService.sign(
      {
        empresaId: admin.empresaId,
        email,
        invitedById: admin.id,
        type: EMPRESA_ADMIN_INVITE_TOKEN_TYPE,
      },
      { expiresIn: '1h' },
    );

    await this.notificationsService.sendEmpresaAdminInviteEmail(
      email,
      empresa.company,
      inviteToken,
    );

    return {
      message: 'Invite sent.',
    };
  }

  async confirmEmpresaAdminInvite(dto: ConfirmEmpresaAdminInviteDto) {
    const payload = this.verifyToken(
      dto.token,
      EMPRESA_ADMIN_INVITE_TOKEN_TYPE,
    );
    const { empresaId, email, invitedById } = payload;

    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });
    if (!empresa) {
      throw new NotFoundException('Empresa not found');
    }

    await this.assertEmailNotTaken(email);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const admin = await this.prisma.empresaAdmin.create({
      data: {
        empresaId,
        email,
        password: hashedPassword,
        invitedById: invitedById ?? null,
      },
    });

    return this.buildAuthResponse(admin);
  }

  // MW-26 — Desativação de Empresa. Qualquer Administrador da Empresa
  // desativa sozinho, sem aprovação de outro admin. Hard-delete de todos os
  // EmpresaAdmin: "Empresa ativada" já é `count(EmpresaAdmin) > 0`
  // (`assertEmpresaNotActivated` acima), então isso faz o fluxo de
  // Ativação normal voltar a funcionar sozinho na reativação, sem nenhum
  // tratamento especial. ConvitePendente/DominioAutorizado só são
  // revogados (status = REVOKED), nunca apagados — `EmpresaLinkingService`
  // já só honra PENDING/CONFIRMED, então isso sozinho impede novos
  // vínculos automáticos sem precisar deletar linhas. Colaborador,
  // WorkHour, Project, Task, Invoice e Address não são tocados.
  async deactivateEmpresa(admin: { empresaId: string }) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: admin.empresaId },
    });
    if (!empresa) {
      throw new NotFoundException('Empresa not found');
    }

    const colaboradores = await this.prisma.$transaction(async (tx) => {
      // Read inside the same transaction as the writes below, so the
      // Colaborador snapshot we notify from matches exactly what existed at
      // the moment of deactivation.
      const rows = await tx.colaborador.findMany({
        where: { empresaId: admin.empresaId },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.empresaAdmin.deleteMany({
        where: { empresaId: admin.empresaId },
      });

      await tx.convitePendente.updateMany({
        where: { empresaId: admin.empresaId, status: 'PENDING' },
        data: { status: 'REVOKED' },
      });

      await tx.dominioAutorizado.updateMany({
        where: {
          empresaId: admin.empresaId,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        data: { status: 'REVOKED' },
      });

      return rows;
    });

    await this.notifyColaboradoresOfDeactivation(colaboradores, empresa);

    return { message: 'Empresa deactivated successfully' };
  }

  private async notifyColaboradoresOfDeactivation(
    colaboradores: Array<{
      user: { id: string; name: string; email: string };
    }>,
    empresa: { name: string | null; company: string },
  ): Promise<void> {
    const empresaName = empresa.name || empresa.company;

    await Promise.all(
      colaboradores.map(async ({ user }) => {
        try {
          await Promise.all([
            this.notificationsService.sendEmpresaDeactivatedEmail(
              user.email,
              user.name,
              empresaName,
            ),
            this.inAppNotificationsService.createEmpresaDeactivatedNotification(
              user.id,
              empresaName,
            ),
          ]);
        } catch (error) {
          console.error(
            'Failed to send Empresa deactivated notification:',
            error,
          );
        }
      }),
    );
  }

  private verifyToken(token: string, expectedType: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== expectedType) {
        throw new BadRequestException('Invalid token');
      }
      return payload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid token');
      }
      throw error;
    }
  }

  private async assertEmpresaNotActivated(empresaId: string) {
    const existingAdminCount = await this.prisma.empresaAdmin.count({
      where: { empresaId },
    });
    if (existingAdminCount > 0) {
      throw new ConflictException(
        'Empresa is already activated; use the Convite de Administrador flow instead',
      );
    }
  }

  private async assertEmailNotTaken(email: string) {
    const existing = await this.empresaAdminsService.findByEmail(email);
    if (existing) {
      throw new ConflictException(
        'An EmpresaAdmin already exists with this email',
      );
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
