import { IsString, MinLength } from 'class-validator';

export class CreateDominioAutorizadoDto {
  @IsString()
  @MinLength(3)
  domain: string;
}

export class ConfirmDominioAutorizadoDto {
  @IsString()
  token: string;
}
