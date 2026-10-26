import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from "class-validator";
import { Gender, Grade, KycDocType } from "../../generated/prisma/enums.js";

export class CreateStudentKycDto {
  @ApiProperty({ enum: Grade, description: "The student's current grade" })
  @IsEnum(Grade)
  @IsNotEmpty()
  grade!: Grade;

  @ApiProperty({ description: "The student's full name", example: "Aung Aung" })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiProperty({
    description: "ISO-8601 date of birth",
    example: "2010-05-20",
  })
  @IsNotEmpty()
  @IsDateString()
  dateOfBirth!: string;

  @ApiProperty({ enum: Gender, description: "The student's gender" })
  @IsEnum(Gender)
  @IsNotEmpty()
  gender!: Gender;

  @ApiProperty({
    enum: KycDocType,
    description: "Type of KYC document provided",
  })
  @IsEnum(KycDocType)
  @IsNotEmpty()
  docType!: KycDocType;

  @ApiProperty({
    description: "Document number (stored encrypted)",
    example: "12/AhGaNa(N)123456",
  })
  @IsNotEmpty()
  @IsString()
  docNumber!: string;

  @ApiProperty({ description: "School name (stored encrypted)" })
  @IsNotEmpty()
  @IsString()
  school!: string;

  @ApiProperty({ description: "Region (stored encrypted)" })
  @IsNotEmpty()
  @IsString()
  region!: string;

  @ApiProperty({
    description: "Guardian phone number (stored encrypted)",
    example: "09987654321",
  })
  @IsNotEmpty()
  @IsString()
  guardianPhone!: string;

  @ApiProperty({
    description: "Codes of the subjects the student prefers",
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  preferredSubjects!: string[];
}
