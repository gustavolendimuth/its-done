import { Controller, Get, Query, Request, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { EmpresaDashboardService } from './empresa-dashboard.service';
import { EmpresaAdminJwtAuthGuard } from './guards/empresa-admin-jwt-auth.guard';
import { DashboardPeriodDto } from './dto/dashboard-period.dto';

/**
 * MW-24 — Dashboard da Empresa. Todas as rotas escopadas a
 * req.user.empresaId (o Administrador logado), nunca a um empresaId vindo
 * do cliente. Só leitura/exportação — sem edição.
 */
@UseGuards(EmpresaAdminJwtAuthGuard)
@Controller('empresa-admin/dashboard')
export class EmpresaDashboardController {
  constructor(private empresaDashboardService: EmpresaDashboardService) {}

  @Get('overview')
  overview(@Request() req, @Query() query: DashboardPeriodDto) {
    return this.empresaDashboardService.getOverview(
      req.user.empresaId,
      query.from,
      query.to,
    );
  }

  @Get('colaboradores')
  colaboradores(@Request() req, @Query() query: DashboardPeriodDto) {
    return this.empresaDashboardService.getColaboradoresTable(
      req.user.empresaId,
      query.from,
      query.to,
    );
  }

  @Get('export')
  async export(
    @Request() req,
    @Query() query: DashboardPeriodDto,
    @Res() res: Response,
  ) {
    const csv = await this.empresaDashboardService.exportCsv(
      req.user.empresaId,
      query.from,
      query.to,
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="empresa-dashboard.csv"',
    );
    res.send(csv);
  }
}
