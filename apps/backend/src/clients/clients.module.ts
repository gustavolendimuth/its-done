import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { InvoicesModule } from '../invoices/invoices.module';
import { EmpresaAdminModule } from '../empresa-admin/empresa-admin.module';

@Module({
  imports: [InvoicesModule, EmpresaAdminModule],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
