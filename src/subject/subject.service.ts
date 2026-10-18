import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { Grade } from "../generated/prisma/enums.js";
import { dataOf, success } from "../common/api-response.js";

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
    const subject = await this.prisma.subject.create({
      data: { name, code, grade },
    });
    return success("Subject created successfully.", subject);
  }

  async update(id: string, name?: string, code?: string, grade?: Grade) {
    const existingSubject = await this.prisma.subject.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existingSubject) throw new NotFoundException("Subject not found!");

    const subject = await this.prisma.subject.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(grade !== undefined && { grade }),
      },
    });
    return success("Subject updated successfully.", subject);
  }

  async delete(id: string) {
    await this.prisma.subject.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return success("Subject deleted successfully.");
  }
}
