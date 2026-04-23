import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('score/client/:clientId')
  async calculateClientScore(
    @Param('clientId', ParseIntPipe) clientId: number,
  ) {
    return this.aiService.calculateClientScore(clientId);
  }

  @Post('score/company')
  async calculateScoresForCompany(@CurrentUser() user: JwtPayload) {
    return this.aiService.calculateScoresForCompany(user.companyId);
  }

  @Get('scores')
  async findAllScores(@CurrentUser() user: JwtPayload) {
    return this.aiService.findAllScores(user.companyId);
  }
}
