import { PartialType } from "@nestjs/swagger";
import { CreateMasteryScoreDto } from "@/mastery/dto/create-mastery-score.dto.js";

export class UpdateMasteryScoreDto extends PartialType(CreateMasteryScoreDto) {}
