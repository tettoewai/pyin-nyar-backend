import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { dataOf, success } from "@/common/api-response.js";
import { PrismaService } from "@/prisma/prisma.service.js";
import { CreateLessonDto } from "@/subject/dto/lesson/create-lesson.dto.js";
import { UpdateLessonDto } from "@/subject/dto/lesson/update-lesson.dto.js";
import { ReorderLessonsDto } from "@/subject/dto/lesson/reorder-lessons.dto.js";

@Injectable()
export class LessonService {
  constructor(private readonly prisma: PrismaService) {}

  async adminFindAll(chapterId?: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: chapterId ? { chapterId } : undefined,
      orderBy: [{ chapterId: "asc" }, { order: "asc" }],
      include: {
        chapter: {
          select: {
            id: true,
            name: true,
            subjectId: true,
            subject: {
              select: { id: true, name: true, code: true, grade: true },
            },
          },
        },
      },
    });
    return dataOf(lessons);
  }

  async adminFindOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        chapter: {
          select: {
            id: true,
            name: true,
            subjectId: true,
            subject: {
              select: { id: true, name: true, code: true, grade: true },
            },
          },
        },
      },
    });
    if (!lesson) throw new NotFoundException("Lesson not found!");
    return dataOf(lesson);
  }

  async findByChapter(chapterId: string) {
    await this.assertChapterExists(chapterId);

    const lessons = await this.prisma.lesson.findMany({
      where: { chapterId, deletedAt: null },
      orderBy: { order: "asc" },
      select: {
        id: true,
        chapterId: true,
        name: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return dataOf(lessons);
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id,
        deletedAt: null,
        chapter: {
          deletedAt: null,
          subject: { deletedAt: null },
        },
      },
      select: {
        id: true,
        chapterId: true,
        name: true,
        order: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        chapter: {
          select: {
            id: true,
            name: true,
            order: true,
            subject: {
              select: { id: true, name: true, code: true, grade: true },
            },
          },
        },
      },
    });
    if (!lesson) throw new NotFoundException("Lesson not found!");
    return dataOf(lesson);
  }

  async create(dto: CreateLessonDto) {
    await this.assertChapterExists(dto.chapterId);

    const existing = await this.prisma.lesson.findFirst({
      where: { chapterId: dto.chapterId, name: dto.name },
      select: { id: true, deletedAt: true },
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictException(
        "A lesson with this name already exists in the chapter.",
      );
    }

    try {
      if (existing) {
        const lesson = await this.prisma.lesson.update({
          where: { id: existing.id },
          data: {
            name: dto.name,
            order: dto.order,
            deletedAt: null,
            ...(dto.content !== undefined && { content: dto.content }),
          },
        });
        return success("Lesson restored successfully.", lesson);
      }

      const lesson = await this.prisma.lesson.create({
        data: {
          chapterId: dto.chapterId,
          name: dto.name,
          order: dto.order,
          content: dto.content,
        },
      });
      return success("Lesson created successfully.", lesson);
    } catch (error) {
      this.rethrowUniqueConstraint(error);
    }
  }

  async update(id: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, chapterId: true },
    });
    if (!lesson) throw new NotFoundException("Lesson not found!");

    const chapterId = dto.chapterId ?? lesson.chapterId;
    if (dto.chapterId !== undefined) {
      await this.assertChapterExists(dto.chapterId);
    }

    if (dto.name !== undefined) {
      const duplicate = await this.prisma.lesson.findFirst({
        where: {
          chapterId,
          name: dto.name,
          id: { not: id },
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException(
          "A lesson with this name already exists in the chapter.",
        );
      }
    }

    try {
      const updated = await this.prisma.lesson.update({
        where: { id },
        data: {
          ...(dto.chapterId !== undefined && { chapterId: dto.chapterId }),
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.order !== undefined && { order: dto.order }),
          ...(dto.content !== undefined && { content: dto.content }),
        },
      });
      return success("Lesson updated successfully.", updated);
    } catch (error) {
      this.rethrowUniqueConstraint(error);
    }
  }

  async reorder(dto: ReorderLessonsDto) {
    await this.assertChapterExists(dto.chapterId);

    const uniqueIds = new Set(dto.ids);
    if (uniqueIds.size !== dto.ids.length) {
      throw new BadRequestException("Lesson IDs must be unique.");
    }

    const lessons = await this.prisma.lesson.findMany({
      where: {
        id: { in: dto.ids },
        chapterId: dto.chapterId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (lessons.length !== dto.ids.length) {
      throw new BadRequestException(
        "One or more lessons do not exist in this chapter.",
      );
    }

    await this.prisma.$transaction(
      dto.ids.map((id, index) =>
        this.prisma.lesson.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );
    return success("Lessons reordered successfully.");
  }

  async delete(id: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!lesson) throw new NotFoundException("Lesson not found!");

    await this.prisma.lesson.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return success("Lesson deleted successfully.");
  }

  private async assertChapterExists(chapterId: string) {
    const chapter = await this.prisma.chapter.findFirst({
      where: {
        id: chapterId,
        deletedAt: null,
        subject: { deletedAt: null },
      },
      select: { id: true },
    });
    if (!chapter) throw new NotFoundException("Chapter not found!");
  }

  private rethrowUniqueConstraint(error: unknown): never {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException(
        "A lesson with this name already exists in the chapter.",
      );
    }
    throw error;
  }
}
