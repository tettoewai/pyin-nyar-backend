import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { UploadType } from "../../generated/prisma/enums.js";

export class CreateUploadDto {
  @ApiProperty({ description: "The ID of the user who owns the upload" })
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @ApiProperty({ enum: UploadType, description: "The kind of upload" })
  @IsNotEmpty()
  @IsEnum(UploadType)
  type!: UploadType;

  @ApiProperty({ description: "Public URL of the uploaded file" })
  @IsNotEmpty()
  @IsString()
  url!: string;

  @ApiProperty({ description: "Original file name", required: false })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiProperty({
    description: 'MIME type, e.g. "image/png" or "application/pdf"',
    required: false,
  })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiProperty({
    description: "File size in bytes",
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  size?: number;

  @ApiProperty({
    description: "Text extracted from the upload via OCR",
    required: false,
  })
  @IsOptional()
  @IsString()
  extractedText?: string;
}
