import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { RecurringService, CreateRecurringDto } from './recurring.service';

@UseGuards(JwtAuthGuard)
@Controller('recurring')
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.recurringService.findAll(user.companyId);
  }

  @Post()
  create(@Body() dto: CreateRecurringDto, @CurrentUser() user: JwtPayload) {
    return this.recurringService.create(dto, user.companyId);
  }

  @Patch(':id/toggle')
  toggle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.recurringService.toggleActive(id, user.companyId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.recurringService.remove(id, user.companyId);
  }
}
