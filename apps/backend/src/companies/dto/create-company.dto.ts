import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { TrimString } from '../../utils/trim-string';

export class CreateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name?: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Phone must not exceed 20 characters' })
  phone?: string;

  @TrimString()
  @IsString({ message: 'Company must be a string' })
  @IsNotEmpty({ message: 'Company is required' })
  @MinLength(2, { message: 'Company must be at least 2 characters long' })
  @MaxLength(100, { message: 'Company must not exceed 100 characters' })
  company: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;
}
