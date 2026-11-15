import { PartialType } from "@nestjs/swagger";
import { CreateSubjectDto } from "@/subject/dto/create-subject.dto.js";

export class UpdateSubjectDto extends PartialType(CreateSubjectDto) {}
