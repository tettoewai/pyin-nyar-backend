import { PartialType } from "@nestjs/swagger";
import { CreateMasteryScoreDto } from "./create-mastery-score.dto.js";

export class UpdateMasteryScoreDto extends PartialType(CreateMasteryScoreDto) {}
