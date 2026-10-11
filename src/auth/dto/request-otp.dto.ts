import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty } from 'class-validator';
import type { OtpPurpose } from '../otp.service.js';

export class RequestOtpDto {
  @ApiProperty({ description: 'A valid email to request an OTP' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: "OTP purpose 'signup' | 'reset-password'",
    enum: ['signup', 'reset-password'],
    default: 'signup',
  })
  @IsIn(['signup', 'reset-password'])
  @IsNotEmpty()
  purpose!: OtpPurpose;
}
