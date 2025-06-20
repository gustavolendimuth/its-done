import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'Street is required' })
  @MinLength(5, { message: 'Street must be at least 5 characters long' })
  @MaxLength(200, { message: 'Street must not exceed 200 characters' })
  street: string;

  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  @MinLength(2, { message: 'City must be at least 2 characters long' })
  @MaxLength(100, { message: 'City must not exceed 100 characters' })
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'State is required' })
  @MinLength(2, { message: 'State must be at least 2 characters long' })
  @MaxLength(50, { message: 'State must not exceed 50 characters' })
  state: string;

  @IsString()
  @IsNotEmpty({ message: 'ZIP code is required' })
  @MinLength(5, { message: 'ZIP code must be at least 5 characters long' })
  @MaxLength(20, { message: 'ZIP code must not exceed 20 characters' })
  zipCode: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Country must not exceed 100 characters' })
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Type must not exceed 50 characters' })
  type?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsString()
  @IsNotEmpty({ message: 'Client ID is required' })
  clientId: string;
}
