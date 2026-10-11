import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { OtpService } from "./otp.service.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { EmailModule } from "../email/email.module.js";
import { AuthController } from "./auth.controller.js";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { TokenService } from "./token.service.js";

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
  exports: [OtpService],
  controllers: [AuthController],
})
export class AuthModule {}
