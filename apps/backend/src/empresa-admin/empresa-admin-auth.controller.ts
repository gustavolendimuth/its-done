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
import { EmpresaAdminAuthService } from './empresa-admin-auth.service';
import { EmpresaAdminJwtAuthGuard } from './guards/empresa-admin-jwt-auth.guard';
import {
  RegisterEmpresaAdminDto,
  LoginEmpresaAdminDto,
  ForgotPasswordEmpresaAdminDto,
  ResetPasswordEmpresaAdminDto,
  RequestEmpresaActivationDto,
  ConfirmEmpresaActivationDto,
  InviteEmpresaAdminDto,
  ConfirmEmpresaAdminInviteDto,
} from './dto/empresa-admin-auth.dto';

@Controller('empresa-admin/auth')
export class EmpresaAdminAuthController {
  constructor(private empresaAdminAuthService: EmpresaAdminAuthService) {}

  // MW-27 — 20/min por IP: cria uma Empresa+Admin novos a cada chamada (sem
  // alvo fixo pra adivinhar credencial), mesmo teto de criar Convite
  // Pendente/Domínio Autorizado — não o teto mais apertado de
  // login/forgot-password, que protegem uma conta específica contra tentativa
  // e erro.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterEmpresaAdminDto) {
    return this.empresaAdminAuthService.register(dto);
  }

  // MW-27 — mesmo teto de auth/login (10/min por IP): freia brute-force sem
  // travar o Administrador em uso legítimo.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  async login(@Body() dto: LoginEmpresaAdminDto) {
    const admin = await this.empresaAdminAuthService.validateEmpresaAdmin(
      dto.email,
      dto.password,
    );

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.empresaAdminAuthService.login(admin);
  }

  @UseGuards(EmpresaAdminJwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  // MW-27 — mesmo teto de auth/forgot-password (5/min por IP).
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordEmpresaAdminDto) {
    return this.empresaAdminAuthService.forgotPassword(dto);
  }

  // MW-27 — mesmo teto de auth/reset-password (5/min por IP).
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordEmpresaAdminDto) {
    return this.empresaAdminAuthService.resetPassword(dto);
  }

  // MW-19 — Ativação de uma Empresa existente. Público: qualquer pessoa
  // pode iniciar a ativação de uma Empresa que ainda não tem Administrador.
  // MW-27 — 20/min por IP: pode ser chamado por uma Empresa com vários
  // Colaboradores tentando ativar em sequência; sem alvo fixo pra adivinhar
  // credencial, mesmo teto de criar Convite Pendente/Domínio Autorizado.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('activate/:empresaId/request')
  async requestActivation(
    @Param('empresaId') empresaId: string,
    @Body() dto: RequestEmpresaActivationDto,
  ) {
    return this.empresaAdminAuthService.requestEmpresaActivation(
      empresaId,
      dto,
    );
  }

  // MW-27 — 10/min por IP: cria credenciais a partir de um token JWT de alta
  // entropia (não é alvo prático de força bruta), teto só um pouco mais
  // apertado que o de disparar o pedido.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('activate/confirm')
  async confirmActivation(@Body() dto: ConfirmEmpresaActivationDto) {
    return this.empresaAdminAuthService.confirmEmpresaActivation(dto);
  }

  // MW-20 — Convite de Administrador. Autenticado: só um Administrador
  // logado pode convidar outro Administrador pra mesma Empresa.
  @UseGuards(EmpresaAdminJwtAuthGuard)
  @Post('invite')
  async inviteAdmin(@Request() req, @Body() dto: InviteEmpresaAdminDto) {
    return this.empresaAdminAuthService.inviteEmpresaAdmin(req.user, dto);
  }

  // MW-27 — cria credenciais a partir de um token público, mesmo teto de
  // register/forgot-password (5/min por IP).
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('invite/confirm')
  async confirmInvite(@Body() dto: ConfirmEmpresaAdminInviteDto) {
    return this.empresaAdminAuthService.confirmEmpresaAdminInvite(dto);
  }

  // MW-26 — Desativação de Empresa. Qualquer Administrador logado desativa
  // sozinho, sem aprovação de outro admin. MW-27 — 20/min por IP: já exige
  // um JWT de Administrador válido (diferente de login/forgot-password, que
  // são alvo de força bruta sem autenticação), mesmo teto de invites/domains.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(EmpresaAdminJwtAuthGuard)
  @Post('deactivate')
  async deactivate(@Request() req) {
    return this.empresaAdminAuthService.deactivateEmpresa(req.user);
  }
}
