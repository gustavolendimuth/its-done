import { IsDateString, IsOptional } from 'class-validator';

/**
 * MW-24 — período (from/to) aceito pelos endpoints de agregação do Dashboard
 * da Empresa. Ambos opcionais: sem eles, o service usa o mês corrente como
 * default (ver EmpresaDashboardService.resolvePeriod).
 */
export class DashboardPeriodDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
