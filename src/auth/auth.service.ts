import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { OtpService } from "./otp.service.js";
import * as argon2 from "argon2";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { TokenService } from "./token.service.js";
import { OAuth2Client } from "google-auth-library";
import { ConfigService } from "@nestjs/config";
import { Role } from "../generated/prisma/enums.js";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
  private readonly googleWebClientId: string;
  private readonly googleAndroidClientId: string;
  private readonly googleIosClientId: string;
  private readonly jwtResetSecret: string;
  private readonly jwtResetTtl: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    private readonly jwt: JwtService,
  ) {
    this.googleWebClientId = this.configService.getOrThrow(
      "GOOGLE_WEB_CLIENT_ID",
    );
    this.googleIosClientId = this.configService.getOrThrow(
      "GOOGLE_IOS_CLIENT_ID",
    );
    this.googleAndroidClientId = this.configService.getOrThrow(
      "GOOGLE_ANDROID_CLIENT_ID",
    );
    this.jwtResetSecret = this.configService.getOrThrow("JWT_RESET_SECRET");
    this.jwtResetTtl = parseInt(
      this.configService.getOrThrow("JWT_RESET_TTL") ?? "600",
      10,
    );
  }

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
      throw new NotFoundException("User not found.");
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
      throw new ConflictException("Email address has already been registered.");
    }

    // Check password
    if (!this.validPassword(password)) {
      throw new BadRequestException(
        "Password must be at least 6 characters long, include numbers, and special symbol.",
      );
    }

    if (confirmPassword !== password) {
      throw new BadRequestException(
        "Confirm password do not match with password.",
      );
    }

    // Verify otp
    await this.otpService.verifyOtp(normalizedEmail, otp, "signup");

    const passwordHash = await argon2.hash(password);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: "STUDENT",
        },
      });
      return this.tokenService.issue(user.id, user.email, user.role, meta);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "Email address has already been registered.",
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
        "Invalid email or password. Please try again.",
      );
    }
    const validPassword = await argon2.verify(user.passwordHash, password);
    if (!validPassword) {
      throw new UnauthorizedException(
        "Invalid email or password. Please try again.",
      );
    }
    return this.tokenService.issue(user.id, user.email, user.role, meta);
  }

  async verifyResetOtp(email: string, otp: string) {
    const normalizedEmail = email.toLocaleLowerCase().trim();

    const challengeId = await this.otpService.verifyOtp(
      normalizedEmail,
      otp,
      "reset-password",
    );
    const resetToken = await this.jwt.signAsync(
      {
        email: normalizedEmail,
        rcid: challengeId,
        purpose: "reset-password",
      },
      {
        secret: this.jwtResetSecret,
        expiresIn: this.jwtResetTtl,
      },
    );
    return { resetToken, expiresIn: this.jwtResetTtl };
  }

  async confirmResetPassword(
    resetToken: string,
    password: string,
    confirmPassword: string,
  ) {
    let payload: { email: string; rcid: string; purpose: string };
    try {
      payload = await this.jwt.verifyAsync(resetToken, {
        secret: this.jwtResetSecret,
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired reset token.");
    }
    if (payload.purpose !== "reset-password") {
      throw new UnauthorizedException("Invalid reset token.");
    }
    const challenge = await this.prisma.otpChallenge.findUnique({
      where: { id: payload.rcid },
    });
    if (
      !challenge ||
      challenge.email !== payload.email ||
      !challenge.consumedAt
    ) {
      throw new UnauthorizedException("Invalid or expired reset token.");
    }

    if (!this.validPassword(password))
      throw new BadRequestException(
        "Password must be at least 6 characters long, include numbers, and special symbol.",
      );
    if (password !== confirmPassword)
      throw new BadRequestException(
        "Confirm password do not match with password.",
      );

    const user = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });
    if (!user) throw new NotFoundException("User not found.");
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await argon2.hash(password) },
    });
    await this.prisma.otpChallenge
      .delete({ where: { id: challenge.id } })
      .catch(() => null); // single-use
    await this.tokenService.revokeAll(user.id);
    return { message: "Password reset successufully." };
  }

  googleClient = new OAuth2Client();

  async googleLogin(
    idToken: string,
    meta: { ip?: string; userAgent?: string },
  ) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: [
        this.googleWebClientId,
        this.googleIosClientId,
        this.googleAndroidClientId,
      ],
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new UnauthorizedException("Invalid google account.");
    }

    const email = payload.email.toLocaleLowerCase().trim();
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: payload.email,
          googleId: payload.sub,
          name: payload.name,
          avatarUrl: payload.picture,
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: payload.sub,
          name: user.name ?? payload.name,
          avatarUrl: user.avatarUrl ?? payload.picture,
        },
      });
    }
    return this.tokenService.issue(user.id, user.email, user.role, meta);
  }
}
