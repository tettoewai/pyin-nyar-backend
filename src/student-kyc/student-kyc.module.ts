import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { StudentKycController } from "./student-kyc.controller.js";
import { StudentKycService } from "./student-kyc.service.js";

@Module({
  controllers: [StudentKycController],
  providers: [StudentKycService],
  imports: [PrismaModule, AuthModule],
})
export class StudentKycModule {}
