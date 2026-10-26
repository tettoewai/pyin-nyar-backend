import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class GoogleLoginDto {
  @ApiProperty({
    description: "Google ID token obtained from the client",
    example: "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  })
  @IsString()
  @IsNotEmpty()
  idToken!: string;

  @ApiProperty({
    description: "Google username obtained from the client",
  })
  @IsString()
  @IsOptional()
  userName?: string;
}
