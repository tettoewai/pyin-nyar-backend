import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class VerifyResetDto {
  @ApiProperty({
    description: "The email address that requested the password reset",
    example: "student@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: "The one-time password sent to the email",
    example: "123456",
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  otp!: string;
}
