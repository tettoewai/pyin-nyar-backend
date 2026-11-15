import { PartialType } from "@nestjs/swagger";
import { CreateStudyPlanDto } from "@/study-plan/dto/create-study-plan.dto.js";

export class UpdateStudyPlanDto extends PartialType(CreateStudyPlanDto) {}
