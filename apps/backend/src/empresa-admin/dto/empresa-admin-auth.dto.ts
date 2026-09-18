import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

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
