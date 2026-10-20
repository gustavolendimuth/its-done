import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PendingInvitesService } from './pending-invites.service';
import { CompanyAdminJwtAuthGuard } from './guards/company-admin-jwt-auth.guard';
import { CreatePendingInviteDto } from './dto/pending-invite.dto';

@UseGuards(CompanyAdminJwtAuthGuard)
@Controller('company-admin/invites')
export class PendingInvitesController {
  constructor(private pendingInvitesService: PendingInvitesService) {}

  // MW-27 — 20 creations/min per IP: stricter than the global cap, still
  // loose enough for an Admin to invite a whole team at once.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post()
  create(@Request() req, @Body() dto: CreatePendingInviteDto) {
    return this.pendingInvitesService.create(
      req.user.companyId,
      req.user.id,
      dto.email,
    );
  }

  @Get()
  findAll(@Request() req) {
    return this.pendingInvitesService.findAll(req.user.companyId);
  }

  @Delete(':id')
  revoke(@Request() req, @Param('id') id: string) {
    return this.pendingInvitesService.revoke(req.user.companyId, id);
  }
}
