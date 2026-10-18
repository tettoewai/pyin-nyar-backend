import { PartialType } from "@nestjs/swagger";
import { CreateAnswerDto } from "./create-answer.dto.js";

export class UpdateAnswerDto extends PartialType(CreateAnswerDto) {}
