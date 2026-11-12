import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from "class-validator";

export class ReorderLessonsDto {
  @ApiProperty({ description: "The ID of the parent chapter" })
  @IsNotEmpty()
  @IsString()
  chapterId!: string;

  @ApiProperty({
    description: "Lesson IDs in their new display order",
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];
}
