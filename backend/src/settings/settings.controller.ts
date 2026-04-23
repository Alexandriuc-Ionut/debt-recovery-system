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
import { SettingsService } from './settings.service';
import { CreateInvoiceSeriesDto } from './dto/create-invoice-series.dto';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ── Company ──────────────────────────────────────────────────────────────

  @Get('company')
  getCompany(@CurrentUser() user: JwtPayload) {
    return this.settingsService.getCompany(user.companyId);
  }

  @Patch('company')
  updateCompany(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.settingsService.updateCompany(user.companyId, dto);
  }

  // ── Invoice Series ────────────────────────────────────────────────────────

  @Get('invoice-series')
  getInvoiceSeries(@CurrentUser() user: JwtPayload) {
    return this.settingsService.getInvoiceSeries(user.companyId);
  }

  @Post('invoice-series')
  createInvoiceSeries(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateInvoiceSeriesDto,
  ) {
    return this.settingsService.createInvoiceSeries(user.companyId, dto);
  }

  @Patch('invoice-series/:id')
  updateInvoiceSeries(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateInvoiceSeriesDto>,
  ) {
    return this.settingsService.updateInvoiceSeries(user.companyId, id, dto);
  }

  @Delete('invoice-series/:id')
  deleteInvoiceSeries(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.settingsService.deleteInvoiceSeries(user.companyId, id);
  }

  // ── Bank Accounts ─────────────────────────────────────────────────────────

  @Get('bank-accounts')
  getBankAccounts(@CurrentUser() user: JwtPayload) {
    return this.settingsService.getBankAccounts(user.companyId);
  }

  @Post('bank-accounts')
  createBankAccount(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBankAccountDto,
  ) {
    return this.settingsService.createBankAccount(user.companyId, dto);
  }

  @Patch('bank-accounts/:id')
  updateBankAccount(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateBankAccountDto>,
  ) {
    return this.settingsService.updateBankAccount(user.companyId, id, dto);
  }

  @Delete('bank-accounts/:id')
  deleteBankAccount(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.settingsService.deleteBankAccount(user.companyId, id);
  }

  // ── ANAF Lookup ───────────────────────────────────────────────────────────

  @Get('anaf/:cui')
  lookupAnaf(@Param('cui') cui: string) {
    return this.settingsService.lookupAnaf(cui);
  }
}
