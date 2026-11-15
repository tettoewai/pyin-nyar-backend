import { PartialType } from "@nestjs/swagger";
import { CreateQuizDto } from "@/quiz/dto/create-quiz.dto.js";

export class UpdateQuizDto extends PartialType(CreateQuizDto) {}
