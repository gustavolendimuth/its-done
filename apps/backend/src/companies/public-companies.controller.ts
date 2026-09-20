import { Controller, Get, Param } from '@nestjs/common';
import { CompaniesService } from './companies.service';

// No auth guard, same as PublicInvoicesController.
@Controller('public/company/:companyId')
export class PublicCompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('activation-status')
  getActivationStatus(@Param('companyId') companyId: string) {
    return this.companiesService.getActivationStatus(companyId);
  }
}
