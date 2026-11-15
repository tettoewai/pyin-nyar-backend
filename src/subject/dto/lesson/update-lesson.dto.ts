import { PartialType } from "@nestjs/swagger";
import { CreateLessonDto } from "@/subject/dto/lesson/create-lesson.dto.js";

export class UpdateLessonDto extends PartialType(CreateLessonDto) {}
