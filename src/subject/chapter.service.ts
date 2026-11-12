import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { dataOf, success } from "../common/api-response.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateChapterDto } from "./dto/chapter/create-chapter.dto.js";
import { UpdateChapterDto } from "./dto/chapter/update-chapter.dto.js";
import { MoveChapterDto } from "./dto/chapter/move-chapter.dto.js";

@Injectable()
export class ChapterService {
  constructor(private readonly prisma: PrismaService) {}

  async adminFindAll(subjectId?: string) {
    const chapters = await this.prisma.chapter.findMany({
      where: subjectId ? { subjectId } : undefined,
      orderBy: [{ subjectId: "asc" }, { order: "asc" }],
      include: {
        subject: { select: { id: true, name: true, code: true, grade: true } },
        _count: { select: { lessons: true } },
      },
    });
    return dataOf(chapters);
  }

  async adminFindOne(id: string) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true, code: true, grade: true } },
        lessons: { orderBy: { order: "asc" } },
      },
    });
    if (!chapter) throw new NotFoundException("Chapter not found!");
    return dataOf(chapter);
  }

  async findBySubject(subjectId: string) {
    await this.assertSubjectExists(subjectId);

    const chapters = await this.prisma.chapter.findMany({
      where: { subjectId, deletedAt: null },
      orderBy: { order: "asc" },
      select: {
        id: true,
        subjectId: true,
        name: true,
        order: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { lessons: { where: { deletedAt: null } } } },
      },
    });
    return dataOf(chapters);
  }

  async findOne(id: string) {
    const chapter = await this.prisma.chapter.findFirst({
      where: {
        id,
        deletedAt: null,
        subject: { deletedAt: null },
      },
      select: {
        id: true,
        subjectId: true,
        name: true,
        order: true,
        createdAt: true,
        updatedAt: true,
        subject: { select: { id: true, name: true, code: true, grade: true } },
        lessons: {
          where: { deletedAt: null },
          orderBy: { order: "asc" },
          select: {
            id: true,
            chapterId: true,
            name: true,
            order: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    if (!chapter) throw new NotFoundException("Chapter not found!");
    return dataOf(chapter);
  }

  async create(dto: CreateChapterDto) {
    await this.assertSubjectExists(dto.subjectId);

    const existing = await this.prisma.chapter.findFirst({
      where: { subjectId: dto.subjectId, name: dto.name },
      select: { id: true, deletedAt: true },
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictException(
        "A chapter with this name already exists in the subject.",
      );
    }

    try {
      if (existing) {
        const chapter = await this.prisma.chapter.update({
          where: { id: existing.id },
          data: { name: dto.name, order: dto.order, deletedAt: null },
        });
        return success("Chapter restored successfully.", chapter);
      }

      const chapter = await this.prisma.chapter.create({
        data: {
          subjectId: dto.subjectId,
          name: dto.name,
          order: dto.order,
        },
      });
      return success("Chapter created successfully.", chapter);
    } catch (error) {
      this.rethrowUniqueConstraint(error);
    }
  }

  async update(id: string, dto: UpdateChapterDto) {
    const chapter = await this.prisma.chapter.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, subjectId: true },
    });
    if (!chapter) throw new NotFoundException("Chapter not found!");

    const subjectId = dto.subjectId ?? chapter.subjectId;
    if (dto.subjectId !== undefined) {
      await this.assertSubjectExists(dto.subjectId);
    }

    if (dto.name !== undefined) {
      const duplicate = await this.prisma.chapter.findFirst({
        where: {
          subjectId,
          name: dto.name,
          id: { not: id },
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException(
          "A chapter with this name already exists in the subject.",
        );
      }
    }

    try {
      const updated = await this.prisma.chapter.update({
        where: { id },
        data: {
          ...(dto.subjectId !== undefined && { subjectId: dto.subjectId }),
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.order !== undefined && { order: dto.order }),
        },
      });
      return success("Chapter updated successfully.", updated);
    } catch (error) {
      this.rethrowUniqueConstraint(error);
    }
  }

  async moveChapter(dto: MoveChapterDto) {
    await this.assertSubjectExists(dto.subjectId);

    this.prisma.$transaction(async (tx) => {
      const chapters = await tx.chapter.findMany({
        where: { subjectId: dto.subjectId, deletedAt: null },
        orderBy: { order: "asc" },
        select: { id: true },
      });

      const moving = chapters.find((c) => c.id === dto.id);
      if (!moving) {
        throw new BadRequestException(
          "Chapter does not exist in this subject.",
        );
      }

      // Remove the moving chapter from the current ordering
      const rest = chapters.filter((c) => c.id !== dto.id);

      // Resolve target index
      let targetIndex: number;

      if (dto.beforeId === dto.id) {
        throw new BadRequestException("beforeId cannot equal id.");
      }
      const idx = rest.findIndex((c) => c.id === dto.beforeId);
      if (idx === -1) {
        throw new BadRequestException(
          "beforeId does not exist in this subject.",
        );
      }
      targetIndex = idx;

      // Splice in and rewrite positions
      rest.splice(targetIndex, 0, moving);

      await Promise.all(
        rest.map((c, i) =>
          tx.chapter.update({
            where: { id: c.id },
            data: { order: i },
          }),
        ),
      );
    });
    return success("Chapter moved successfully.");
  }

  async delete(id: string) {
    const chapter = await this.prisma.chapter.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!chapter) throw new NotFoundException("Chapter not found!");

    await this.prisma.chapter.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return success("Chapter deleted successfully.");
  }

  async restore(id: string) {
    const chapter = await this.prisma.chapter.findFirst({
      where: { id, deletedAt: { not: null } },
      select: { id: true, subjectId: true },
    });
    if (!chapter) throw new NotFoundException("Chapter not found!");

    await this.assertSubjectExists(chapter.subjectId);

    await this.prisma.chapter.update({
      where: { id },
      data: { deletedAt: null },
    });
    return success("Chapter restored successfully.");
  }

  private async assertSubjectExists(subjectId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId, deletedAt: null },
      select: { id: true },
    });
    if (!subject) throw new NotFoundException("Subject not found!");
  }

  private rethrowUniqueConstraint(error: unknown): never {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException(
        "A chapter with this name already exists in the subject.",
      );
    }
    throw error;
  }
}
