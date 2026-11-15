import { PartialType } from "@nestjs/swagger";
import { CreateQuestionDto } from "@/quiz/dto/question/create-question.dto.js";

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}
