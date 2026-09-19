import {
  Controller,
  Get,
  Delete,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ColaboradoresService } from './colaboradores.service';
import { EmpresaAdminJwtAuthGuard } from './guards/empresa-admin-jwt-auth.guard';

@UseGuards(EmpresaAdminJwtAuthGuard)
@Controller('empresa-admin/colaboradores')
export class ColaboradoresController {
  constructor(private colaboradoresService: ColaboradoresService) {}

  @Get()
  findAll(@Request() req) {
    return this.colaboradoresService.findAllForEmpresa(req.user.empresaId);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.colaboradoresService.remove(req.user.empresaId, id);
  }
}
