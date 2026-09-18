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
import { ConvitesPendentesService } from './convites-pendentes.service';
import { EmpresaAdminJwtAuthGuard } from './guards/empresa-admin-jwt-auth.guard';
import { CreateConvitePendenteDto } from './dto/convite-pendente.dto';

@UseGuards(EmpresaAdminJwtAuthGuard)
@Controller('empresa-admin/invites')
export class ConvitesPendentesController {
  constructor(private convitesPendentesService: ConvitesPendentesService) {}

  // MW-27 — 20 criações/min por IP: mais restritivo que o teto global,
  // ainda folgado pra um Administrador convidar um time inteiro de uma vez.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post()
  create(@Request() req, @Body() dto: CreateConvitePendenteDto) {
    return this.convitesPendentesService.create(
      req.user.empresaId,
      req.user.id,
      dto.email,
    );
  }

  @Get()
  findAll(@Request() req) {
    return this.convitesPendentesService.findAll(req.user.empresaId);
  }

  @Delete(':id')
  revoke(@Request() req, @Param('id') id: string) {
    return this.convitesPendentesService.revoke(req.user.empresaId, id);
  }
}
