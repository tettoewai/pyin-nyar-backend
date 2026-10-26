import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { Grade, KycStatus } from "../../generated/prisma/enums.js";
import { ApiProperty } from "@nestjs/swagger";

export class GetKycQueryDto {
  @ApiProperty({ description: "Search terms of kyc" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    enum: KycStatus,
    description: "KYC status filter",
    required: false,
  })
  @IsOptional()
  @IsEnum(KycStatus)
  status?: KycStatus;

  @ApiProperty({
    enum: Grade,
    description: "Grade KYC filter",
    required: false,
  })
  @IsOptional()
  @IsEnum(Grade)
  grade?: Grade;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  limit?: number = 5;
}
