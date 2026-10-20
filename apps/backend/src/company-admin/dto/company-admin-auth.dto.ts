import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { TrimString } from '../../utils/trim-string';

export class RegisterCompanyAdminDto {
  @TrimString()
  @IsString({ message: 'Company must be a string' })
  @IsNotEmpty({ message: 'Company is required' })
  @MinLength(2, { message: 'Company must be at least 2 characters long' })
  @MaxLength(100, { message: 'Company must not exceed 100 characters' })
  company: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginCompanyAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class ForgotPasswordCompanyAdminDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordCompanyAdminDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

// MW-19 — Ativação de uma Company existente
export class RequestCompanyActivationDto {
  // Email that will receive the confirmation link. When `domain` is not
  // provided, this must match the Company's registered contact email
  // (Company.email). When `domain` is provided, this must belong to that
  // domain instead — it does not need to match Company.email.
  @IsEmail()
  email: string;

  // Declared domain path: proves possession of a domain (not necessarily
  // the Company's registered contact email) by sending the confirmation
  // link to `email`, which must belong to this domain. This reuses the
  // same "prove you control an address in this domain" idea that Domínio
  // Autorizado (MW-22) will build on later — kept minimal here, no
  // AuthorizedDomain table or persisted domain record is created.
  @IsOptional()
  @IsString()
  domain?: string;
}

export class ConfirmCompanyActivationDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  password: string;
}

// MW-20 — Admin invite
export class InviteCompanyAdminDto {
  @IsEmail()
  email: string;
}

export class ConfirmCompanyAdminInviteDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  password: string;
}
