import { Module } from "@nestjs/common";
import { AuthService } from "@/auth/auth.service.js";
import { OtpService } from "@/auth/otp.service.js";
import { PrismaModule } from "@/prisma/prisma.module.js";
import { EmailModule } from "@/email/email.module.js";
import { AuthController } from "@/auth/auth.controller.js";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { TokenService } from "@/auth/token.service.js";

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        secret: c.getOrThrow("JWT_ACCESS_SECRET"),
        signOptions: {
          expiresIn: parseInt(c.get("JWT_ACCESS_TTL") ?? "900", 10),
          issuer: "pyin-nyar",
        },
      }),
    }),
  ],
  providers: [OtpService, AuthService, TokenService],
  exports: [OtpService, TokenService],
  controllers: [AuthController],
})
export class AuthModule {}
