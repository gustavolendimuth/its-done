import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvoicesService } from '../invoices/invoices.service';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly invoicesService: InvoicesService,
  ) {}

  @Post()
  create(@Request() req, @Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(req.user.id, createCompanyDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.companiesService.findAll(req.user.id);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.companiesService.getStats(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.companiesService.findOne(req.user.id, id);
  }

  @Get(':id/stats')
  getClientStats(@Request() req, @Param('id') id: string) {
    return this.companiesService.getClientStats(req.user.id, id);
  }

  @Get(':id/invoices')
  async getClientInvoices(@Request() req, @Param('id') companyId: string) {
    try {
      // Verify company belongs to user first
      const company = await this.companiesService.findOne(
        req.user.id,
        companyId,
      );
      if (!company) {
        throw new NotFoundException(`Client with id ${companyId} not found`);
      }

      // Return invoices for this company
      const invoices = await this.invoicesService.findByClient(companyId);
      return invoices;
    } catch (error) {
      // Log the error for debugging
      console.error(
        `Error fetching invoices for company ${companyId}:`,
        error.message,
      );
      throw error;
    }
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(req.user.id, id, updateCompanyDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.companiesService.remove(req.user.id, id);
  }

  @Delete(':id/collaborator')
  removeCollaborator(@Request() req, @Param('id') id: string) {
    return this.companiesService.removeCollaborator(req.user.id, id);
  }

  @Get('debug/all')
  async debugGetAllCompanies(@Request() req) {
    try {
      const companies = await this.companiesService.findAll(req.user.id);
      return {
        userId: req.user.id,
        clientCount: companies.length,
        clients: companies.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
        })),
      };
    } catch (error) {
      console.error('Debug endpoint error:', error);
      throw error;
    }
  }
}
