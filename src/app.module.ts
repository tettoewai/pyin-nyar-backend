import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module.js";
import { EmailModule } from "./email/email.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./auth/decorators/auth.guard.js";
import { SubjectModule } from "./subject/subject.module.js";
import { StudentKycModule } from "./student-kyc/student-kyc.module.js";
import { KycModule } from "./kyc/kyc.module.js";
import { CryptoModule } from "./common/crypto.module.js";
import { ProfileModule } from "./profile/profile.module.js";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000,
        limit: 3,
      },
      {
        name: "medium",
        ttl: 10000,
        limit: 20,
      },
      {
        name: "long",
        ttl: 60000,
        limit: 100,
      },
    ]),
    ConfigModule.forRoot({ isGlobal: true }),
    CryptoModule,
    PrismaModule,
    EmailModule,
    AuthModule,
    SubjectModule,
    StudentKycModule,
    KycModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
