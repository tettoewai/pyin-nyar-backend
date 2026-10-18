import { Module } from "@nestjs/common";
import { StudentKycService } from "./student-kyc.service.js";
import { StudentKycController } from "./student-kyc.controller.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { CryptoService } from "../kyc/crypto.service.js";
import { TokenService } from "../auth/token.service.js";
import { JwtService } from "@nestjs/jwt";

@Module({
  controllers: [StudentKycController],
  providers: [
    StudentKycService,
    PrismaService,
    CryptoService,
    TokenService,
    JwtService,
  ],
})
export class StudentKycModule {}
