import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ChapterQueryDto {
  @ApiPropertyOptional({ description: "Filter chapters by subject ID" })
  @IsOptional()
  @IsString()
  subjectId?: string;
}
