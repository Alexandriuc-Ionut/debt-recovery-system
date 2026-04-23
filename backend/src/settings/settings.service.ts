import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceSeriesDto } from './dto/create-invoice-series.dto';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // ── Company ──────────────────────────────────────────────────────────────

  async getCompany(companyId: number) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async updateCompany(companyId: number, dto: UpdateCompanyDto) {
    if (dto.cui) {
      const conflict = await this.prisma.company.findUnique({
        where: { cui: dto.cui },
      });
      if (conflict && conflict.id !== companyId) {
        throw new ConflictException(
          'This CUI is already registered by another company',
        );
      }
    }
    return this.prisma.company.update({
      where: { id: companyId },
      data: { ...dto },
    });
  }

  // ── Invoice Series ────────────────────────────────────────────────────────

  async getInvoiceSeries(companyId: number) {
    return this.prisma.invoiceSeries.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createInvoiceSeries(companyId: number, dto: CreateInvoiceSeriesDto) {
    if (dto.isDefault) {
      // Unset previous default
      await this.prisma.invoiceSeries.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.invoiceSeries.create({
      data: {
        companyId,
        name: dto.name,
        prefix: dto.prefix,
        nextNumber: dto.nextNumber ?? 1,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async updateInvoiceSeries(
    companyId: number,
    id: number,
    dto: Partial<CreateInvoiceSeriesDto>,
  ) {
    const series = await this.prisma.invoiceSeries.findUnique({
      where: { id },
    });
    if (!series || series.companyId !== companyId)
      throw new NotFoundException('Series not found');

    if (dto.isDefault) {
      await this.prisma.invoiceSeries.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.invoiceSeries.update({
      where: { id },
      data: { ...dto },
    });
  }

  async deleteInvoiceSeries(companyId: number, id: number) {
    const series = await this.prisma.invoiceSeries.findUnique({
      where: { id },
    });
    if (!series || series.companyId !== companyId)
      throw new NotFoundException('Series not found');
    if (series.isDefault)
      throw new ForbiddenException('Cannot delete the default series');
    await this.prisma.invoiceSeries.delete({ where: { id } });
    return { message: 'Series deleted' };
  }

  // ── Bank Accounts ─────────────────────────────────────────────────────────

  async getBankAccounts(companyId: number) {
    return this.prisma.bankAccount.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createBankAccount(companyId: number, dto: CreateBankAccountDto) {
    if (dto.isDefault) {
      await this.prisma.bankAccount.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.bankAccount.create({
      data: {
        companyId,
        bankName: dto.bankName,
        iban: dto.iban,
        accountHolder: dto.accountHolder,
        currency: dto.currency ?? 'RON',
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async updateBankAccount(
    companyId: number,
    id: number,
    dto: Partial<CreateBankAccountDto>,
  ) {
    const account = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!account || account.companyId !== companyId)
      throw new NotFoundException('Bank account not found');

    if (dto.isDefault) {
      await this.prisma.bankAccount.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.bankAccount.update({ where: { id }, data: { ...dto } });
  }

  async deleteBankAccount(companyId: number, id: number) {
    const account = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!account || account.companyId !== companyId)
      throw new NotFoundException('Bank account not found');
    await this.prisma.bankAccount.delete({ where: { id } });
    return { message: 'Bank account deleted' };
  }

  // ── ANAF Lookup ───────────────────────────────────────────────────────────

  async lookupAnaf(cui: string) {
    const cleanCui = cui.replace(/\D/g, '');
    const today = new Date().toISOString().split('T')[0];

    type AnafResult = {
      found: boolean;
      name?: string;
      address?: string;
      city?: string;
      county?: string;
      phone?: string;
      regNumber?: string;
      error?: string;
    };

    // Demo seed — well-known Romanian CUIs for offline/thesis demo
    const DEMO_COMPANIES: Record<string, Omit<AnafResult, 'found'>> = {
      '2816464': {
        name: 'DEDEMAN SRL',
        address: 'Str. Calea Romanului nr. 24',
        city: 'Bacau',
        county: 'Bacau',
        phone: '+40 234 206 800',
        regNumber: 'J04/2621/1992',
      },
      '2921185': {
        name: 'EMAG INTERNET SRL',
        address: 'Str. Avionului nr. 8B, Sector 1',
        city: 'Bucuresti',
        county: 'Ilfov',
        phone: '+40 374 107 007',
        regNumber: 'J40/10260/1994',
      },
      '1463252': {
        name: 'AUTOMOBILE DACIA SA',
        address: 'Str. Uzinei nr. 1, Mioveni',
        city: 'Mioveni',
        county: 'Arges',
        phone: '+40 248 501 100',
        regNumber: 'J03/603/1990',
      },
      '1590082': {
        name: 'OMV PETROM SA',
        address: 'Str. Coralilor nr. 22, Sector 1',
        city: 'Bucuresti',
        county: 'Ilfov',
        phone: '+40 21 406 0000',
        regNumber: 'J40/8302/1997',
      },
      '11279758': {
        name: 'KAUFLAND ROMANIA SCS',
        address: 'Str. Barbu Vacarescu nr. 120-144',
        city: 'Bucuresti',
        county: 'Ilfov',
        phone: '+40 21 207 0000',
        regNumber: 'J40/8435/1998',
      },
      '361757': {
        name: 'BANCA COMERCIALA ROMANA SA',
        address: 'Bd. Regina Elisabeta nr. 5, Sector 3',
        city: 'Bucuresti',
        county: 'Ilfov',
        phone: '+40 21 407 4200',
        regNumber: 'J40/90/1991',
      },
      '1639906': {
        name: 'ORANGE ROMANIA SA',
        address: 'Str. Lascar Catargiu nr. 47-53',
        city: 'Bucuresti',
        county: 'Ilfov',
        phone: '+40 21 203 5000',
        regNumber: 'J40/10178/1996',
      },
      '9010105': {
        name: 'VODAFONE ROMANIA SA',
        address: 'Calea Dorobantilor nr. 239, Sector 1',
        city: 'Bucuresti',
        county: 'Ilfov',
        phone: '+40 21 201 1200',
        regNumber: 'J40/5678/1996',
      },
      '361579': {
        name: 'BRD - GROUPE SOCIETE GENERALE SA',
        address: 'Bd. Ion Mihalache nr. 1-7, Sector 1',
        city: 'Bucuresti',
        county: 'Ilfov',
        phone: '+40 21 301 6100',
        regNumber: 'J40/608/1991',
      },
      '1596639': {
        name: 'ALTEX ROMANIA SRL',
        address: 'Str. Fabrica de Glucoza nr. 5',
        city: 'Bucuresti',
        county: 'Ilfov',
        phone: '+40 21 201 2222',
        regNumber: 'J40/5315/1994',
      },
    };

    if (DEMO_COMPANIES[cleanCui]) {
      return { found: true, ...DEMO_COMPANIES[cleanCui] };
    }

    // Try live ANAF API (v8 endpoint)
    type AnafEntry = {
      date_generale?: {
        denumire?: string;
        adresa?: string;
        nrRegCom?: string;
        telefon?: string;
        cui?: number;
      };
    };

    let response: Response;
    try {
      response = await fetch(
        'https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([{ cui: Number(cleanCui), data: today }]),
          signal: AbortSignal.timeout(8000),
        },
      );
    } catch {
      return {
        found: false,
        error: 'ANAF service unavailable (server down or timeout)',
      };
    }

    if (!response.ok) {
      return { found: false, error: `ANAF returned HTTP ${response.status}` };
    }

    const data = (await response.json()) as {
      found?: AnafEntry[];
      notFound?: number[];
    };

    const dg = data.found?.[0]?.date_generale;
    if (!dg?.denumire) {
      return { found: false };
    }

    // Parse city and county from Romanian address string
    // Format: "Str. X nr. Y, Oras, jud. Judet" or "Str. X nr. Y, Sector N, Oras"
    const fullAddress = dg.adresa?.trim() ?? '';
    const { street, city, county } = parseRomanianAddress(fullAddress);

    return {
      found: true,
      name: dg.denumire.trim(),
      address: street,
      city,
      county,
      phone: dg.telefon?.trim() ?? '',
      regNumber: dg.nrRegCom?.trim() ?? '',
    };
  }
}

function parseRomanianAddress(adresa: string): {
  street: string;
  city: string;
  county: string;
} {
  // "Str. Exemplu nr. 1, Sector 3, BUCURESTI, Jud. Ilfov"
  // "Str. Exemplu nr. 1, BACAU, Jud. Bacau"
  const parts = adresa.split(',').map((p) => p.trim());

  let county = '';
  let city = '';
  const streetParts: string[] = [];

  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower.startsWith('jud.') || lower.startsWith('judet')) {
      county = part.replace(/^jud\.\s*/i, '').trim();
    } else if (lower.startsWith('sector') || lower.match(/^sector\s+\d/i)) {
      // sector is part of Bucharest — keep as part of address
      streetParts.push(part);
      city = 'Bucuresti';
      if (!county) county = 'Ilfov';
    } else if (streetParts.length >= 1) {
      // Everything after the street is city
      city = part;
    } else {
      streetParts.push(part);
    }
  }

  return {
    street: streetParts.join(', '),
    city: city || (parts[parts.length - 1] ?? ''),
    county,
  };
}
