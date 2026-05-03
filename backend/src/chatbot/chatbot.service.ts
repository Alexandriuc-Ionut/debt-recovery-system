import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  IsArray,
  IsString,
  MaxLength,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';

export class ChatHistoryItem {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @MaxLength(2000)
  content: string;
}

export class ChatMessageDto {
  @IsString()
  @MaxLength(1000)
  message: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItem)
  history: ChatHistoryItem[];
}

const BASE_PROMPT = `You are DebtBot, a friendly assistant embedded inside a B2B debt recovery and invoice management application called DebtRecovery.

The application has these pages:
- /dashboard  → Overview: total invoices, paid, outstanding, overdue count, aging buckets, cash flow forecast
- /clients    → Manage clients. Supports ANAF CUI autofill to auto-populate company data.
- /invoices   → Create/cancel invoices. Filter by status. Export to SAGA CSV. Download somație PDF.
- /payments   → Record payments (Bank, Cash, Card). Links to invoices and updates status automatically.
- /reminders  → Send payment reminders for overdue invoices via email.
- /expenses   → Track business expenses by category.
- /recurring  → Recurring billing templates that auto-generate invoices on a schedule.
- /efactura   → Romanian e-Factura: submit invoices to ANAF SPV in UBL 2.1 XML format.
- /ai         → AI risk scoring for clients based on payment history.
- /audit      → Full audit log of every action.
- /settings   → Company details, invoice series, bank accounts.
- /profile    → User profile and password management.

FEATURE DOCUMENTATION:

CSV Import (bulk invoice creation):
- Found on /invoices page, "Import CSV" button in the toolbar.
- Supports two formats: the app's own format AND the SAGA export format (auto-detected).
- SAGA export format columns: Nr, Serie, Numar, Data emitere, Data scadenta, Client, CUI Client, Valoare totala, Moneda, Status.
- Own format columns: series, number, clientName, issueDate, dueDate, totalAmount, currency, notes.
- Dates can be DD.MM.YYYY (SAGA) or YYYY-MM-DD (own format).
- Client name in the CSV must match exactly the client name in the app.
- CANCELED invoices from SAGA export are automatically skipped.
- After upload a preview table shows each row as green (valid) or red (error with reason).
- Common errors: "Client not found" means the name in CSV doesn't match any client in the app; "Missing number" means the invoice number column is empty.
- Only valid (green) rows get imported when you click "Import X invoices".

E-Factura (electronic invoice submission to ANAF):
- Found on /efactura page. Submits invoices to ANAF SPV in UBL 2.1 / CIUS-RO 1.0.1 XML format.
- Mandatory for B2B transactions in Romania since January 2024.
- Flow: select invoice → XML is generated → submitted to ANAF → status shows PENDING → ANAF validates → status becomes VALIDATED or ERROR.
- The app includes an ANAF Simulator at /anaf-simulator where you can manually validate or reject pending submissions (for testing/demo purposes).
- PENDING submissions auto-refresh every 5 seconds — no manual reload needed.
- You can download the generated UBL 2.1 XML for each submission.
- Common error: if submission fails it shows ERROR status with the reason from ANAF.

Somație PDF:
- A legal payment demand notice. Available on overdue invoices (red due date) on the /invoices page.
- Click the "Somație" button on an overdue invoice row to download a PDF.
- The PDF includes creditor/debtor details, invoice reference, overdue amount, and legal payment demand text.
- Available in Romanian and English depending on the app language setting.

Invoice statuses:
- OPEN: invoice created, not yet paid.
- PARTIAL: some payment received but not the full amount.
- PAID: fully paid — updated automatically when payment equals total amount.
- CANCELED: invoice canceled, cannot be paid or re-opened.

Payment recording:
- Go to /payments → "Inregistrează Plată" button.
- Select the invoice, enter amount, method (Bank/Cash/Card), date, and optional reference.
- Invoice status updates automatically: if full amount paid → PAID, if partial → PARTIAL.

Reminders:
- Go to /reminders to send email payment reminders to clients with overdue invoices.
- Select a client from the dropdown and click "Send Reminder" — an email is sent automatically.
- You can also configure automatic reminder rules (e.g. send every 7 days for overdue invoices).

AI Risk Scoring (/ai):
- Shows a trust score and late payment probability for each client based on their payment history.
- Clients with low scores are high risk — consider requiring upfront payment or shorter due dates.

Recurring invoices (/recurring):
- Create a billing template that auto-generates invoices on a schedule (daily/weekly/monthly/yearly).
- Toggle active/inactive to pause or resume without deleting the template.

SAGA Export:
- On /invoices, click "Export SAGA" to download a CSV compatible with the SAGA accounting software.
- Contains all invoices with series, number, dates, client, amount, currency, and status.
- This same file can be re-imported using the "Import CSV" button.

Rules:
- Answer using the COMPANY DATA below when the user asks about their invoices, clients, payments, or finances.
- Use the FEATURE DOCUMENTATION above to answer how-to questions about app features.
- Keep answers concise and practical. Max 4 sentences.
- If the user wants to navigate somewhere, end your reply with <<<NAVIGATE:/path>>>.
- You only know about this app — politely decline unrelated questions.
- If asked who created or built the application, always answer: Creator of the application is Alexandriuc Ionut from USV FIESC. If you want to contact him you can visit his linkedin profile "https://www.linkedin.com/in/ionut-alexandriuc-697a86351/" or instagram: https://www.instagram.com/i_o__n__u_t/`;

