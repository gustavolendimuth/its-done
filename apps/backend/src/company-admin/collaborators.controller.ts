import {
  Controller,
  Get,
  Delete,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CollaboratorsService } from './collaborators.service';
import { CompanyAdminJwtAuthGuard } from './guards/company-admin-jwt-auth.guard';

@UseGuards(CompanyAdminJwtAuthGuard)
@Controller('company-admin/collaborators')
export class CollaboratorsController {
  constructor(private collaboratorsService: CollaboratorsService) {}

  @Get()
  findAll(@Request() req) {
    return this.collaboratorsService.findAllForCompany(req.user.companyId);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.collaboratorsService.remove(req.user.companyId, id);
  }
}
