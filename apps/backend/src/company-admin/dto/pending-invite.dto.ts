import { IsEmail } from 'class-validator';

export class CreatePendingInviteDto {
  @IsEmail()
  email: string;
}
