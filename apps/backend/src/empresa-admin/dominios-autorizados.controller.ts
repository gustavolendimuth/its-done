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

  @UseGuards(EmpresaAdminJwtAuthGuard)
  @Post(':id/confirm')
  requestConfirmation(@Request() req, @Param('id') id: string) {
    return this.dominiosAutorizadosService.requestConfirmation(
      req.user.empresaId,
      id,
      req.user.email,
    );
  }

  // Public: the confirmation token itself proves who is confirming.
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
