import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { dataOf } from "../common/api-response.js";

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  async adminFindAll() {
    const quizzes = await this.prisma.quiz.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        attempts: true,
        title: true,
        difficulty: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        subject: { select: { id: true, name: true, code: true, grade: true } },
        chapter: { select: { id: true, name: true } },
        lesson: { select: { id: true, name: true } },
      },
    });
    return dataOf(quizzes);
  }
}
