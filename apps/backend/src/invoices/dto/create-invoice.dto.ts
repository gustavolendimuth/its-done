import {
  IsString,
  IsUUID,
  IsNumber,
  Min,
  IsArray,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsArray()
  @IsUUID(4, { each: true })
  workHourIds: string[];

  @IsUUID()
  clientId: string;

  @IsString()
  @IsOptional()
  number?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['PENDING', 'PAID', 'CANCELED'])
  @IsOptional()
  status?: string;
}
