import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({
    description: "The email address of the account",
    example: "student@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: "The account password",
    example: "secret123",
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
