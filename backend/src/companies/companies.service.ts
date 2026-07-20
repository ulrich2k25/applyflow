import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCompanyDto) {
    try {
      return await this.prisma.company.create({
        data: {
          userId,
          ...dto,
        },
      });
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Une entreprise portant ce nom existe déjà.',
        );
      }

      throw error;
    }
  }

  async findAll(userId: string) {
    return this.prisma.company.findMany({
      where: {
        userId,
        archivedAt: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findOne(userId: string, companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        userId,
      },
    });

    if (!company) {
      throw new NotFoundException('Entreprise introuvable.');
    }

    return company;
  }

  async update(userId: string, companyId: string, dto: UpdateCompanyDto) {
    await this.findOne(userId, companyId);

    try {
      return await this.prisma.company.update({
        where: {
          id: companyId,
        },
        data: dto,
      });
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Une entreprise portant ce nom existe déjà.',
        );
      }

      throw error;
    }
  }

  async archive(userId: string, companyId: string) {
    await this.findOne(userId, companyId);

    return this.prisma.company.update({
      where: {
        id: companyId,
      },
      data: {
        archivedAt: new Date(),
      },
    });
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
