import { Controller, Get, Param } from '@nestjs/common';
import { InvoicesService } from './invoices.service';

@Controller('public/company/:companyId/invoices')
export class PublicInvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async findByClient(@Param('companyId') companyId: string) {
    return this.invoicesService.findByClient(companyId);
  }
}
