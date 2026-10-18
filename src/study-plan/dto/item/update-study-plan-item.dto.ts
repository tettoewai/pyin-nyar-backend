import { PartialType } from "@nestjs/swagger";
import { CreateStudyPlanItemDto } from "./create-study-plan-item.dto.js";

export class UpdateStudyPlanItemDto extends PartialType(
  CreateStudyPlanItemDto,
) {}
