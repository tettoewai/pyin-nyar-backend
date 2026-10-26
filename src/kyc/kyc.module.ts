import { Module } from "@nestjs/common";
import { KycService } from "./kyc.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { AdminKycController } from "./kyc-admin.controller.js";
import { TokenService } from "../auth/token.service.js";
import { JwtService } from "@nestjs/jwt";
import { CryptoService } from "./crypto.service.js";
import { StudentKycService } from "../student-kyc/student-kyc.service.js";

@Module({
  controllers: [AdminKycController],
  providers: [
    KycService,
    PrismaService,
    TokenService,
    JwtService,
    CryptoService,
    StudentKycService,
  ],
})
export class KycModule {}
