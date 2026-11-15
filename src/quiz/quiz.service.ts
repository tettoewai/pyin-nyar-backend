import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service.js";
import { dataOf, success } from "@/common/api-response.js";
import { CreateQuizDto } from "./dto/create-quiz.dto.js";

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

  async create(dto: CreateQuizDto, userId?: string) {
    if (!dto.title?.trim() || dto.title.trim().split(/\s+/).length < 2)
      throw new BadRequestException(
        "Quiz title is required and must be at least 2 words long",
      );

    await Promise.all([
      this.requireExists(dto.subjectId, this.prisma.subject, "Subject"),
      this.requireExists(dto.chapterId, this.prisma.chapter, "Chapter"),
      this.requireExists(dto.lessonId, this.prisma.lesson, "Lesson"),
    ]);

    const quiz = await this.prisma.quiz.create({
      data: {
        title: dto.title.trim(),
        difficulty: dto.difficulty ?? "MEDIUM",
        userId,
        subjectId: dto.subjectId,
        chapterId: dto.chapterId,
        lessonId: dto.lessonId,
        sourceUploadId: dto.sourceUploadId,
      },
      select: {
        id: true,
        title: true,
      },
    });

    return success("Quiz created successfully", quiz);
  }

  async requireExists(
    id: string | undefined,
    finder: {
      findUnique: (args: { where: { id: string } }) => Promise<unknown>;
    },
    name: string,
  ) {
    if (!id) return;
    const found = await finder.findUnique({ where: { id } });
    if (!found) throw new NotFoundException(`${name} not found`);
  }
}
