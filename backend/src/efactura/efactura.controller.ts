import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { EFacturaService } from './efactura.service';

@UseGuards(JwtAuthGuard)
@Controller('efactura')
export class EFacturaController {
  constructor(private readonly efacturaService: EFacturaService) {}

  /** All submissions for the company */
  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.efacturaService.findAll(user.companyId);
  }

  /** Invoices not yet submitted */
  @Get('eligible')
  findEligible(@CurrentUser() user: JwtPayload) {
    return this.efacturaService.findEligible(user.companyId);
  }

  /** Submit an invoice to ANAF */
  @Post('submit/:invoiceId')
  submit(
    @Param('invoiceId', ParseIntPipe) invoiceId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.efacturaService.submit(invoiceId, user.companyId);
  }

  /** Poll ANAF for result of a pending submission */
  @Post('poll/:submissionId')
  poll(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.efacturaService.poll(submissionId, user.companyId);
  }

  /** Download the generated XML */
  @Get('xml/:submissionId')
  async downloadXml(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const xml = await this.efacturaService.getXml(submissionId, user.companyId);
    res.set({
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="efactura-${submissionId}.xml"`,
    });
    res.send(xml);
  }
}
