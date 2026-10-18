import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class CreateMasteryScoreDto {
  @ApiProperty({ description: "The ID of the user the score belongs to" })
  @IsNotEmpty()
  @IsString()
  userId!: string;

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
    description: "Mastery score between 0 and 1",
    minimum: 0,
    maximum: 1,
    example: 0.75,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  score!: number;

  @ApiProperty({
    description: "Number of attempts used to compute the score",
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  attempts?: number;
}
