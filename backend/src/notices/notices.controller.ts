import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { NoticesService } from './notices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@UseGuards(JwtAuthGuard)
@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Get('somatie/:invoiceId')
  async downloadSomatie(
    @Param('invoiceId', ParseIntPipe) invoiceId: number,
    @Query('lang') lang: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const language = lang === 'en' ? 'en' : 'ro';
    const pdf = await this.noticesService.generateSomatie(
      invoiceId,
      user.companyId,
      language,
    );
    const filename = language === 'en' ? `payment-notice-${invoiceId}.pdf` : `somatie-${invoiceId}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
}
