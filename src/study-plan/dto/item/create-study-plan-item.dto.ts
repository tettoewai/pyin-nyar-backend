import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateStudyPlanItemDto {
  @ApiProperty({ description: "The ID of the parent study plan" })
  @IsNotEmpty()
  @IsString()
  studyPlanId!: string;

  @ApiProperty({ description: "Optional subject scope", required: false })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty({ description: "Optional chapter scope", required: false })
  @IsOptional()
  @IsString()
  chapterId?: string;

  @ApiProperty({ description: "Optional lesson scope", required: false })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiProperty({
    description: "Display/sort order within the plan",
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  order!: number;

  @ApiProperty({
    description: "Whether the item has been completed",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiProperty({
    description: "ISO-8601 due date for the item",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({
    description: "Optional notes about the item",
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
