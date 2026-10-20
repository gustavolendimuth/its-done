import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CompanyAdminJwtAuthGuard extends AuthGuard('company-admin-jwt') {}
