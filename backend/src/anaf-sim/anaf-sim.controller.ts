import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AnafSimService } from './anaf-sim.service';

@Controller('anaf-sim')
export class AnafSimController {
  constructor(private readonly anafSimService: AnafSimService) {}

  @Get('stats')
  getStats() {
    return this.anafSimService.getStats();
  }

  @Get()
  findAll() {
    return this.anafSimService.findAll();
  }

  @Get('pending')
  findPending() {
    return this.anafSimService.findPending();
  }

  @Post('validate/:id')
  validate(@Param('id', ParseIntPipe) id: number) {
    return this.anafSimService.validate(id);
  }

  @Post('reject/:id')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { errorMsg: string },
  ) {
    return this.anafSimService.reject(id, body.errorMsg ?? 'Eroare validare');
  }

  @Get('xml/:id')
  async downloadXml(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const xml = await this.anafSimService.getXml(id);
    res.set({
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="efactura-sim-${id}.xml"`,
    });
    res.send(xml);
  }
}
