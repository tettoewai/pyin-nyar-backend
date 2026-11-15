import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { Grade } from "@/generated/prisma/enums.js";

export class CurriculumQueryDto {
  @ApiPropertyOptional({
    enum: Grade,
    description: "Only return curriculum for this grade",
  })
  @IsOptional()
  @IsEnum(Grade)
  grade?: Grade;
}
