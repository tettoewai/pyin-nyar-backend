import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { KycStatus } from "../../generated/prisma/enums.js";

export class UpdateKycStatusDto {
  @ApiProperty({
    description: "KYC status you want to update.",
    required: true,
  })
  @IsEnum(KycStatus)
  status!: KycStatus;

  @ApiProperty({ description: "Why it was rejected from admin" })
  @IsOptional()
  @IsString()
  note?: string;
}
