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
import { ConvitesPendentesService } from './convites-pendentes.service';
import { EmpresaAdminJwtAuthGuard } from './guards/empresa-admin-jwt-auth.guard';
import { CreateConvitePendenteDto } from './dto/convite-pendente.dto';

@UseGuards(EmpresaAdminJwtAuthGuard)
@Controller('empresa-admin/invites')
export class ConvitesPendentesController {
  constructor(private convitesPendentesService: ConvitesPendentesService) {}

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
