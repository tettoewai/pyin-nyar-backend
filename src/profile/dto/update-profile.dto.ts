import { PartialType } from "@nestjs/swagger";
import { CreateProfileDto } from "@/profile/dto/create-profile.dto.js";

export class UpdateProfileDto extends PartialType(CreateProfileDto) {}
