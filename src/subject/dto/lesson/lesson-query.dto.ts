import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class LessonQueryDto {
  @ApiPropertyOptional({ description: "Filter lessons by chapter ID" })
  @IsOptional()
  @IsString()
  chapterId?: string;
}
