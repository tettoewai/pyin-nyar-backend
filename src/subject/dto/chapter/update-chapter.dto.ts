import { PartialType } from "@nestjs/swagger";
import { CreateChapterDto } from "@/subject/dto/chapter/create-chapter.dto.js";

export class UpdateChapterDto extends PartialType(CreateChapterDto) {}
