import { PartialType } from "@nestjs/swagger";
import { CreateStudentKycDto } from "@/student-kyc/dto/create-student-kyc.dto.js";

export class UpdateStudentKycDto extends PartialType(CreateStudentKycDto) {}
