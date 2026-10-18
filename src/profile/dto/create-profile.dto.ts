import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateProfileDto {
  @ApiProperty({ description: "The ID of the user the profile belongs to" })
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @ApiProperty({
    description: "Target exam the student is preparing for",
    example: "Matriculation",
    required: false,
  })
  @IsOptional()
  @IsString()
  targetExam?: string;

  @ApiProperty({
    description: "Free-form study goal",
    example: "Study 2 hours every day",
    required: false,
  })
  @IsOptional()
  @IsString()
  studyGoal?: string;

  @ApiProperty({
    description: "Daily XP goal",
    minimum: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  dailyGoalXp?: number;

  @ApiProperty({
    description: "Current streak in days",
    minimum: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  streakDays?: number;

  @ApiProperty({
    description: "ISO-8601 timestamp of the last activity",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  lastActiveAt?: string;
}
