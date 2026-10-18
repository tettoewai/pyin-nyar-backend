import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { MessageRole } from "../../../generated/prisma/enums.js";

export class CreateMessageDto {
  @ApiProperty({
    description: "The ID of the conversation this message belongs to",
  })
  @IsNotEmpty()
  @IsString()
  conversationId!: string;

  @ApiProperty({ enum: MessageRole, description: "Who produced the message" })
  @IsEnum(MessageRole)
  role!: MessageRole;

  @ApiProperty({ description: "The text content of the message" })
  @IsNotEmpty()
  @IsString()
  content!: string;

  @ApiProperty({
    description: "Model used to generate the message",
    required: false,
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({
    description: "Number of tokens in the prompt",
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  promptTokens?: number;

  @ApiProperty({
    description: "Number of tokens in the completion",
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  completionTokens?: number;

  @ApiProperty({
    description: "Total number of tokens used",
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalTokens?: number;
}
