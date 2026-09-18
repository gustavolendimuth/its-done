import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DominiosAutorizadosService } from './dominios-autorizados.service';
import { EmpresaAdminJwtAuthGuard } from './guards/empresa-admin-jwt-auth.guard';
import {
  CreateDominioAutorizadoDto,
  ConfirmDominioAutorizadoDto,
} from './dto/dominio-autorizado.dto';

@Controller('empresa-admin/domains')
export class DominiosAutorizadosController {
  constructor(
    private dominiosAutorizadosService: DominiosAutorizadosService,
  ) {}

  // MW-27 — 20 criações/min por IP: mesma folga de invites, mais restritivo
  // que o teto global.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(EmpresaAdminJwtAuthGuard)
  @Post()
  create(@Request() req, @Body() dto: CreateDominioAutorizadoDto) {
    return this.dominiosAutorizadosService.create(
      req.user.empresaId,
      dto.domain,
    );
  }

  @UseGuards(EmpresaAdminJwtAuthGuard)
  @Get()
  findAll(@Request() req) {
    return this.dominiosAutorizadosService.findAll(req.user.empresaId);
  }

  // MW-27 — 10/min por IP: dispara email de confirmação, limite baixo evita
  // spam de envio pro próprio Administrador.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(EmpresaAdminJwtAuthGuard)
  @Post(':id/confirm')
  requestConfirmation(@Request() req, @Param('id') id: string) {
    return this.dominiosAutorizadosService.requestConfirmation(
      req.user.empresaId,
      id,
      req.user.email,
    );
  }

  // MW-27 — 10/min por IP: rota pública, limite baixo reduz força bruta
  // contra o token de confirmação.
  // Public: the confirmation token itself proves who is confirming.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('confirm')
  confirm(@Body() dto: ConfirmDominioAutorizadoDto) {
    return this.dominiosAutorizadosService.confirm(dto.token);
  }

  @UseGuards(EmpresaAdminJwtAuthGuard)
  @Delete(':id')
  revoke(@Request() req, @Param('id') id: string) {
    return this.dominiosAutorizadosService.revoke(req.user.empresaId, id);
  }
}
