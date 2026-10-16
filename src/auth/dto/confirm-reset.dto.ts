import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ConfrimResetDto {
  @IsString()
  @IsNotEmpty()
  resetToken!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  confirmPassword!: string;
}
