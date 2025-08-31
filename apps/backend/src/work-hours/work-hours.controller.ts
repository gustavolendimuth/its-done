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
import { WorkHoursService } from './work-hours.service';
import { CreateWorkHourDto } from './dto/create-work-hour.dto';
import { UpdateWorkHourDto } from './dto/update-work-hour.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('work-hours')
@UseGuards(JwtAuthGuard)
export class WorkHoursController {
  constructor(private readonly workHoursService: WorkHoursService) {}

  @Post()
  create(@Request() req, @Body() createWorkHourDto: CreateWorkHourDto) {
    return this.workHoursService.create(req.user.id, createWorkHourDto);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.workHoursService.findAll(
      req.user.id,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      clientId,
    );
  }

  @Get('total')
  getTotalHours(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.workHoursService.getTotalHours(
      req.user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('stats')
  getStats(
    @Request() req,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.workHoursService.getStats(
      req.user.id,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      clientId,
    );
  }

  @Get('available')
  getAvailableHours(
    @Request() req,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.workHoursService.findAvailable(
      req.user.id,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      clientId,
    );
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.workHoursService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateWorkHourDto: UpdateWorkHourDto,
  ) {
    return this.workHoursService.update(req.user.id, id, updateWorkHourDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.workHoursService.remove(req.user.id, id);
  }
}
