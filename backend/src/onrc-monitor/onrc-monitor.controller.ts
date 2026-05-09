import { Controller, Get, Post, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { OnrcMonitorService } from './onrc-monitor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('onrc-monitor')
@UseGuards(JwtAuthGuard)
export class OnrcMonitorController {
  constructor(private readonly service: OnrcMonitorService) {}

  @Post('scan')
  scan(@Req() req: { user: { companyId: number } }) {
    return this.service.scanCompany(req.user.companyId);
  }

  @Get('alerts')
  getAlerts(@Req() req: { user: { companyId: number } }) {
    return this.service.getAlerts(req.user.companyId);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: { user: { companyId: number } }) {
    return this.service.getUnreadCount(req.user.companyId);
  }

  @Post('alerts/:id/read')
  markRead(
    @Req() req: { user: { companyId: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.markRead(req.user.companyId, id);
  }

  @Post('alerts/read-all')
  markAllRead(@Req() req: { user: { companyId: number } }) {
    return this.service.markAllRead(req.user.companyId);
  }
}
