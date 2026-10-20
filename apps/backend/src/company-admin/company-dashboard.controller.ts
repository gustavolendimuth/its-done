import {
  Controller,
  Get,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CompanyDashboardService } from './company-dashboard.service';
import { CompanyAdminJwtAuthGuard } from './guards/company-admin-jwt-auth.guard';
import { DashboardPeriodDto } from './dto/dashboard-period.dto';

/**
 * MW-24 — Company dashboard. All routes are scoped to req.user.companyId
 * (the logged-in Admin), never to a companyId coming from the client.
 * Read/export only — no editing.
 */
@UseGuards(CompanyAdminJwtAuthGuard)
@Controller('company-admin/dashboard')
export class CompanyDashboardController {
  constructor(private companyDashboardService: CompanyDashboardService) {}

  @Get('overview')
  overview(@Request() req, @Query() query: DashboardPeriodDto) {
    return this.companyDashboardService.getOverview(
      req.user.companyId,
      query.from,
      query.to,
    );
  }

  @Get('collaborators')
  collaborators(@Request() req, @Query() query: DashboardPeriodDto) {
    return this.companyDashboardService.getCollaboratorsTable(
      req.user.companyId,
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
    const csv = await this.companyDashboardService.exportCsv(
      req.user.companyId,
      query.from,
      query.to,
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="company-dashboard.csv"',
    );
    res.send(csv);
  }
}
