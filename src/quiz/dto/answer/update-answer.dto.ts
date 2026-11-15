import { PartialType } from "@nestjs/swagger";
import { CreateAnswerDto } from "@/quiz/dto/answer/create-answer.dto.js";

export class UpdateAnswerDto extends PartialType(CreateAnswerDto) {}
