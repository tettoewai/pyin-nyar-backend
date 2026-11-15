import { Module } from "@nestjs/common";
import { QuizAdminController } from "@/quiz/quiz-admin.controller.js";
import { QuizService } from "@/quiz/quiz.service.js";
import { AuthModule } from "@/auth/auth.module.js";
import { PrismaModule } from "@/prisma/prisma.module.js";

@Module({
  controllers: [QuizAdminController],
  providers: [QuizService],
  imports: [PrismaModule, AuthModule],
})
export class QuizModule {}
