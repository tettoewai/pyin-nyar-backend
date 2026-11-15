import { PartialType } from "@nestjs/swagger";
import { CreateQuizAttemptDto } from "@/quiz/dto/attempt/create-quiz-attempt.dto.js";

export class UpdateQuizAttemptDto extends PartialType(CreateQuizAttemptDto) {}
