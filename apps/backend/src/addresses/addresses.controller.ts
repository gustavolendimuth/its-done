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
  Query,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  create(@Request() req, @Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.create(req.user.userId, createAddressDto);
  }

  @Get()
  findAll(@Request() req, @Query('clientId') clientId?: string) {
    return this.addressesService.findAll(req.user.userId, clientId);
  }

  @Get('client/:clientId')
  findByClient(@Request() req, @Param('clientId') clientId: string) {
    return this.addressesService.findByClient(req.user.userId, clientId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.addressesService.findOne(req.user.userId, id);
  }

  @Patch(':id/set-primary')
  setPrimary(@Request() req, @Param('id') id: string) {
    return this.addressesService.setPrimary(req.user.userId, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressesService.update(req.user.userId, id, updateAddressDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.addressesService.remove(req.user.userId, id);
  }
}
