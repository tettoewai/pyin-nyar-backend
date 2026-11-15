import { PartialType } from "@nestjs/swagger";
import { CreateUploadDto } from "@/upload/dto/create-upload.dto.js";

export class UpdateUploadDto extends PartialType(CreateUploadDto) {}
