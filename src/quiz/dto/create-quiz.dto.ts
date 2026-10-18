import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Difficulty } from "../../generated/prisma/enums.js";

export class CreateQuizDto {
  @ApiProperty({
    description: "The owner of the quiz (omit for system/template quizzes)",
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: "The quiz title", example: "Forces and motion" })
  @IsNotEmpty()
  @IsString()
  title!: string;

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
    enum: Difficulty,
    description: "Quiz difficulty",
    default: Difficulty.MEDIUM,
    required: false,
  })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiProperty({
    description: "Upload used as the source for generated questions",
    required: false,
  })
  @IsOptional()
  @IsString()
  sourceUploadId?: string;
}
