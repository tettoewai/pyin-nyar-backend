import { Injectable, NotFoundException } from "@nestjs/common";
import { dataOf } from "../common/api-response.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: { passwordHash: true },
    });
    if (!user) throw new NotFoundException("User not found.");
    return dataOf(user);
  }
}
