import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IsArray, IsString, MaxLength, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

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

const SYSTEM_PROMPT = `You are DebtBot, a friendly assistant robot embedded inside a B2B debt recovery and invoice management application called DebtRecovery. You help users understand and navigate the app.

The application has these pages:
- /dashboard      → Overview: total invoices, paid, outstanding, overdue count, aging buckets (0-30, 31-60, 60+ days), cash flow forecast
- /clients        → Manage clients (companies you invoice). Supports ANAF CUI autofill to auto-populate company data.
- /invoices       → Create/cancel invoices. Filter by status (Open, Partial, Paid, Canceled). Export to SAGA CSV. Download somație PDF for overdue invoices.
- /payments       → Record payments (Bank, Cash, Card). Links payments to invoices and updates their status automatically.
- /reminders      → Configure and send payment reminders for overdue invoices via email.
- /expenses       → Track business expenses by category: Utilities, Salaries, Rent, Supplies, Services, Taxes, Other.
- /recurring      → Create recurring billing templates that auto-generate invoices on a schedule (daily/weekly/monthly/yearly).
- /efactura       → Romanian e-Factura: upload and submit invoices to ANAF SPV in UBL 2.1 XML format (mandatory B2B from Jan 2024 in Romania).
- /ai             → AI risk scoring for clients based on payment history. Shows trust score and late payment probability.
- /audit          → Full audit log: every create/update/delete/login action with user, timestamp, and details.
- /settings       → Company details (with ANAF lookup), invoice series configuration, bank accounts.
- /profile        → User profile and password management.

Rules:
- Keep answers concise, friendly, and practical. Max 3 sentences.
- If the user wants to navigate to a page or asks to be taken somewhere, end your reply with <<<NAVIGATE:/path>>>.
- If the user asks how something works AND wants to go there, explain briefly then add the navigate tag.
- Never add the navigate tag unless the user clearly wants to go somewhere.
- You only know about this app — politely decline unrelated questions.`;

@Injectable()
export class ChatbotService {
  async chat(message: string, history: ChatHistoryItem[]): Promise<{ reply: string; navigate?: string }> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      return {
        reply: "I'm not configured yet. Please add a GROQ_API_KEY to the backend .env file (free at console.groq.com).",
      };
    }

    // Keep last 10 exchanges to avoid token limits
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
          { role: 'system', content: SYSTEM_PROMPT },
          ...trimmedHistory,
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      throw new InternalServerErrorException('AI service unavailable');
    }

    const data = await res.json() as {
      choices: { message: { content: string } }[];
    };

    const raw: string = data.choices[0]?.message?.content ?? "I couldn't process that.";

    const navMatch = raw.match(/<<<NAVIGATE:([^>]+)>>>/);
    const navigate = navMatch ? navMatch[1] : undefined;
    const reply = raw.replace(/<<<NAVIGATE:[^>]+>>>/, '').trim();

    return { reply, navigate };
  }
}
