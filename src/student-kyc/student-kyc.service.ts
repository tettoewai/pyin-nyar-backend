import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { dataOf, success } from "../common/api-response.js";
import { CryptoService } from "../kyc/crypto.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateStudentKycDto } from "./dto/create-student-kyc.dto.js";
import { UpdateStudentKycDto } from "./dto/update-student-kyc.dto.js";
import { KycStatus } from "../generated/prisma/enums.js";

@Injectable()
export class StudentKycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async create(userId: string, dto: CreateStudentKycDto) {
    const existingKyc = await this.prisma.studentKyc.findFirst({
      where: { userId },
    });
    if (existingKyc) throw new ConflictException("KYC already submitted.");

    const subject = await this.prisma.subject.findMany({
      where: { id: { in: dto.preferredSubjects }, deletedAt: null },
      select: { id: true },
    });
    if (subject.length !== dto.preferredSubjects.length)
      throw new NotFoundException("One or more subject do not exist.");

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { name: dto.name, grade: dto.grade },
          select: { id: true },
        });
        await tx.studentKyc.create({
          data: {
            userId,
            dateOfBirth: this.crypto.encrypt(dto.dateOfBirth),
            gender: this.crypto.encrypt(dto.gender),
            docType: dto.docType,
            docNumber: this.crypto.encrypt(dto.docNumber),
            docNumberIndex: this.crypto.blindIndex(dto.docNumber),
            school: this.crypto.encrypt(dto.school),
            region: this.crypto.encrypt(dto.region),
            guardianPhone: this.crypto.encrypt(dto.guardianPhone),
            preferredSubjects: { connect: subject.map((s) => ({ id: s.id })) },
          },
          select: {
            id: true,
          },
        });
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Document number already registered.");
      }
      throw error;
    }
    return success("Kyc submitted successfully.");
  }

  async findMine(userId: string) {
    const kyc = await this.prisma.studentKyc.findFirst({
      where: { userId },
      include: { preferredSubjects: { select: { id: true, name: true } } },
    });
    if (!kyc) throw new NotFoundException("KYC not found.");
    return dataOf({
      ...this.toSafe(kyc),
      dateOfBirth: this.crypto.decrypt(kyc.dateOfBirth),
      gender: this.crypto.decrypt(kyc.gender),
      docNumber: this.crypto.decrypt(kyc.docNumber),
      school: this.crypto.decrypt(kyc.school),
      region: this.crypto.decrypt(kyc.region),
      guardianPhone: this.crypto.decrypt(kyc.guardianPhone),
    });
  }

  // Response shape that never leaks ciphertext or raw numbers
  private toSafe(kyc: any) {
    return {
      id: kyc.id,
      status: kyc.status,
      docType: kyc.docType,
      preferredSubjects: kyc.preferredSubjects,
      createdAt: kyc.createdAt,
    };
  }

  async update(userId: string, dto: UpdateStudentKycDto) {
    const existingKyc = await this.prisma.studentKyc.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });
    if (!existingKyc) throw new NotFoundException("KYC not found.");

    let subjects: { id: string }[] | undefined;
    if (dto.preferredSubjects !== undefined) {
      const found = await this.prisma.subject.findMany({
        where: { id: { in: dto.preferredSubjects }, deletedAt: null },
        select: { id: true },
      });
      if (found.length !== dto.preferredSubjects.length)
        throw new NotFoundException("One or more subject do not exist.");
      subjects = found;
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.grade !== undefined && { grade: dto.grade }),
          },
        });
        await tx.studentKyc.update({
          where: { userId },
          data: {
            ...(dto.dateOfBirth !== undefined && {
              dateOfBirth: this.crypto.encrypt(dto.dateOfBirth),
            }),
            ...(dto.gender !== undefined && {
              gender: this.crypto.encrypt(dto.gender),
            }),
            ...(dto.docType !== undefined && {
              docType: dto.docType,
            }),
            ...(dto.docNumber !== undefined && {
              docNumber: this.crypto.encrypt(dto.docNumber),
              docNumberIndex: this.crypto.blindIndex(dto.docNumber),
            }),
            ...(dto.school !== undefined && {
              school: this.crypto.encrypt(dto.school),
            }),
            ...(dto.region !== undefined && {
              region: this.crypto.encrypt(dto.region),
            }),
            ...(dto.guardianPhone !== undefined && {
              guardianPhone: this.crypto.encrypt(dto.guardianPhone),
            }),
            ...(subjects !== undefined && {
              preferredSubjects: { set: subjects.map((s) => ({ id: s.id })) },
            }),
            status: KycStatus.PENDING, // Get back to pending when user update their kyc
          },
          select: { id: true },
        });
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Document number already registered.");
      }
      throw error;
    }
    return success("Kyc updated successfully.");
  }
}
