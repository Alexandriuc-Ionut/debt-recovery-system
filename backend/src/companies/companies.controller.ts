import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // Public — needed to create a company before registering the first user
  @Post()
  async create(@Body() dto: CreateCompanyDto) {
    return this.companiesService.create(dto);
  }

  // Protected — returns the authenticated user's own company
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyCompany(@CurrentUser() user: JwtPayload) {
    return this.companiesService.findById(user.companyId);
  }
}
