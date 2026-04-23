import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getSummary(user.companyId);
  }

  @Get('overdue-count')
  getOverdueCount(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getOverdueCount(user.companyId);
  }

  @Get('overdue-invoices')
  getOverdueInvoices(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getOverdueInvoices(user.companyId);
  }
}
