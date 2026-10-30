import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { dataOf, success } from "../common/api-response.js";
import { Prisma } from "../generated/prisma/client.js";
import { Grade, KycStatus } from "../generated/prisma/enums.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { CryptoService } from "../common/crypto.service.js";

@Injectable()
export class KycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}
  async getAll(
    search?: string,
    status?: KycStatus,
    grade?: Grade,
    page?: number,
    limit?: number,
  ) {
    const conditions: Prisma.StudentKycWhereInput[] = [];
    if (search)
      conditions.push({
        user: { name: { contains: search, mode: "insensitive" } },
      });
    if (grade) conditions.push({ user: { grade: grade } });
    if (status) conditions.push({ status: status });

    const where: Prisma.StudentKycWhereInput = { AND: conditions };
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;
    const kyc = await this.prisma.studentKyc.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        userId: true,
        school: true,
        region: true,
        status: true,

        user: {
          select: { id: true, name: true, grade: true },
        },
      },
    });
    return kyc.map((item) => {
      return {
        ...item,
        school: this.crypto.decrypt(item.school),
        region: this.crypto.decrypt(item.region),
      };
    });
  }

  async get(kycId: string) {
    const kyc = await this.prisma.studentKyc.findUnique({
      where: { id: kycId },
      include: {
        preferredSubjects: {
          select: {
            name: true,
            code: true,
            grade: true,
          },
        },
        user: {
          select: {
            name: true,
            userName: true,
            grade: true,
          },
        },
        reviewedBy: {
          select: { id: true, name: true, userName: true },
        },
      },
    });

    if (!kyc) throw new NotFoundException("KYC not found");
    return dataOf({
      id: kyc.id,
      status: kyc.status,
      user: kyc.user,
      docNumber: this.crypto.decrypt(kyc.docNumber),
      school: this.crypto.decrypt(kyc.school),
      region: this.crypto.decrypt(kyc.region),
      gender: this.crypto.decrypt(kyc.gender),
      dateOfBirth: this.crypto.decrypt(kyc.dateOfBirth),
      guardianPhone: this.crypto.decrypt(kyc.guardianPhone),
      docType: kyc.docType,
      preferredSubjects: kyc.preferredSubjects,
      createdAt: kyc.createdAt,
      reviewedAt: kyc.reviewedAt,
      reviewedBy: kyc.reviewedBy,
      rejectionNote: kyc.rejectionNote,
    });
  }

  async updateStatus(
    kycId: string,
    status: KycStatus,
    adminId: string,
    note?: string,
  ) {
    const kyc = await this.prisma.studentKyc.findUnique({
      where: { id: kycId, status: KycStatus.PENDING },
    });

    if (!kyc) throw new NotFoundException("Pending KYC not found");
    if (
      status === KycStatus.REJECTED &&
      (!note || note.trim().split(/\s+/).length < 3)
    )
      throw new BadRequestException(
        "Rejection note is required to reject a KYC and must be at least 3 words",
      );

    await this.prisma.studentKyc.update({
      where: { id: kycId },
      data: {
        status,
        ...(status === KycStatus.REJECTED && note
          ? { rejectionNote: note }
          : {}),
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });
    return success("KYC status updated successfully");
  }
}
