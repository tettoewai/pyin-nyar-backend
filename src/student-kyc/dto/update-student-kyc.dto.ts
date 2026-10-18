import { PartialType } from "@nestjs/swagger";
import { CreateStudentKycDto } from "./create-student-kyc.dto.js";

export class UpdateStudentKycDto extends PartialType(CreateStudentKycDto) {}
