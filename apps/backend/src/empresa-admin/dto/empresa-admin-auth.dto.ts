import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterEmpresaAdminDto {
  @IsString()
  @MinLength(2, { message: 'Company must be at least 2 characters long' })
  @MaxLength(100, { message: 'Company must not exceed 100 characters' })
  company: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginEmpresaAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class ForgotPasswordEmpresaAdminDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordEmpresaAdminDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

// MW-19 — Ativação de uma Empresa existente
export class RequestEmpresaActivationDto {
  // Email that will receive the confirmation link. When `domain` is not
  // provided, this must match the Empresa's registered contact email
  // (Empresa.email). When `domain` is provided, this must belong to that
  // domain instead — it does not need to match Empresa.email.
  @IsEmail()
  email: string;

  // Declared domain path: proves possession of a domain (not necessarily
  // the Empresa's registered contact email) by sending the confirmation
  // link to `email`, which must belong to this domain. This reuses the
  // same "prove you control an address in this domain" idea that Domínio
  // Autorizado (MW-22) will build on later — kept minimal here, no
  // DominioAutorizado table or persisted domain record is created.
  @IsOptional()
  @IsString()
  domain?: string;
}

export class ConfirmEmpresaActivationDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  password: string;
}

// MW-20 — Convite de Administrador
export class InviteEmpresaAdminDto {
  @IsEmail()
  email: string;
}

export class ConfirmEmpresaAdminInviteDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  password: string;
}
