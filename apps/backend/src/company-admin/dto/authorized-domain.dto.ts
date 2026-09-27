import { IsString, MinLength } from 'class-validator';

export class CreateAuthorizedDomainDto {
  @IsString()
  @MinLength(3)
  domain: string;
}

export class ConfirmAuthorizedDomainDto {
  @IsString()
  token: string;
}
