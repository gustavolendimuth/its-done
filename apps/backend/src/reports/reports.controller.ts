import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ReportsService, ReportFilters } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('hours')
  async getHoursReport(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('clientId') clientId?: string,
  ) {
    const filters: ReportFilters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      clientId: clientId || undefined,
    };

    return this.reportsService.generateHoursReport(req.user.userId, filters);
  }

  @Get('invoices')
  async getInvoiceReport(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('clientId') clientId?: string,
  ) {
    const filters: ReportFilters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      clientId: clientId || undefined,
    };

    return this.reportsService.generateInvoiceReport(req.user.userId, filters);
  }

  @Get('summary')
  async getSummaryReport(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: ReportFilters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const [hoursReport, invoiceReport] = await Promise.all([
      this.reportsService.generateHoursReport(req.user.userId, filters),
      this.reportsService.generateInvoiceReport(req.user.userId, filters),
    ]);

    return {
      hours: hoursReport,
      invoices: invoiceReport,
      period: {
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
    };
  }
}
