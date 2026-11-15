import { PartialType } from "@nestjs/swagger";
import { CreateStudyPlanItemDto } from "@/study-plan/dto/item/create-study-plan-item.dto.js";

export class UpdateStudyPlanItemDto extends PartialType(
  CreateStudyPlanItemDto,
) {}
