import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'node:crypto';
import { Role } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';

// What goes inside the JWTs
export interface AccessPayload {
  sub: string;
  email: string | null;
  role: Role;
}
export interface RefreshPayload {
  sub: string;
  jti: string;
}

// What we return to the mobile (Expo app)
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until accessToken expires
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTtlSec: number;
  private readonly refreshTtlSec: number;

  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwt: JwtService, // default secret = accss secret (see AuthModule)
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.accessSecret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.accessTtlSec = parseInt(
      this.config.getOrThrow<string>('JWT_ACCESS_TTL'),
      10,
    );
    this.refreshTtlSec = parseInt(
      this.config.getOrThrow('JWT_REFRESH_TTL'),
      10,
    );
  }

  async issue(
    userId: string,
    email: string | null,
    role: Role,
    meta: { ip?: string; userAgent?: string },
  ): Promise<TokenPair> {
    const jti = randomUUID(); // unique id per refresh token, for reuse detection

    const accessToken = await this.jwt.signAsync(
      {
        sub: userId,
        email,
        role,
      } as AccessPayload,
      { secret: this.accessSecret, expiresIn: this.accessTtlSec },
    );

    const refreshToken = await this.jwt.signAsync(
      {
        sub: userId,
        jti,
      } as RefreshPayload,
      { secret: this.refreshSecret, expiresIn: this.refreshTtlSec },
    );

    await this.prisma.session.create({
      data: {
        userId,
        tokenHash: sha256(refreshToken), // never store raw token
        expiresAt: new Date(Date.now() + this.refreshTtlSec * 1000),
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    });
    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTtlSec,
    };
  }

  async verifyToken(token: string): Promise<AccessPayload> {
    try {
      return await this.jwt.verifyAsync<AccessPayload>(token, {
        secret: this.accessSecret,
        issuer: 'pyin-nyar',
      });
    } catch (error: any) {
      this.logger.error(`[verifyToken] error: ${error}`);
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }

  async refreshToken(
    oldToken: string,
    meta: { ip?: string; userAgent?: string },
  ): Promise<TokenPair> {
    // 1. Must be a valid JWT signed by us
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(oldToken, {
        secret: this.refreshSecret,
      });
    } catch (error: any) {
      this.logger.error(`[refreshToken] error: ${error}`);
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    // 2. Must have an active session row
    const tokenHash = sha256(oldToken);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
    });
    if (!session) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    // 3. Reuse detection: token was already rotated/logged-out but JWT still valid
    // Means the secret leaked and two devices user it -> kill all session
    if (session.revokedAt) {
      await this.revokeAll(payload.sub);
      throw new UnauthorizedException('Refresh toke reused.');
    }

    // 4. Rotate atomically: revoke old, create new row is done inside issue()
    // Use a transaction so concurrent refreshes can't both succed
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: payload.sub },
    });

    const pair = await this.prisma.$transaction(async (tx) => {
      const revoked = await tx.session.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (revoked.count === 0) {
        throw new UnauthorizedException('Refresh toke reused.');
      }

      const jti = randomUUID();
      const accessToken = await this.jwt.signAsync(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
        } as AccessPayload,
        { secret: this.accessSecret, expiresIn: this.accessTtlSec },
      );
      const refreshToken = await this.jwt.signAsync(
        {
          sub: user.id,
          jti,
        },
        { secret: this.refreshSecret, expiresIn: this.refreshTtlSec },
      );

      await tx.session.create({
        data: {
          userId: user.id,
          tokenHash: sha256(refreshToken),
          expiresAt: new Date(Date.now() + this.refreshTtlSec * 1000),
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      });

      return { accessToken, refreshToken, expiresIn: this.accessTtlSec };
    });

    return pair;
  }

  async revoke(refreshToken: string): Promise<void> {
    // Logout current device. Idempotent; unknown token still return 200.
    await this.prisma.session.updateMany({
      where: {
        tokenHash: sha256(refreshToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async revokeAll(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
