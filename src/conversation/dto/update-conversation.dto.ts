import { PartialType } from "@nestjs/swagger";
import { CreateConversationDto } from "./create-conversation.dto.js";

export class UpdateConversationDto extends PartialType(CreateConversationDto) {}
