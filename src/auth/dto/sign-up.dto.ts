import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({ description: 'A valid email to create an account' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Password for the new account' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Confirm password for the new account' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  confirmPassword: string;

  @ApiProperty({ description: 'One-Time Password for email verification' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  otp: string;
}
