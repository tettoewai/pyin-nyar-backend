import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { AttemptStatus } from "../../../generated/prisma/enums.js";

export class CreateQuizAttemptDto {
  @ApiProperty({ description: "The ID of the user taking the quiz" })
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @ApiProperty({ description: "The ID of the quiz being attempted" })
  @IsNotEmpty()
  @IsString()
  quizId!: string;

  @ApiProperty({
    enum: AttemptStatus,
    description: "Attempt status",
    default: AttemptStatus.IN_PROGRESS,
    required: false,
  })
  @IsOptional()
  @IsEnum(AttemptStatus)
  status?: AttemptStatus;

  @ApiProperty({
    description: "Score achieved for the attempt",
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  score?: number;
}
