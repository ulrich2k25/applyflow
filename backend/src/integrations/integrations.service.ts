import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { ApplicationsService } from '../applications/applications.service';
import { CompaniesService } from '../companies/companies.service';
import { PrismaService } from '../prisma/prisma.service';
import { ImportJobApplicationDto } from './dto/import-job-application.dto';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companiesService: CompaniesService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  async createApiKey(userId: string, name = 'AI Automation') {
    const rawKey = randomBytes(32).toString('hex');
    const keyHash = createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await this.prisma.integrationApiKey.create({
      data: {
        userId,
        name: name.trim() || 'AI Automation',
        keyHash,
      },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      apiKey: rawKey,
      createdAt: apiKey.createdAt,
    };
  }

  async importApplication(userId: string, dto: ImportJobApplicationDto) {
    let company = await this.prisma.company.findFirst({
      where: {
        userId,
        name: {
          equals: dto.companyName,
          mode: 'insensitive',
        },
      },
    });

    if (!company) {
      company = await this.companiesService.create(userId, {
        name: dto.companyName,
        website: dto.companyWebsite,
        industry: dto.industry,
        city: dto.companyCity,
        country: dto.companyCountry,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
      });
    } else if (company.archivedAt !== null) {
      company = await this.prisma.company.update({
        where: { id: company.id },
        data: { archivedAt: null },
      });
    }

    if (dto.jobUrl) {
      const existingApplication = await this.prisma.application.findFirst({
        where: {
          userId,
          jobUrl: dto.jobUrl,
          archivedAt: null,
        },
        include: {
          company: true,
        },
      });

      if (existingApplication) {
        return {
          imported: false,
          reason: 'already_exists',
          application: existingApplication,
        };
      }
    }

    const application = await this.applicationsService.create(userId, {
      companyId: company.id,
      jobTitle: dto.jobTitle,
      jobUrl: dto.jobUrl,
      description: dto.description,
      location: dto.location,
      employmentType: dto.employmentType,
      workMode: dto.workMode,
      source: dto.source ?? 'AI_AUTOMATION',
      salaryMin: dto.salaryMin,
      salaryMax: dto.salaryMax,
      currency: dto.currency,
      deadline: dto.deadline,
    });

    return {
      imported: true,
      application,
    };
  }
}
