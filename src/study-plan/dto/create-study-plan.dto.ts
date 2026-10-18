import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { StudyPlanStatus } from "../../generated/prisma/enums.js";

export class CreateStudyPlanDto {
  @ApiProperty({ description: "The ID of the user who owns the plan" })
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @ApiProperty({
    description: "The study plan title",
    example: "Physics revision",
  })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({
    enum: StudyPlanStatus,
    description: "Current status of the plan",
    default: StudyPlanStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(StudyPlanStatus)
  status?: StudyPlanStatus;

  @ApiProperty({
    description: "ISO-8601 start date of the plan",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: "ISO-8601 end date of the plan",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
