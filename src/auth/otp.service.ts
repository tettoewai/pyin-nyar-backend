import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { EmailService } from "../email/email.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { NotFoundError } from "rxjs";

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_PER_HOUR = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_LENGTH = 6;

export type OtpPurpose = "signup" | "reset-password";

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly pepper: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.pepper = this.configService.getOrThrow<string>("OTP_PEPPER");
    if (!this.pepper || this.pepper.length < 32) {
      throw new Error(
        "OTP_PEPPER must be set and at least 32 characters long.",
      );
    }
  }

  private hashOtp(otp: string): string {
    return createHmac("sha256", this.pepper).update(otp).digest("hex");
  }

  async requestOtp(
    email: string,
    purpose: OtpPurpose = "signup",
  ): Promise<{ expiresInSec: number; retryAfterSec: number }> {
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    if (purpose === "reset-password") {
      const user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (!user)
        throw new NotFoundException("No account found with this email");
    }

    const otp = randomInt(0, 10 ** OTP_LENGTH)
      .toString()
      .padStart(OTP_LENGTH, "0");
    const codeHash = this.hashOtp(otp);
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);
    const lockKey = `${normalizedEmail}:${purpose}`;

    try {
      await this.prisma.$transaction(async (tx) => {
        // Serialize concurrent requests for the same email+purpose
        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(hashtext('otp'), hashtext(${lockKey}))
        `;

        const [latest, recentCount] = await Promise.all([
          tx.otpChallenge.findFirst({
            where: { email: normalizedEmail, purpose },
            orderBy: { createdAt: "desc" },
          }),
          tx.otpChallenge.count({
            where: {
              email: normalizedEmail,
              purpose,
              createdAt: { gte: oneHourAgo },
            },
          }),
        ]);

        // OTP Cooldown
        if (
          latest &&
          now.getTime() - latest.createdAt.getTime() < OTP_COOLDOWN_MS
        ) {
          const elapsedMs = now.getTime() - latest.createdAt.getTime();
          const retryAfterSec = Math.ceil((OTP_COOLDOWN_MS - elapsedMs) / 1000);
          throw new HttpException(
            `Please wait ${retryAfterSec}s before requesting another code.`,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        // OTP Limit
        if (recentCount >= OTP_MAX_PER_HOUR) {
          throw new HttpException(
            "Too many OTP requests. Please try again later",
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        const created = await tx.otpChallenge.create({
          data: { email: normalizedEmail, codeHash, purpose, expiresAt },
          select: { id: true },
        });

        return created.id;
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error("Failed to create OTP challenge", error);
      throw new ServiceUnavailableException(
        "Failed to create OTP. Please try again.",
      );
    }

    try {
      await this.sendOtpEmail(normalizedEmail, otp);
    } catch (error: any) {
      this.logger.error(`[request otp] email error: ${error}`);
      throw new ServiceUnavailableException(
        "Failed to send OTP email. Please try again.",
      );
    }

    return {
      expiresInSec: OTP_TTL_MS / 1000,
      retryAfterSec: OTP_COOLDOWN_MS / 1000,
    };
  }

  private async sendOtpEmail(email: string, otp: string): Promise<void> {
    if (this.configService.get<string>("NODE_ENV") !== "production") {
      this.logger.log(`[DEV] OTP for ${email}: ${otp}`);
      return;
    }
    const subject = "Your PyinNyar verification code";
    const text = `PyinNyar - Your verification code is ${otp}. It expires in 5 minutes.\n\nIf you did not request this, you can ignore this email.`;
    const spacedOtp = otp.split("").join(" ");
    const html = `<!doctype html><html><body style="margin:0;padding:0;background-color:#FFF7F3;">
<div style="background-color:#FFF7F3;margin:0;padding:24px 16px;font-family:'Nunito',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans Myanmar',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;">
<tr><td style="padding:0 0 16px 0;text-align:center;">
<div style="font-family:'Nunito',-apple-system,sans-serif;font-weight:800;font-size:20px;color:#036B4C;letter-spacing:-0.3px;">PyinNyar</div>
<div style="font-size:12px;color:#656E6A;margin-top:2px;">Your AI teacher &bull; Online</div>
</td></tr>
<tr><td style="background-color:#036B4C;border-radius:24px 24px 0 0;padding:24px 24px 20px 24px;">
<div style="color:#FFFFFF;font-weight:800;font-size:18px;line-height:24px;">Verification code</div>
<div style="color:rgba(255,255,255,0.85);font-size:13px;line-height:18px;margin-top:4px;">အတည်ပြုကုဒ် &bull; Enter this in the app to continue</div>
</td></tr>
<tr><td style="background-color:#FFFFFF;border:1px solid #E6D6B8;border-top:0;border-radius:0 0 24px 24px;padding:24px;">
<div style="color:#141816;font-size:14px;line-height:20px;">Hi there,</div>
<div style="color:#141816;font-size:14px;line-height:20px;margin-top:4px;">Use this code to continue in <strong>PyinNyar</strong>:</div>
<div style="background-color:#F3F5F4;border:1px solid #E6D6B8;border-radius:16px;margin:16px 0 8px 0;padding:18px 12px;text-align:center;">
<div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#141816;line-height:40px;">${spacedOtp}</div>
</div>
<div style="text-align:center;color:#656E6A;font-size:12px;line-height:16px;">&#128337; Expires in 5 minutes &bull; 5 မိနစ်အတွင်း</div>
<div style="background-color:#FFB020;border-radius:12px;padding:10px 14px;margin-top:16px;">
<div style="color:#000000;font-size:12px;line-height:16px;text-align:center;">Never share this code. PyinNyar staff will never ask for it.</div>
</div>
<div style="color:#656E6A;font-size:12px;line-height:18px;margin-top:16px;">If you did not request this, you can safely ignore this email.</div>
</td></tr>
<tr><td style="text-align:center;padding:16px 8px 0 8px;">
<div style="font-size:12px;color:#656E6A;">You&apos;re all caught up &mdash; keep the streak going! &#128293;</div>
<div style="font-size:11px;color:#656E6A;margin-top:4px;">&copy; PyinNyar &bull; noreply@tettoewai.com</div>
</td></tr>
</table>
</div>
</body></html>`;

    try {
      await this.emailService.sendEmail(email, subject, html, text);
    } catch (err) {
      this.logger.error(`OTP email delivery failed for ${email}`, err as Error);
      throw new ServiceUnavailableException(
        "Failed to send OTP email. Please try again.",
      );
    }
  }

  async verifyOtp(
    email: string,
    code: string,
    purpose: OtpPurpose = "signup",
  ): Promise<string> {
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    // Only the most recent unexpired challenge is valid. Older ones are implicitly invalid
    // because the query never looks at them,
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: {
        email: normalizedEmail,
        purpose,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge || challenge.consumedAt) {
      throw new UnauthorizedException("Invalid or expired OTP.");
    }

    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      throw new UnauthorizedException("Invalid or expired OTP.");
    }

    // Reserve an attempt first. Only one request can take each remaining slot.
    const reserved = await this.prisma.otpChallenge.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
        expiresAt: { gt: now },
        attempts: { lt: OTP_MAX_ATTEMPTS },
      },
      data: { attempts: { increment: 1 } },
    });

    if (reserved.count === 0) {
      throw new UnauthorizedException("Invalid or expired OTP.");
    }

    const candidateHash = this.hashOtp(code.trim());
    let match = false;
    try {
      match = timingSafeEqual(
        Buffer.from(challenge.codeHash, "hex"),
        Buffer.from(candidateHash, "hex"),
      );
    } catch {
      match = false;
    }

    if (!match) {
      throw new UnauthorizedException("Invalid or expired OTP.");
    }

    const consumed = await this.prisma.otpChallenge.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
        expiresAt: { gt: now },
        attempts: { lt: OTP_MAX_ATTEMPTS },
      },
      data: { consumedAt: now },
    });

    if (consumed.count === 0) {
      throw new UnauthorizedException("Invalid or expired OTP.");
    }
    return challenge.id;
  }
}
