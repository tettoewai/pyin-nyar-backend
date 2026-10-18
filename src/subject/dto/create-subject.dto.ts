import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { Grade } from "../../generated/prisma/enums.js";

export class CreateSubjectDto {
  @ApiProperty({ description: "The subject name", example: "Physics" })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ description: "The subject code", example: "PHY-11" })
  @IsString()
  code!: string;

  @ApiProperty({ enum: Grade, description: "The grade the subject targets" })
  @IsEnum(Grade)
  grade!: Grade;
}
