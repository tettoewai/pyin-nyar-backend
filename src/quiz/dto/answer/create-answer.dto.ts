import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateAnswerDto {
  @ApiProperty({ description: "The ID of the quiz attempt" })
  @IsNotEmpty()
  @IsString()
  attemptId!: string;

  @ApiProperty({ description: "The ID of the answered question" })
  @IsNotEmpty()
  @IsString()
  questionId!: string;

  @ApiProperty({
    description: "The user who submitted the answer",
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: "The answer submitted by the user" })
  @IsNotEmpty()
  @IsString()
  userAnswer!: string;

  @ApiProperty({ description: "Whether the answer is correct" })
  @IsBoolean()
  isCorrect!: boolean;

  @ApiProperty({
    description: "Time spent on the question in seconds",
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentSec?: number;
}
