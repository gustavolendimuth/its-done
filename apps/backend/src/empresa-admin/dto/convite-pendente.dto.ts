import { IsEmail } from 'class-validator';

export class CreateConvitePendenteDto {
  @IsEmail()
  email: string;
}
