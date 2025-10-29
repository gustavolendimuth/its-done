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
} from '@nestjs/common';
import { InAppNotificationsService } from './in-app-notifications.service';
import { CreateInAppNotificationDto } from './dto/create-notification.dto';
import { UpdateInAppNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class InAppNotificationsController {
  constructor(
    private readonly inAppNotificationsService: InAppNotificationsService,
  ) {}

  @Post()
  create(@Request() req, @Body() createDto: CreateInAppNotificationDto) {
    return this.inAppNotificationsService.create(req.user.id, createDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.inAppNotificationsService.findAll(req.user.id);
  }

  @Get('unread')
  findUnread(@Request() req) {
    return this.inAppNotificationsService.findUnread(req.user.id);
  }

  @Get('unread/count')
  countUnread(@Request() req) {
    return this.inAppNotificationsService.countUnread(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.inAppNotificationsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateDto: UpdateInAppNotificationDto,
  ) {
    return this.inAppNotificationsService.update(id, req.user.id, updateDto);
  }

  @Post(':id/mark-as-read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.inAppNotificationsService.markAsRead(id, req.user.id);
  }

  @Post('mark-all-as-read')
  markAllAsRead(@Request() req) {
    return this.inAppNotificationsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.inAppNotificationsService.remove(id, req.user.id);
  }

  @Delete()
  removeAll(@Request() req) {
    return this.inAppNotificationsService.removeAll(req.user.id);
  }
}
