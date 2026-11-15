import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { dataOf } from "@/common/api-response.js";
import { PrismaService } from "@/prisma/prisma.service.js";

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: { passwordHash: true },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException("User not found.");

    // Accounts created before Profile rows existed (and any signup path that
    // missed it) get one lazily on first read.
    const profile = user.profile ?? (await this.ensureProfile(id));
    return dataOf({ ...user, profile });
  }

  /**
   * Idempotent create-if-missing. Two concurrent first reads can both see no
   * row and both attempt the insert, so the unique-constraint loser re-reads
   * instead of surfacing a 500.
   */
  private async ensureProfile(userId: string) {
    try {
      return await this.prisma.profile.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return this.prisma.profile.findUniqueOrThrow({ where: { userId } });
      }
      throw error;
    }
  }
}
