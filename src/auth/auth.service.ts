import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OtpService } from './otp.service.js';
import * as argon2 from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { TokenService } from './token.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
  ) {}

  // Password must be at least 6 characters and include numbers and special symbol
  validPassword(password: string): boolean {
    const isLongEnough = password.length >= 6;
    const hasNumber = /\d/.test(password);
    const hasSpecialSymbol = /[ !@#$%^&*(),.?":{}|<>]/.test(password);

    return isLongEnough && hasNumber && hasSpecialSymbol;
  }

  async me(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id },
      omit: { passwordHash: true },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  async signup(
    email: string,
    password: string,
    confirmPassword: string,
    otp: string,
    meta: {
      ip?: string;
      userAgent?: string;
    },
  ) {
    const normalizedEmail = email.toLowerCase().trim();
    // Check existing user
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new ConflictException('Email address has already been registered.');
    }

    // Check password
    if (!this.validPassword(password)) {
      throw new BadRequestException(
        'Password must be at least 6 characters long, include numbers, and special symbol.',
      );
    }

    if (confirmPassword !== password) {
      throw new BadRequestException(
        'Confirm password do not match with password.',
      );
    }

    // Verify otp
    await this.otpService.verifyOtp(normalizedEmail, otp, 'signup');

    const passwordHash = await argon2.hash(password);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: 'STUDENT',
        },
      });
      return this.tokenService.issue(user.id, user.email, user.role, meta);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Email address has already been registered.',
        );
      }
      throw error;
    }
  }

  async login(
    email: string,
    password: string,
    meta: { ip?: string; userAgent?: string },
  ) {
    const normalizeEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail },
      select: { id: true, passwordHash: true, email: true, role: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(
        'Invalid email or password. Please try again.',
      );
    }
    const validPassword = await argon2.verify(user.passwordHash, password);
    if (!validPassword) {
      throw new UnauthorizedException(
        'Invalid email or password. Please try again.',
      );
    }
    return this.tokenService.issue(user.id, user.email, user.role, meta);
  }
}
