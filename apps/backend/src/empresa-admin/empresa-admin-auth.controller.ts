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

  @Post('invite/confirm')
  async confirmInvite(@Body() dto: ConfirmEmpresaAdminInviteDto) {
    return this.empresaAdminAuthService.confirmEmpresaAdminInvite(dto);
  }
}
