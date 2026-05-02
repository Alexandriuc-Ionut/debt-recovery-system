import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { ClientsModule } from './clients/clients.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RemindersModule } from './reminders/reminders.module';
import { AiModule } from './ai/ai.module';
import { SettingsModule } from './settings/settings.module';
import { NoticesModule } from './notices/notices.module';
import { RecurringModule } from './recurring/recurring.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { EFacturaModule } from './efactura/efactura.module';
import { AnafSimModule } from './anaf-sim/anaf-sim.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    AuthModule,
    CompaniesModule,
    ClientsModule,
    InvoicesModule,
    PaymentsModule,
    DashboardModule,
    RemindersModule,
    AiModule,
    SettingsModule,
    NoticesModule,
    RecurringModule,
    ExpensesModule,
    ChatbotModule,
    EFacturaModule,
    AnafSimModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
