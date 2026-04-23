import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatbotService, ChatMessageDto } from './chatbot.service';

@UseGuards(JwtAuthGuard)
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  send(@Body() dto: ChatMessageDto) {
    return this.chatbotService.chat(dto.message, dto.history);
  }
}
