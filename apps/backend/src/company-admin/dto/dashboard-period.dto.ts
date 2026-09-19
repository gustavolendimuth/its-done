import { IsDateString, IsOptional } from 'class-validator';

/**
 * MW-24 — period (from/to) accepted by the Company dashboard's aggregation
 * endpoints. Both optional: without them, the service defaults to the
 * current month (see CompanyDashboardService.resolvePeriod).
 */
export class DashboardPeriodDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
