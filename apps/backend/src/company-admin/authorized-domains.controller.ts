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
import { AuthorizedDomainsService } from './authorized-domains.service';
import { CompanyAdminJwtAuthGuard } from './guards/company-admin-jwt-auth.guard';
import {
  CreateAuthorizedDomainDto,
  ConfirmAuthorizedDomainDto,
} from './dto/authorized-domain.dto';

@Controller('company-admin/domains')
export class AuthorizedDomainsController {
  constructor(
    private authorizedDomainsService: AuthorizedDomainsService,
  ) {}

  // MW-27 — 20 creations/min per IP: same slack as invites, stricter than
  // the global cap.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(CompanyAdminJwtAuthGuard)
  @Post()
  create(@Request() req, @Body() dto: CreateAuthorizedDomainDto) {
    return this.authorizedDomainsService.create(
      req.user.companyId,
      dto.domain,
    );
  }

  @UseGuards(CompanyAdminJwtAuthGuard)
  @Get()
  findAll(@Request() req) {
    return this.authorizedDomainsService.findAll(req.user.companyId);
  }

  // MW-27 — 10/min per IP: fires a confirmation email, low limit avoids
  // spamming the admin's own inbox.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(CompanyAdminJwtAuthGuard)
  @Post(':id/confirm')
  requestConfirmation(@Request() req, @Param('id') id: string) {
    return this.authorizedDomainsService.requestConfirmation(
      req.user.companyId,
      id,
      req.user.email,
    );
  }

  // MW-27 — 10/min per IP: public route, low limit reduces brute force
  // against the confirmation token.
  // Public: the confirmation token itself proves who is confirming.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('confirm')
  confirm(@Body() dto: ConfirmAuthorizedDomainDto) {
    return this.authorizedDomainsService.confirm(dto.token);
  }

  @UseGuards(CompanyAdminJwtAuthGuard)
  @Delete(':id')
  revoke(@Request() req, @Param('id') id: string) {
    return this.authorizedDomainsService.revoke(req.user.companyId, id);
  }
}
