import { Module } from "@nestjs/common";
import { ProfileController } from "@/profile/profile.controller.js";
import { ProfileService } from "@/profile/profile.service.js";
import { PrismaModule } from "@/prisma/prisma.module.js";

@Module({
  imports: [PrismaModule],
  providers: [ProfileService],
  controllers: [ProfileController],
})
export class ProfileModule {}
