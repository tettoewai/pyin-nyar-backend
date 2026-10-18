import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class CreateChapterDto {
  @ApiProperty({ description: "The ID of the parent subject" })
  @IsNotEmpty()
  @IsString()
  subjectId!: string;

  @ApiProperty({ description: "The chapter name", example: "Kinematics" })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: "Display/sort order within the subject",
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  order!: number;
}
