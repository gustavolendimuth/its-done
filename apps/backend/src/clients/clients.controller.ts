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
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvoicesService } from '../invoices/invoices.service';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly invoicesService: InvoicesService,
  ) {}

  @Post()
  create(@Request() req, @Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(req.user.userId, createClientDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.clientsService.findAll(req.user.userId);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.clientsService.getStats(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.clientsService.findOne(req.user.userId, id);
  }

  @Get(':id/stats')
  getClientStats(@Request() req, @Param('id') id: string) {
    return this.clientsService.getClientStats(req.user.userId, id);
  }

  @Get(':id/invoices')
  async getClientInvoices(@Request() req, @Param('id') clientId: string) {
    try {
      // Verify client belongs to user first
      const client = await this.clientsService.findOne(
        req.user.userId,
        clientId,
      );
      if (!client) {
        throw new NotFoundException(`Client with id ${clientId} not found`);
      }

      // Return invoices for this client
      const invoices = await this.invoicesService.findByClient(clientId);
      return invoices;
    } catch (error) {
      // Log the error for debugging
      console.error(
        `Error fetching invoices for client ${clientId}:`,
        error.message,
      );
      throw error;
    }
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(req.user.userId, id, updateClientDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.clientsService.remove(req.user.userId, id);
  }

  @Get('debug/all')
  async debugGetAllClients(@Request() req) {
    try {
      const clients = await this.clientsService.findAll(req.user.userId);
      return {
        userId: req.user.userId,
        clientCount: clients.length,
        clients: clients.map((c) => ({
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
