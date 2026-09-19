import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Get,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CompanyAdminAuthService } from './company-admin-auth.service';
import { CompanyAdminJwtAuthGuard } from './guards/company-admin-jwt-auth.guard';
import {
  RegisterCompanyAdminDto,
  LoginCompanyAdminDto,
  ForgotPasswordCompanyAdminDto,
  ResetPasswordCompanyAdminDto,
  RequestCompanyActivationDto,
  ConfirmCompanyActivationDto,
  InviteCompanyAdminDto,
  ConfirmCompanyAdminInviteDto,
} from './dto/company-admin-auth.dto';

@Controller('company-admin/auth')
export class CompanyAdminAuthController {
  constructor(private companyAdminAuthService: CompanyAdminAuthService) {}

  // MW-27 — 20/min per IP: creates a new Company+Admin on every call (no
  // fixed target to guess a credential against), same cap as creating a
  // Pending Invite/Authorized Domain — not the tighter cap on
  // login/forgot-password, which protect one specific account against
  // trial and error.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterCompanyAdminDto) {
    return this.companyAdminAuthService.register(dto);
  }

  // MW-27 — mesmo teto de auth/login (10/min por IP): freia brute-force sem
  // travar o Administrador em uso legítimo.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  async login(@Body() dto: LoginCompanyAdminDto) {
    const admin = await this.companyAdminAuthService.validateCompanyAdmin(
      dto.email,
      dto.password,
    );

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.companyAdminAuthService.login(admin);
  }

  @UseGuards(CompanyAdminJwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  // MW-27 — mesmo teto de auth/forgot-password (5/min por IP).
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordCompanyAdminDto) {
    return this.companyAdminAuthService.forgotPassword(dto);
  }

  // MW-27 — mesmo teto de auth/reset-password (5/min por IP).
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordCompanyAdminDto) {
    return this.companyAdminAuthService.resetPassword(dto);
  }

  // MW-19 — Activation of an existing Company. Public: anyone can start
  // activating a Company that has no Admin yet.
  // MW-27 — 20/min per IP: may be called by a Company with several
  // Collaborators trying to activate one after another; no fixed target to
  // guess a credential against, same cap as creating a Pending
  // Invite/Authorized Domain.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('activate/:companyId/request')
  async requestActivation(
    @Param('companyId') companyId: string,
    @Body() dto: RequestCompanyActivationDto,
  ) {
    return this.companyAdminAuthService.requestCompanyActivation(
      companyId,
      dto,
    );
  }

  // MW-27 — 10/min por IP: cria credenciais a partir de um token JWT de alta
  // entropia (não é alvo prático de força bruta), teto só um pouco mais
  // apertado que o de disparar o pedido.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('activate/confirm')
  async confirmActivation(@Body() dto: ConfirmCompanyActivationDto) {
    return this.companyAdminAuthService.confirmCompanyActivation(dto);
  }

  // MW-20 — Admin invite. Authenticated: only a logged-in Admin can invite
  // another Admin to the same Company.
  @UseGuards(CompanyAdminJwtAuthGuard)
  @Post('invite')
  async inviteAdmin(@Request() req, @Body() dto: InviteCompanyAdminDto) {
    return this.companyAdminAuthService.inviteCompanyAdmin(req.user, dto);
  }

  // MW-27 — cria credenciais a partir de um token público, mesmo teto de
  // register/forgot-password (5/min por IP).
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('invite/confirm')
  async confirmInvite(@Body() dto: ConfirmCompanyAdminInviteDto) {
    return this.companyAdminAuthService.confirmCompanyAdminInvite(dto);
  }

  // MW-26 — Desativação de Company. Qualquer Administrador logado desativa
  // sozinho, sem aprovação de outro admin. MW-27 — 20/min por IP: já exige
  // um JWT de Administrador válido (diferente de login/forgot-password, que
  // são alvo de força bruta sem autenticação), mesmo teto de invites/domains.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(CompanyAdminJwtAuthGuard)
  @Post('deactivate')
  async deactivate(@Request() req) {
    return this.companyAdminAuthService.deactivateCompany(req.user);
  }
}
