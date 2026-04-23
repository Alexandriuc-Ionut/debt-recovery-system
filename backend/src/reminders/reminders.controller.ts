import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post('process')
  process(@CurrentUser() user: JwtPayload) {
    return this.remindersService.processOverdueInvoices(user.companyId);
  }

  @Post('send-client/:clientId')
  sendToClient(
    @Param('clientId', ParseIntPipe) clientId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.remindersService.sendToClient(clientId, user.companyId);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.remindersService.findAll(user.companyId);
  }
}
