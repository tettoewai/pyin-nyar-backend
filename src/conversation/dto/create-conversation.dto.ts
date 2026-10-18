import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Language } from "../../generated/prisma/enums.js";

export class CreateConversationDto {
  @ApiProperty({
    description: "The ID of the user who owns the conversation",
    example: "clx0000000000000000000000",
  })
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @ApiProperty({
    description: "Optional conversation title",
    example: "Newton's laws of motion",
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: "Optional subject the conversation relates to",
    required: false,
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty({
    description: "Optional chapter the conversation relates to",
    required: false,
  })
  @IsOptional()
  @IsString()
  chapterId?: string;

  @ApiProperty({
    description: "Optional lesson the conversation relates to",
    required: false,
  })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiProperty({
    enum: Language,
    description: "Tutor response language",
    default: Language.EN,
    required: false,
  })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;
}
