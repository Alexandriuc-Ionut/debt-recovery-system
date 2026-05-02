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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.findAll(user.companyId);
  }

  @Get('invoice/:invoiceId')
  async findByInvoice(
    @Param('invoiceId', ParseIntPipe) invoiceId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentsService.findByInvoice(invoiceId, user.companyId);
  }

  @Post()
  async create(@Body() dto: CreatePaymentDto, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.create(dto, user.companyId, user.sub);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreatePaymentDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentsService.update(id, dto, user.companyId);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentsService.remove(id, user.companyId, user.sub);
  }
}
