import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class MoveChapterDto {
  @ApiProperty({ description: "The ID of the parent subject" })
  @IsNotEmpty()
  @IsString()
  subjectId!: string;

  @ApiProperty({
    description: "Chapter ID that you want to reorder",
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    description:
      "The ID of the chapter that you want to place the reordered chapter before",
  })
  @IsNotEmpty()
  @IsString()
  beforeId: string;
}
