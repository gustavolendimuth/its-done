import { Controller, Get, Param } from '@nestjs/common';
import { InvoicesService } from './invoices.service';

@Controller('public/client/:clientId/invoices')
export class PublicInvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async findByClient(@Param('clientId') clientId: string) {
    return this.invoicesService.findByClient(clientId);
  }
}
