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
import { CompanyAdminsService } from './company-admins.service';
import { UsersService } from '../users/users.service';
import { isPublicProviderDomain } from './utils/domain-blocklist.util';
import {
  RegisterCompanyAdminDto,
  ForgotPasswordCompanyAdminDto,
  ResetPasswordCompanyAdminDto,
  RequestCompanyActivationDto,
  ConfirmCompanyActivationDto,
  InviteCompanyAdminDto,
  ConfirmCompanyAdminInviteDto,
} from './dto/company-admin-auth.dto';

export const COMPANY_ADMIN_ACTOR_TYPE = 'COMPANY_ADMIN';

const COMPANY_ACTIVATION_TOKEN_TYPE = 'company-activation';
const COMPANY_ADMIN_INVITE_TOKEN_TYPE = 'company-admin-invite';

@Injectable()
export class CompanyAdminAuthService {
  constructor(
    private prisma: PrismaService,
    private companyAdminsService: CompanyAdminsService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
    private inAppNotificationsService: InAppNotificationsService,
    private usersService: UsersService,
  ) {}

  async register(dto: RegisterCompanyAdminDto) {
    const existing = await this.companyAdminsService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(
        'An CompanyAdmin already exists with this email',
      );
    }

    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('A User already exists with this email');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const company = await this.prisma.company.create({
      data: {
        company: dto.company,
        email: dto.email,
        companyAdmins: {
          create: { email: dto.email, password: hashedPassword },
        },
      },
      include: { companyAdmins: true },
    });

    const admin = company.companyAdmins[0];

    await this.notificationsService.sendWelcomeEmail(
      admin.email,
      dto.company,
    );

