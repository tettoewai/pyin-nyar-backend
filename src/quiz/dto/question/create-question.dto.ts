import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { QuestionType } from "../../../generated/prisma/enums.js";

export class CreateQuestionDto {
  @ApiProperty({ description: "The ID of the quiz this question belongs to" })
  @IsNotEmpty()
  @IsString()
  quizId!: string;

  @ApiProperty({ enum: QuestionType, description: "The question type" })
  @IsEnum(QuestionType)
  type!: QuestionType;

  @ApiProperty({ description: "The question prompt" })
  @IsNotEmpty()
  @IsString()
  question!: string;

  @ApiProperty({
    description: 'Selectable options, e.g. [{ "id": "A", "text": "..." }]',
    type: "array",
    items: { type: "object" },
    required: false,
  })
  @IsOptional()
  @IsArray()
  options?: Record<string, unknown>[];

  @ApiProperty({ description: "The correct answer" })
  @IsNotEmpty()
  @IsString()
  answer!: string;

  @ApiProperty({
    description: "Optional explanation for the answer",
    required: false,
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({
    description: "Display/sort order within the quiz",
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  order!: number;

  @ApiProperty({
    description: "Points awarded for a correct answer",
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;
}