function fmt(amount: number, currency = 'RON') {
  return `${amount.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

@Injectable()
export class ChatbotService {
  constructor(private prisma: PrismaService) {}

  private async buildContext(companyId: number): Promise<string> {
    const today = new Date();
    const in30Days = new Date(today.getTime() + 30 * 86_400_000);

    const [invoices, payments, clients] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { companyId, status: { not: 'CANCELED' } },
        include: { client: true, payments: true },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.payment.findMany({
        where: { invoice: { companyId } },
        include: { invoice: { include: { client: true } } },
        orderBy: { paidAt: 'desc' },
        take: 5,
      }),
      this.prisma.client.findMany({
        where: { companyId },
        include: { invoices: { include: { payments: true } } },
      }),
    ]);

    // Wrap each invoice with computed balance fields without spreading (preserves included relations)
    const withBalance = invoices.map((inv) => {
      const total = Number(inv.totalAmount);
      const paid = inv.payments.reduce(
        (s: number, p) => s + Number(p.amount),
        0,
      );
      const remaining = total - paid;
      const daysOverdue =
        inv.dueDate < today
          ? Math.floor((today.getTime() - inv.dueDate.getTime()) / 86_400_000)
          : 0;
      return { inv, total, paid, remaining, daysOverdue };
    });

    const overdue = withBalance
      .filter((i) => i.daysOverdue > 0 && i.remaining > 0)
      .sort((a, b) => b.daysOverdue - a.daysOverdue);

    const upcoming = withBalance
      .filter(
        (i) =>
          i.inv.dueDate >= today &&
          i.inv.dueDate <= in30Days &&
          i.remaining > 0,
      )
      .sort((a, b) => a.inv.dueDate.getTime() - b.inv.dueDate.getTime());

    const totalReceivables = withBalance.reduce((s, i) => s + i.remaining, 0);
    const totalOverdue = overdue.reduce((s, i) => s + i.remaining, 0);

    const statusCounts = { OPEN: 0, PARTIAL: 0, PAID: 0 };
    withBalance.forEach(({ inv }) => {
      if (inv.status in statusCounts)
        statusCounts[inv.status as keyof typeof statusCounts]++;
    });

    const clientBalances = clients
      .map((c) => {
        const outstanding = c.invoices.reduce((s, inv) => {
          const paid = inv.payments.reduce(
            (ps: number, p) => ps + Number(p.amount),
            0,
          );
          return s + Math.max(0, Number(inv.totalAmount) - paid);
        }, 0);
        return { name: c.name, cui: c.cui, outstanding };
      })
      .filter((c) => c.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding);

    const lines: string[] = [
      `=== COMPANY DATA (today: ${today.toLocaleDateString('ro-RO')}) ===`,
      '',
      'SUMMARY:',
      `- Total invoices: ${invoices.length} | Open: ${statusCounts.OPEN} | Partial: ${statusCounts.PARTIAL} | Paid: ${statusCounts.PAID} | Overdue: ${overdue.length}`,
      `- Total receivables: ${fmt(totalReceivables)} | Total overdue: ${fmt(totalOverdue)}`,
      `- Total clients: ${clients.length}`,
    ];

    if (overdue.length > 0) {
      lines.push('', 'OVERDUE INVOICES (most urgent first):');
      overdue.slice(0, 8).forEach(({ inv, remaining, daysOverdue }) => {
        const ref = inv.series ? `${inv.series}-${inv.number}` : inv.number;
        lines.push(
          `- ${inv.client.name} | Invoice ${ref} | ${fmt(remaining, inv.currency)} | ${daysOverdue} days overdue`,
        );
      });
    }

    if (upcoming.length > 0) {
      lines.push('', 'UPCOMING DUE (next 30 days):');
      upcoming.slice(0, 5).forEach(({ inv, remaining }) => {
        const ref = inv.series ? `${inv.series}-${inv.number}` : inv.number;
        lines.push(
          `- ${inv.client.name} | Invoice ${ref} | ${fmt(remaining, inv.currency)} | due ${inv.dueDate.toLocaleDateString('ro-RO')}`,
        );
      });
    }

    if (payments.length > 0) {
      lines.push('', 'RECENT PAYMENTS:');
      payments.forEach((p) => {
        const date = new Date(p.paidAt).toLocaleDateString('ro-RO');
        lines.push(
          `- ${p.invoice.client?.name ?? '—'} | ${fmt(Number(p.amount), p.invoice.currency)} | ${p.method} | ${date}`,
        );
      });
    }

    if (clientBalances.length > 0) {
      lines.push('', 'CLIENTS WITH OUTSTANDING BALANCE:');
      clientBalances.slice(0, 8).forEach((c) => {
        lines.push(
          `- ${c.name}${c.cui ? ` (CUI ${c.cui})` : ''} | Outstanding: ${fmt(c.outstanding)}`,
        );
      });
    }

    return lines.join('\n');
  }

  async chat(
    message: string,
    history: ChatHistoryItem[],
    companyId: number,
  ): Promise<{ reply: string; navigate?: string }> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      return {
        reply:
          "I'm not configured yet. Please add a GROQ_API_KEY to the backend .env file (free at console.groq.com).",
      };
    }

    const context = await this.buildContext(companyId);
    const systemPrompt = `${BASE_PROMPT}\n\n${context}`;
    const trimmedHistory = history.slice(-10);

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...trimmedHistory,
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      throw new InternalServerErrorException('AI service unavailable');
    }

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };

    const raw: string =
      data.choices[0]?.message?.content ?? "I couldn't process that.";

    const navMatch = raw.match(/<<<NAVIGATE:([^>]+)>>>/);
    const navigate = navMatch ? navMatch[1] : undefined;
    const reply = raw.replaceAll(/<<<NAVIGATE:[^>]+>>>/g, '').trim();

    return { reply, navigate };
  }
}
