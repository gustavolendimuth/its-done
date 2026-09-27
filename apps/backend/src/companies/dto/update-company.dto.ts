import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { TrimString } from '../../utils/trim-string';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Phone must not exceed 20 characters' })
  phone?: string;

  // Partial update: the key may be omitted, but when present it must be a
  // non-blank string. `null` is rejected (Company.company is NOT NULL), which
  // is why this uses ValidateIf instead of IsOptional (IsOptional skips null).
  @ValidateIf((_object, value) => value !== undefined)
  @TrimString()
  @IsString({ message: 'Company must be a string' })
  @IsNotEmpty({ message: 'Company is required' })
  @MinLength(2, { message: 'Company must be at least 2 characters long' })
  @MaxLength(100, { message: 'Company must not exceed 100 characters' })
  company?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;
}
