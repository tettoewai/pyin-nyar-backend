import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class VerifyResetDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  otp!: string;
}
