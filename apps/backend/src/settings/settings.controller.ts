import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingsDto } from './dto/create-settings.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  create(@Request() req, @Body() createSettingsDto: CreateSettingsDto) {
    return this.settingsService.create(req.user.id, createSettingsDto);
  }

  @Get()
  findOne(@Request() req) {
    return this.settingsService.findByUserId(req.user.id);
  }

  @Patch()
  update(@Request() req, @Body() updateSettingsDto: UpdateSettingsDto) {
    return this.settingsService.update(req.user.id, updateSettingsDto);
  }

  @Delete()
  remove(@Request() req) {
    return this.settingsService.remove(req.user.id);
  }
}