    return this.buildAuthResponse(admin);
  }

  async validateCompanyAdmin(email: string, password: string) {
    const admin = await this.companyAdminsService.findByEmail(email);
    if (!admin) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return null;
    }

    return admin;
  }

  async login(admin: { id: string; email: string; companyId: string }) {
    return this.buildAuthResponse(admin);
  }

  async forgotPassword(dto: ForgotPasswordCompanyAdminDto) {
    const admin = await this.companyAdminsService.findByEmail(dto.email);
    if (!admin) {
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    const resetToken = this.jwtService.sign(
      {
        email: admin.email,
        sub: admin.id,
        actorType: COMPANY_ADMIN_ACTOR_TYPE,
        type: 'password-reset',
      },
      { expiresIn: '1h' },
    );

    await this.notificationsService.sendCompanyAdminPasswordResetEmail(
      admin.email,
      admin.email,
      resetToken,
    );

    return { message: 'If the email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordCompanyAdminDto) {
    const { token, newPassword } = dto;

    try {
      const payload = this.jwtService.verify(token);

      if (
        payload.type !== 'password-reset' ||
        payload.actorType !== COMPANY_ADMIN_ACTOR_TYPE
      ) {
        throw new BadRequestException('Invalid reset token');
      }

      const admin = await this.companyAdminsService.findByEmail(
        payload.email,
      );
      if (!admin) {
        throw new NotFoundException('CompanyAdmin not found');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.prisma.companyAdmin.update({
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

  // MW-19 — Ativação de uma Company existente
  async requestCompanyActivation(
    companyId: string,
    dto: RequestCompanyActivationDto,
  ) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.assertCompanyNotActivated(companyId);

    const email = dto.email.trim().toLowerCase();

    if (dto.domain) {
      const domain = dto.domain.trim().toLowerCase();
      if (isPublicProviderDomain(domain)) {
        throw new BadRequestException(
          'Public email provider domains cannot be used to prove domain ownership',
        );
      }
      if (!email.endsWith(`@${domain}`)) {
        throw new BadRequestException(
          'The email must belong to the declared domain',
        );
      }
    } else if (email !== company.email.trim().toLowerCase()) {
      throw new BadRequestException(
        "The email must match the Company's registered contact email, or a domain must be declared",
      );
    }

    const activationToken = this.jwtService.sign(
      {
        companyId,
        email,
        type: COMPANY_ACTIVATION_TOKEN_TYPE,
      },
      { expiresIn: '1h' },
    );

    await this.notificationsService.sendCompanyActivationEmail(
      email,
      company.company,
      activationToken,
    );

    return {
      message: 'If eligible, a confirmation link has been sent.',
    };
  }

  async confirmCompanyActivation(dto: ConfirmCompanyActivationDto) {
    const payload = this.verifyToken(dto.token, COMPANY_ACTIVATION_TOKEN_TYPE);
    const { companyId, email } = payload;

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.assertCompanyNotActivated(companyId);
    await this.assertEmailNotTaken(email);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const admin = await this.prisma.companyAdmin.create({
      data: {
        companyId,
        email,
        password: hashedPassword,
        invitedById: null,
      },
    });

    return this.buildAuthResponse(admin);
  }

  // MW-20 — Admin invite
  async inviteCompanyAdmin(
    admin: { id: string; companyId: string },
    dto: InviteCompanyAdminDto,
  ) {
    const company = await this.prisma.company.findUnique({
      where: { id: admin.companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const email = dto.email.trim().toLowerCase();
    await this.assertEmailNotTaken(email);

    const inviteToken = this.jwtService.sign(
      {
        companyId: admin.companyId,
        email,
        invitedById: admin.id,
        type: COMPANY_ADMIN_INVITE_TOKEN_TYPE,
      },
      { expiresIn: '1h' },
    );

    await this.notificationsService.sendCompanyAdminInviteEmail(
      email,
      company.company,
      inviteToken,
    );

    return {
      message: 'Invite sent.',
    };
  }

  async confirmCompanyAdminInvite(dto: ConfirmCompanyAdminInviteDto) {
    const payload = this.verifyToken(
      dto.token,
      COMPANY_ADMIN_INVITE_TOKEN_TYPE,
    );
    const { companyId, email, invitedById } = payload;

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.assertEmailNotTaken(email);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const admin = await this.prisma.companyAdmin.create({
      data: {
        companyId,
        email,
        password: hashedPassword,
        invitedById: invitedById ?? null,
      },
    });

    return this.buildAuthResponse(admin);
  }

  // MW-26 — Desativação de Company. Qualquer Administrador da Company
  // desativa sozinho, sem aprovação de outro admin. Hard-delete de todos os
  // CompanyAdmin: "Company ativada" já é `count(CompanyAdmin) > 0`
  // (`assertCompanyNotActivated` acima), então isso faz o fluxo de
  // Ativação normal voltar a funcionar sozinho na reativação, sem nenhum
  // tratamento especial. PendingInvite/AuthorizedDomain só são
  // revogados (status = REVOKED), nunca apagados — `CompanyLinkingService`
  // já só honra PENDING/CONFIRMED, então isso sozinho impede novos
  // vínculos automáticos sem precisar deletar linhas. Collaborator,
  // WorkHour, Project, Task, Invoice e Address não são tocados.
  async deactivateCompany(admin: { companyId: string }) {
    const company = await this.prisma.company.findUnique({
      where: { id: admin.companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const collaborators = await this.prisma.$transaction(async (tx) => {
      // Read inside the same transaction as the writes below, so the
      // Collaborator snapshot we notify from matches exactly what existed at
      // the moment of deactivation.
      const rows = await tx.collaborator.findMany({
        where: { companyId: admin.companyId },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.companyAdmin.deleteMany({
        where: { companyId: admin.companyId },
      });

      await tx.pendingInvite.updateMany({
        where: { companyId: admin.companyId, status: 'PENDING' },
        data: { status: 'REVOKED' },
      });

      await tx.authorizedDomain.updateMany({
        where: {
          companyId: admin.companyId,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        data: { status: 'REVOKED' },
      });

      return rows;
    });

    await this.notifyCollaboratorsOfDeactivation(collaborators, company);

    return { message: 'Company deactivated successfully' };
  }

  private async notifyCollaboratorsOfDeactivation(
    collaborators: Array<{
      user: { id: string; name: string; email: string };
    }>,
    company: { name: string | null; company: string },
  ): Promise<void> {
    const companyName = company.name || company.company;

    await Promise.all(
      collaborators.map(async ({ user }) => {
        try {
          await Promise.all([
            this.notificationsService.sendCompanyDeactivatedEmail(
              user.email,
              user.name,
              companyName,
            ),
            this.inAppNotificationsService.createCompanyDeactivatedNotification(
              user.id,
              companyName,
            ),
          ]);
        } catch (error) {
          console.error(
            'Failed to send Company deactivated notification:',
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

  private async assertCompanyNotActivated(companyId: string) {
    const existingAdminCount = await this.prisma.companyAdmin.count({
      where: { companyId },
    });
    if (existingAdminCount > 0) {
      throw new ConflictException(
        'Company is already activated; use the Admin invite flow instead',
      );
    }
  }

  private async assertEmailNotTaken(email: string) {
    const existing = await this.companyAdminsService.findByEmail(email);
    if (existing) {
      throw new ConflictException(
        'An CompanyAdmin already exists with this email',
      );
    }

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('A User already exists with this email');
    }
  }

  private buildAuthResponse(admin: {
    id: string;
    email: string;
    companyId: string;
  }) {
    const payload = {
      email: admin.email,
      sub: admin.id,
      actorType: COMPANY_ADMIN_ACTOR_TYPE,
      companyId: admin.companyId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: admin.id,
        email: admin.email,
        companyId: admin.companyId,
      },
    };
  }
}
