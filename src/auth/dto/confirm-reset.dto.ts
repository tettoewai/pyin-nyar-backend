import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ConfirmResetDto {
  @ApiProperty({
    description: "The short-lived reset token returned by the verify step",
  })
  @IsString()
  @IsNotEmpty()
  resetToken!: string;

  @ApiProperty({
    description: "The new password for the account",
    example: "newSecret123",
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    description: "Confirmation of the new password",
    example: "newSecret123",
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  confirmPassword!: string;
}
