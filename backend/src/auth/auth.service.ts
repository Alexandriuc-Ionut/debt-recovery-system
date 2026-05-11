/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// Prisma's XOR / AtLeast utility types resolve to an internal TypeScript
// "error type" under typescript-eslint v8, triggering false positives for
// no-unsafe-assignment. Known incompatibility: github.com/prisma/prisma/issues/20101
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuditAction } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    if (dto.companyCui) {
      const existingCompany = await this.prisma.company.findFirst({
        where: { cui: dto.companyCui },
      });
      if (existingCompany) {
        throw new ConflictException(
          'A company with this CUI is already registered',
        );
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Create company + user atomically
    const user = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: dto.companyName,
          cui: dto.companyCui ?? null,
          email: dto.companyEmail ?? null,
          phone: dto.companyPhone ?? null,
          address: dto.companyAddress ?? null,
          city: dto.companyCity ?? null,
          county: dto.companyCounty ?? null,
        },
      });

      return tx.user.create({
        data: {
          companyId: company.id,
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          phone: dto.phone ?? null,
          role: 'ADMIN',
          isEmailVerified: false,
          emailVerificationToken: verificationToken,
          emailVerificationExpiry: verificationExpiry,
        },
      });
    });

    void this.mailService.sendVerificationEmail(
      user.email,
      user.fullName ?? user.email,
      verificationToken,
    );

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyId: user.companyId,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('email_not_found');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('invalid_password');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    await this.auditService.log({
      companyId: user.companyId,
      userId: user.id,
      action: AuditAction.LOGIN,
    });

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyId: user.companyId,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification link');
    }

    if (user.isEmailVerified) {
      return { message: 'Email already verified' };
    }

    if (
      user.emailVerificationExpiry &&
      user.emailVerificationExpiry < new Date()
    ) {
      throw new BadRequestException(
        'Verification link has expired. Please request a new one.',
      );
    }

    const verified = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    await this.auditService.log({
      companyId: user.companyId,
      userId: user.id,
      action: AuditAction.VERIFY_EMAIL,
    });

    const payload: JwtPayload = {
      sub: verified.id,
      email: verified.email,
      role: verified.role,
      companyId: verified.companyId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: verified.id,
        email: verified.email,
        fullName: verified.fullName,
        role: verified.role,
        companyId: verified.companyId,
        isEmailVerified: true,
      },
    };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });

    if (!user) {
      return {
        message: 'If that email exists, a new verification link has been sent.',
      };
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified.' };
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      },
    });

    void this.mailService.sendVerificationEmail(
      user.email,
      user.fullName ?? user.email,
      verificationToken,
    );

    return {
      message: 'If that email exists, a new verification link has been sent.',
    };
  }
}
