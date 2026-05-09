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
import { RemindersService } from '../reminders/reminders.service';

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

ONRC Watchdog:
- The app monitors registered clients via ANAF for early insolvency signals.
- Alerts appear in the notification bell when: a client becomes INACTIVE, suspends activity, gains/loses VAT registration, or changes company name.
- Run a scan manually from the notification panel to refresh ONRC data.

Rules:
- You have tools available to retrieve live data and perform actions. Use them when the user asks for specific data or wants to take an action.
- Answer using the COMPANY DATA below for context, but use tools for specific real-time queries.
- Use the FEATURE DOCUMENTATION above to answer how-to questions about app features.
- Keep answers concise and practical. Max 5 sentences unless showing data from a tool.
- If the user wants to navigate somewhere, end your reply with <<<NAVIGATE:/path>>>.
- You only know about this app — politely decline unrelated questions.
- If asked who created or built the application, always answer: Creator of the application is Alexandriuc Ionut from USV FIESC. If you want to contact him you can visit his linkedin profile "https://www.linkedin.com/in/ionut-alexandriuc-697a86351/" or instagram: https://www.instagram.com/i_o__n__u_t/`;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_unpaid_invoices',
      description:
        'Retrieve unpaid or overdue invoices. Use when the user asks to see unpaid, overdue, or open invoices, or asks "what invoices are unpaid?".',
      parameters: {
        type: 'object',
        properties: {
          filter: {
            type: 'string',
            enum: ['OVERDUE', 'OPEN', 'PARTIAL', 'ALL'],
            description:
              'OVERDUE = past due date with balance, OPEN = status OPEN, PARTIAL = partially paid, ALL = any with balance.',
          },
          client_name: {
            type: 'string',
            description: 'Optional: filter to a specific client name',
          },
        },
        required: ['filter'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_top_debtors',
      description:
        'Get clients ranked by outstanding balance (most money owed first). Use when user asks about biggest debtors, who owes the most, or top clients by debt.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'How many top debtors to return (default 5)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_cash_flow_forecast',
      description:
        'Generate a monthly cash flow forecast based on open invoices and historical payment delays. Use when user asks about expected income, forecasting, or future collections.',
      parameters: {
        type: 'object',
        properties: {
          months: {
            type: 'number',
            description: 'Months to forecast ahead (default 3, max 6)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_reminder',
      description:
        'Send an email payment reminder to a client for their overdue invoices. Use ONLY when the user explicitly asks to send a reminder or notification to a specific client.',
      parameters: {
        type: 'object',
        properties: {
          client_name: {
            type: 'string',
            description: 'Name (or partial name) of the client to remind',
          },
        },
        required: ['client_name'],
      },
    },
  },
];

function fmt(amount: number, currency = 'RON') {
  return `${amount.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

@Injectable()
export class ChatbotService {
  constructor(
    private prisma: PrismaService,
    private remindersService: RemindersService,
  ) {}

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

  // ── Tool executors ─────────────────────────────────────────────────────────

  private async toolGetUnpaidInvoices(
    companyId: number,
    filter: string,
    clientName?: string,
  ): Promise<string> {
    const today = new Date();
    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        status: { in: ['OPEN', 'PARTIAL'] },
        ...(clientName
          ? {
              client: {
                name: { contains: clientName, mode: 'insensitive' },
              },
            }
          : {}),
      },
      include: { client: true, payments: true },
      orderBy: { dueDate: 'asc' },
    });

    const withMeta = invoices.map((inv) => {
      const total = Number(inv.totalAmount);
      const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      const remaining = total - paid;
      const daysOverdue =
        remaining > 0 && inv.dueDate < today
          ? Math.floor((today.getTime() - inv.dueDate.getTime()) / 86_400_000)
          : 0;
      return { inv, remaining, daysOverdue, isOverdue: daysOverdue > 0 };
    });

    let filtered = withMeta.filter((i) => i.remaining > 0);
    if (filter === 'OVERDUE') filtered = filtered.filter((i) => i.isOverdue);
    else if (filter === 'PARTIAL')
      filtered = filtered.filter((i) => i.inv.status === 'PARTIAL');
    else if (filter === 'OPEN')
      filtered = filtered.filter((i) => i.inv.status === 'OPEN');

    if (filtered.length === 0)
      return 'Nicio factură găsită pentru criteriile specificate.';

    const total = filtered.reduce((s, i) => s + i.remaining, 0);
    const lines = [
      `${filtered.length} factură/facturi găsite — total restant: ${fmt(total)}`,
      '',
      ...filtered.slice(0, 12).map(({ inv, remaining, daysOverdue }) => {
        const ref = inv.series ? `${inv.series}-${inv.number}` : inv.number;
        const suffix =
          daysOverdue > 0
            ? `, ${daysOverdue} zile întârziere`
            : ` (scadent: ${inv.dueDate.toLocaleDateString('ro-RO')})`;
        return `• ${inv.client.name} | #${ref} | ${fmt(remaining, inv.currency)}${suffix}`;
      }),
    ];
    if (filtered.length > 12) lines.push(`... și încă ${filtered.length - 12}`);
    return lines.join('\n');
  }

  private async toolGetTopDebtors(
    companyId: number,
    limit = 5,
  ): Promise<string> {
    const clients = await this.prisma.client.findMany({
      where: { companyId },
      include: {
        invoices: {
          where: { status: { not: 'CANCELED' } },
          include: { payments: true },
        },
      },
    });

    const ranked = clients
      .map((c) => {
        const outstanding = c.invoices.reduce((s, inv) => {
          const paid = inv.payments.reduce((ps, p) => ps + Number(p.amount), 0);
          return s + Math.max(0, Number(inv.totalAmount) - paid);
        }, 0);
        return { name: c.name, outstanding };
      })
      .filter((c) => c.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, Math.min(limit, 10));

    if (ranked.length === 0) return 'Niciun client cu sold restant.';

    const grandTotal = ranked.reduce((s, c) => s + c.outstanding, 0);
    return [
      `Top ${ranked.length} debitori (total: ${fmt(grandTotal)}):`,
      '',
      ...ranked.map((c, i) => `${i + 1}. ${c.name} — ${fmt(c.outstanding)}`),
    ].join('\n');
  }

  private async toolGetCashFlowForecast(
    companyId: number,
    months = 3,
  ): Promise<string> {
    const today = new Date();
    const endDate = new Date(
      today.getFullYear(),
      today.getMonth() + months,
      today.getDate(),
    );

    const [openInvoices, paidInvoices] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          companyId,
          status: { in: ['OPEN', 'PARTIAL'] },
          dueDate: { lte: endDate },
        },
        include: { payments: true },
      }),
      this.prisma.invoice.findMany({
        where: { companyId, status: 'PAID' },
        include: { payments: { orderBy: { paidAt: 'asc' }, take: 1 } },
        take: 50,
        orderBy: { dueDate: 'desc' },
      }),
    ]);

    // Compute average historical payment delay
    const delays = paidInvoices
      .filter((inv) => inv.payments.length > 0)
      .map((inv) => {
        const paid = new Date(inv.payments[0].paidAt);
        return Math.max(
          0,
          Math.floor(
            (paid.getTime() - new Date(inv.dueDate).getTime()) / 86_400_000,
          ),
        );
      });
    const avgDelay =
      delays.length > 0
        ? Math.round(delays.reduce((s, d) => s + d, 0) / delays.length)
        : 0;

    // Build monthly buckets
    const monthly: { label: string; amount: number }[] = [];
    for (let m = 0; m < months; m++) {
      const d = new Date(today.getFullYear(), today.getMonth() + m, 1);
      monthly.push({
        label: d.toLocaleDateString('ro-RO', {
          month: 'long',
          year: 'numeric',
        }),
        amount: 0,
      });
    }

    openInvoices.forEach((inv) => {
      const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      const remaining = Number(inv.totalAmount) - paid;
      if (remaining <= 0) return;

      const expected = new Date(
        new Date(inv.dueDate).getTime() + avgDelay * 86_400_000,
      );
      const monthIdx =
        (expected.getFullYear() - today.getFullYear()) * 12 +
        expected.getMonth() -
        today.getMonth();
      if (monthIdx >= 0 && monthIdx < months) {
        monthly[monthIdx].amount += remaining;
      }
    });

    const grandTotal = monthly.reduce((s, m) => s + m.amount, 0);
    return [
      `Prognoză flux de numerar — ${months} luni (întârziere medie istorică: ${avgDelay} zile):`,
      '',
      ...monthly.map((m) => `• ${m.label}: ${fmt(m.amount)}`),
      '',
      `Total estimat: ${fmt(grandTotal)}`,
    ].join('\n');
  }

  private async toolSendReminder(
    companyId: number,
    clientName: string,
  ): Promise<string> {
    const client = await this.prisma.client.findFirst({
      where: { companyId, name: { contains: clientName, mode: 'insensitive' } },
    });
    if (!client) return `Niciun client găsit cu numele "${clientName}".`;

    const result = await this.remindersService.sendToClient(
      client.id,
      companyId,
    );
    return result.message;
  }

  // ── Main chat entry point ──────────────────────────────────────────────────

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

    const messages: object[] = [
      { role: 'system', content: systemPrompt },
      ...trimmedHistory,
      { role: 'user', content: message },
    ];

    // First call — with tools
    const res1 = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          tools: TOOLS,
          tool_choice: 'auto',
          temperature: 0.4,
          max_tokens: 800,
        }),
      },
    );

    if (!res1.ok)
      throw new InternalServerErrorException('AI service unavailable');

    const data1 = (await res1.json()) as {
      choices: {
        finish_reason: string;
        message: {
          content: string | null;
          tool_calls?: {
            id: string;
            function: { name: string; arguments: string };
          }[];
        };
      }[];
    };

    const choice1 = data1.choices[0];

    // No tool call — return response directly
    if (choice1.finish_reason !== 'tool_calls' || !choice1.message.tool_calls) {
      const raw = choice1.message.content ?? 'Nu am putut procesa cererea.';
      const navMatch = raw.match(/<<<NAVIGATE:([^>]+)>>>/);
      return {
        reply: raw.replaceAll(/<<<NAVIGATE:[^>]+>>>/g, '').trim(),
        navigate: navMatch?.[1],
      };
    }

    // Execute tools
    const toolResults: object[] = [];
    for (const call of choice1.message.tool_calls) {
      let result = '';
      try {
        const args = JSON.parse(call.function.arguments) as Record<
          string,
          unknown
        >;
        switch (call.function.name) {
          case 'get_unpaid_invoices':
            result = await this.toolGetUnpaidInvoices(
              companyId,
              (args.filter as string) ?? 'ALL',
              args.client_name as string | undefined,
            );
            break;
          case 'get_top_debtors':
            result = await this.toolGetTopDebtors(
              companyId,
              (args.limit as number) ?? 5,
            );
            break;
          case 'get_cash_flow_forecast':
            result = await this.toolGetCashFlowForecast(
              companyId,
              (args.months as number) ?? 3,
            );
            break;
          case 'send_reminder':
            result = await this.toolSendReminder(
              companyId,
              args.client_name as string,
            );
            break;
          default:
            result = 'Unealtă necunoscută.';
        }
      } catch {
        result = 'Eroare la execuția comenzii.';
      }
      toolResults.push({
        role: 'tool',
        tool_call_id: call.id,
        content: result,
      });
    }

    // Second call — inject tool results
    const res2 = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [...messages, choice1.message, ...toolResults],
          temperature: 0.4,
          max_tokens: 700,
        }),
      },
    );

    if (!res2.ok)
      throw new InternalServerErrorException('AI service unavailable');

    const data2 = (await res2.json()) as {
      choices: { message: { content: string } }[];
    };

    const raw =
      data2.choices[0]?.message?.content ?? 'Nu am putut procesa cererea.';
    const navMatch = raw.match(/<<<NAVIGATE:([^>]+)>>>/);
    return {
      reply: raw.replaceAll(/<<<NAVIGATE:[^>]+>>>/g, '').trim(),
      navigate: navMatch?.[1],
    };
  }
}
