import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { EmpresaAdminAuthService } from './empresa-admin-auth.service';
import { EmpresaAdminJwtAuthGuard } from './guards/empresa-admin-jwt-auth.guard';
import {
  RegisterEmpresaAdminDto,
  LoginEmpresaAdminDto,
  ForgotPasswordEmpresaAdminDto,
  ResetPasswordEmpresaAdminDto,
} from './dto/empresa-admin-auth.dto';

@Controller('empresa-admin/auth')
export class EmpresaAdminAuthController {
  constructor(private empresaAdminAuthService: EmpresaAdminAuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterEmpresaAdminDto) {
    return this.empresaAdminAuthService.register(dto);
  }

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

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordEmpresaAdminDto) {
    return this.empresaAdminAuthService.forgotPassword(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordEmpresaAdminDto) {
    return this.empresaAdminAuthService.resetPassword(dto);
  }
}
