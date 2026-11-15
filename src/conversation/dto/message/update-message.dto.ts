import { PartialType } from "@nestjs/swagger";
import { CreateMessageDto } from "@/conversation/dto/message/create-message.dto.js";

export class UpdateMessageDto extends PartialType(CreateMessageDto) {}
