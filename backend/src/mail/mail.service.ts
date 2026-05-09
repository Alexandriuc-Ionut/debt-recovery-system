import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey = process.env.BREVO_API_KEY ?? '';
  private readonly fromEmail =
    process.env.MAIL_FROM ?? 'noreply@debtrecovery.app';
  private readonly fromName = 'DebtRecovery';

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          sender: { name: this.fromName, email: this.fromEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Brevo API ${res.status}: ${body}`);
      }
      this.logger.log(`Email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err);
    }
  }

  async sendVerificationEmail(
    to: string,
    fullName: string,
    token: string,
  ): Promise<void> {
    const appUrl = process.env.APP_URL || 'http://localhost:3001';
    const verifyUrl = `${appUrl}/auth/verify-email?token=${token}`;

    await this.send(
      to,
      'Verify your email – DebtRecovery',
      `
      <!DOCTYPE html><html><head><meta charset="utf-8"/>
      <style>
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 20px}
        .card{background:#fff;border-radius:12px;max-width:520px;margin:0 auto;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
        h1{color:#0f172a;font-size:22px;margin:0 0 8px}
        p{color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px}
        .btn{display:inline-block;background:#1e40af;color:#fff!important;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px}
        .footer{margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:13px}
        .url{word-break:break-all;color:#64748b;font-size:13px;margin-top:16px}
      </style></head><body>
      <div class="card">
        <h1>Verify your email address</h1>
        <p>Hi ${fullName || 'there'},</p>
        <p>Thank you for registering. Please verify your email address to activate your account.</p>
        <a href="${verifyUrl}" class="btn">Verify Email Address</a>
        <p class="url">Or copy this link:<br/>${verifyUrl}</p>
        <div class="footer">This link expires in 24 hours.</div>
      </div></body></html>
    `,
    );
  }

  async sendInvoiceEmail(
    to: string,
    clientName: string,
    invoiceNumber: string,
    totalAmount: number,
    currency: string,
    dueDate: Date,
  ): Promise<void> {
    const due = dueDate.toLocaleDateString('ro-RO');

    await this.send(
      to,
      `Invoice ${invoiceNumber} – DebtRecovery`,
      `
      <!DOCTYPE html><html><head><meta charset="utf-8"/>
      <style>
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 20px}
        .card{background:#fff;border-radius:12px;max-width:520px;margin:0 auto;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
        h1{color:#0f172a;font-size:22px;margin:0 0 16px}
        p{color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px}
        .amount{font-size:28px;font-weight:700;color:#1e40af;margin:16px 0}
        .info{background:#f1f5f9;border-radius:8px;padding:16px;margin:16px 0}
        .info p{margin:4px 0;color:#334155;font-size:14px}
        .footer{margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:13px}
      </style></head><body>
      <div class="card">
        <h1>New Invoice Issued</h1>
        <p>Dear ${clientName},</p>
        <p>A new invoice has been issued for your account.</p>
        <div class="info">
          <p><strong>Invoice number:</strong> ${invoiceNumber}</p>
          <p><strong>Due date:</strong> ${due}</p>
        </div>
        <div class="amount">${totalAmount.toFixed(2)} ${currency}</div>
        <p>Please ensure payment is made before the due date to avoid late fees.</p>
        <div class="footer">This is an automated message from DebtRecovery.</div>
      </div></body></html>
    `,
    );
  }

  async sendReminderEmail(
    to: string,
    clientName: string,
    invoiceNumber: string,
    remainingAmount: number,
    currency: string,
    dueDate: Date,
  ): Promise<void> {
    return this.sendStagedReminderEmail(
      to,
      clientName,
      invoiceNumber,
      remainingAmount,
      currency,
      dueDate,
      1,
    );
  }

  async sendStagedReminderEmail(
    to: string,
    clientName: string,
    invoiceNumber: string,
    remainingAmount: number,
    currency: string,
    dueDate: Date,
    level: 1 | 2 | 3,
  ): Promise<void> {
    const due = dueDate.toLocaleDateString('ro-RO');
    const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / 86400000);

    const levelConfig = {
      1: {
        subject: `Reminder de plată: Factura ${invoiceNumber}`,
        badge: '📋 Reamintire',
        badgeColor: '#dbeafe',
        badgeText: '#1d4ed8',
        badgeBorder: '#bfdbfe',
        title: 'Reamintire de plată',
        intro:
          'Vă aducem la cunoștință că factura de mai jos a depășit termenul de plată. Vă rugăm să efectuați plata cât mai curând posibil.',
        closing:
          'Dacă ați efectuat deja plata, vă rugăm să ignorați acest mesaj. Pentru orice clarificări, nu ezitați să ne contactați.',
        amountColor: '#1d4ed8',
        infoColor: '#dbeafe',
        infoBorder: '#bfdbfe',
        infoText: '#1e40af',
      },
      2: {
        subject: `A 2-a notificare: Factura ${invoiceNumber} restantă`,
        badge: '⚠ A 2-a notificare',
        badgeColor: '#fef3c7',
        badgeText: '#92400e',
        badgeBorder: '#fde68a',
        title: 'A doua notificare de plată',
        intro:
          'Această este a doua notificare privind factura restantă de mai jos. Suma restantă necesită atenție urgentă.',
        closing:
          'Vă rugăm să reglementați suma restantă în cel mai scurt timp pentru a evita măsuri suplimentare.',
        amountColor: '#d97706',
        infoColor: '#fffbeb',
        infoBorder: '#fde68a',
        infoText: '#92400e',
      },
      3: {
        subject: `NOTIFICARE FINALĂ: Factura ${invoiceNumber} — acțiune imediată necesară`,
        badge: '🚨 Notificare finală',
        badgeColor: '#fef2f2',
        badgeText: '#991b1b',
        badgeBorder: '#fecaca',
        title: 'Notificare finală înainte de somație',
        intro:
          'Aceasta este notificarea finală privind factura restantă. Dacă suma nu este achitată, vom fi nevoiți să emitem o somație oficială și să luăm măsuri legale.',
        closing:
          'Vă rugăm să efectuați plata IMEDIAT pentru a evita proceduri legale suplimentare, costuri și penalități.',
        amountColor: '#dc2626',
        infoColor: '#fef2f2',
        infoBorder: '#fecaca',
        infoText: '#991b1b',
      },
    }[level];

    await this.send(
      to,
      levelConfig.subject,
      `
      <!DOCTYPE html><html><head><meta charset="utf-8"/>
      <style>
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 20px}
        .card{background:#fff;border-radius:12px;max-width:560px;margin:0 auto;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,.12)}
        .badge{display:inline-block;background:${levelConfig.badgeColor};color:${levelConfig.badgeText};border:1px solid ${levelConfig.badgeBorder};padding:5px 14px;border-radius:20px;font-size:13px;font-weight:700;margin-bottom:20px}
        h1{color:#0f172a;font-size:22px;margin:0 0 16px}
        p{color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px}
        .amount{font-size:30px;font-weight:800;color:${levelConfig.amountColor};margin:20px 0}
        .info{background:${levelConfig.infoColor};border-radius:8px;padding:16px;margin:16px 0;border:1px solid ${levelConfig.infoBorder}}
        .info p{margin:4px 0;color:${levelConfig.infoText};font-size:14px}
        .level{font-size:12px;color:#94a3b8;margin-bottom:24px}
        .footer{margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:13px}
      </style></head><body>
      <div class="card">
        <div class="badge">${levelConfig.badge}</div>
        <h1>${levelConfig.title}</h1>
        <p>Stimate ${clientName},</p>
        <p>${levelConfig.intro}</p>
        <div class="info">
          <p><strong>Nr. factură:</strong> ${invoiceNumber}</p>
          <p><strong>Termen scadent:</strong> ${due}</p>
          <p><strong>Zile restante:</strong> ${daysOverdue} zi${daysOverdue !== 1 ? 'le' : 'ua'}</p>
          <p><strong>Notificare nivel:</strong> ${level}/3</p>
        </div>
        <div class="amount">${remainingAmount.toFixed(2)} ${currency} de achitat</div>
        <p>${levelConfig.closing}</p>
        <div class="footer">
          Acest mesaj a fost generat automat de platforma DebtRecovery.<br/>
          Dacă ați efectuat deja plata, vă rugăm să ignorați acest email.
        </div>
      </div></body></html>
    `,
    );
  }
}
