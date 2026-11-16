import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { PrismaService } from "@/prisma/prisma.service.js";
import { Grade } from "@/generated/prisma/enums.js";
import { dataOf, success } from "@/common/api-response.js";

@Injectable()
export class SubjectService {
  constructor(private readonly prisma: PrismaService) {}

  async adminFindAll() {
    const subjects = await this.prisma.subject.findMany({
      orderBy: { name: "asc" },
    });
    return dataOf(subjects);
  }

  async findAll() {
    const subjects = await this.prisma.subject.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
    return dataOf(subjects);
  }

  async create(name: string, code: string, grade: Grade) {
    const normalized = this.normalizeCode(code);
    try {
      const subject = await this.prisma.subject.create({
        data: { name, code: normalized, grade },
      });
      return success("Subject created successfully.", subject);
    } catch (error) {
      await this.rethrowIfDuplicate(error, grade, normalized);
      throw error;
    }
  }

  async update(id: string, name?: string, code?: string, grade?: Grade) {
    const existingSubject = await this.prisma.subject.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existingSubject) throw new NotFoundException("Subject not found!");

    const normalized =
      code === undefined ? undefined : this.normalizeCode(code);

    try {
      const subject = await this.prisma.subject.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(normalized !== undefined && { code: normalized }),
          ...(grade !== undefined && { grade }),
        },
      });
      return success("Subject updated successfully.", subject);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          "Another subject already uses this code for that grade.",
        );
      }
      throw error;
    }
  }

  async delete(id: string) {
    await this.prisma.subject.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return success("Subject deleted successfully.");
  }

  async restore(id: string) {
    const existingSubject = await this.prisma.subject.findUnique({
      where: { id, deletedAt: { not: null } },
      select: { id: true },
    });
    if (!existingSubject)
      throw new NotFoundException("Subject not found to restore!");

    await this.prisma.subject.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
    return success("Subject restored successfully.");
  }

  /**
   * Codes are the stable identity now that `@@unique([grade, code])` replaced
   * the old name-bearing key, so whitespace would fork a subject in two.
   */
  private normalizeCode(code: string): string {
    const normalized = code.trim();
    if (!normalized) {
      throw new BadRequestException("Subject code cannot be blank.");
    }
    return normalized;
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof PrismaClientKnownRequestError && error.code === "P2002"
    );
  }

  /**
   * A soft-deleted subject still occupies its (grade, code) slot, so a plain
   * "already exists" message would leave the admin with no way forward.
   */
  private async rethrowIfDuplicate(
    error: unknown,
    grade: Grade,
    code: string,
  ): Promise<void> {
    if (!this.isUniqueViolation(error)) return;

    const existing = await this.prisma.subject.findFirst({
      where: { grade, code },
      select: { id: true, deletedAt: true },
    });
    if (existing?.deletedAt) {
      throw new ConflictException(
        `Subject ${code} for ${grade} exists but is deleted. Restore it instead: PATCH /admin/subject/${existing.id}/restore`,
      );
    }
    throw new ConflictException(`Subject ${code} already exists for ${grade}.`);
  }
}
