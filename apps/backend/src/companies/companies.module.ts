import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { InvoicesModule } from '../invoices/invoices.module';
import { CompanyAdminModule } from '../company-admin/company-admin.module';

@Module({
  imports: [InvoicesModule, CompanyAdminModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
