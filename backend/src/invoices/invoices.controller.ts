import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { FilterInvoicesDto } from './dto/filter-invoices.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async findAll(
    @Query() query: FilterInvoicesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.invoicesService.findAll(
      user.companyId,
      query.status,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  // Must be before GET /:id
  @Get('export/saga')
  async exportSaga(@CurrentUser() user: JwtPayload, @Res() res: Response) {
    const csv = await this.invoicesService.exportSaga(user.companyId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="export-saga.csv"',
    );
    res.send(csv);
  }

  // Must be declared before GET /:id to prevent "client" being parsed as an id
  @Get('client/:clientId')
  async findByClient(
    @Param('clientId', ParseIntPipe) clientId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.invoicesService.findByClient(clientId, user.companyId);
  }

  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.invoicesService.findById(id, user.companyId);
  }

  @Post()
  async create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: JwtPayload) {
    return this.invoicesService.create(dto, user.companyId, user.sub);
  }

  @Post('bulk')
  async createBulk(
    @Body() body: { rows: CreateInvoiceDto[] },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.invoicesService.createBulk(body.rows, user.companyId, user.sub);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: {
      dueDate?: string;
      notes?: string;
      totalAmount?: number;
      currency?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.invoicesService.update(id, dto, user.companyId);
  }

  @Patch(':id/cancel')
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.invoicesService.cancel(id, user.companyId, user.sub);
  }
}
