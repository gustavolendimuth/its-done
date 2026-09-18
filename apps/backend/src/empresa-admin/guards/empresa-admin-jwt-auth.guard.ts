import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class EmpresaAdminJwtAuthGuard extends AuthGuard('empresa-admin-jwt') {}
