import { PartialType } from "@nestjs/swagger";
import { CreateConversationDto } from "@/conversation/dto/create-conversation.dto.js";

export class UpdateConversationDto extends PartialType(CreateConversationDto) {}
