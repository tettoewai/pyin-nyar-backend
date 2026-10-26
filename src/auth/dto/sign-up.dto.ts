import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class SignupDto {
  @ApiProperty({
    description: "A valid email to create an account",
    example: "student@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: "Username for the new account",
    minLength: 3,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  userName!: string;

  @ApiProperty({
    description: "Password for the new account",
    example: "secret123",
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    description: "Confirm password for the new account",
    example: "secret123",
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  confirmPassword!: string;

  @ApiProperty({
    description: "One-Time Password for email verification",
    example: "123456",
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  otp!: string;
}
