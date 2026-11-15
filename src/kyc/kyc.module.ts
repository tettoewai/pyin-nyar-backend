import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module.js";
import { PrismaModule } from "@/prisma/prisma.module.js";
import { KycService } from "@/kyc/kyc.service.js";
import { AdminKycController } from "@/kyc/kyc-admin.controller.js";

@Module({
  controllers: [AdminKycController],
  providers: [KycService],
  imports: [PrismaModule, AuthModule],
})
export class KycModule {}
