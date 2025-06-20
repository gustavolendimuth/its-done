import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsEnum(['PENDING', 'PAID', 'CANCELED'])
  status?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
