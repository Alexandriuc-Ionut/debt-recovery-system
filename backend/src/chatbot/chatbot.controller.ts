import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { ChatbotService, ChatMessageDto } from './chatbot.service';

@UseGuards(JwtAuthGuard)
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  send(@Body() dto: ChatMessageDto, @CurrentUser() user: JwtPayload) {
    return this.chatbotService.chat(dto.message, dto.history, user.companyId);
  }
}
