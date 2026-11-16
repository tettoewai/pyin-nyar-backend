import { MasteryScope } from "@/generated/prisma/enums.js";
import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  isEnum,
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

  @ApiProperty({
    description: "Mastery scope",
    required: true,
    enum: MasteryScope,
  })
  @IsNotEmpty()
  @IsEnum(MasteryScope)
  masteryScope!: MasteryScope;

  @ApiProperty({
    description: "Scope ID for the mastery scope",
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  scopeId!: string;

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
