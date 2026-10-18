import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateLessonDto {
  @ApiProperty({ description: "The ID of the parent chapter" })
  @IsNotEmpty()
  @IsString()
  chapterId!: string;

  @ApiProperty({
    description: "The lesson name",
    example: "Velocity and speed",
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: "Display/sort order within the chapter",
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  order!: number;

  @ApiProperty({
    description: "Lesson content (markdown or plain text)",
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;
}
