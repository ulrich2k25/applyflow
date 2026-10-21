import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

type IntegrationRequest = {
  headers: {
    [key: string]: string | string[] | undefined;
  };
  integrationUserId?: string;
};

@Injectable()
export class IntegrationApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<IntegrationRequest>();

    const header = request.headers['x-api-key'];
    const apiKey = Array.isArray(header) ? header[0] : header;

    if (!apiKey) {
      throw new UnauthorizedException('Clé d’intégration manquante.');
    }

    const keyHash = createHash('sha256').update(apiKey).digest('hex');

    const storedKey = await this.prisma.integrationApiKey.findFirst({
      where: {
        keyHash,
        revokedAt: null,
      },
    });

    if (!storedKey) {
      throw new UnauthorizedException('Clé d’intégration invalide.');
    }

    request.integrationUserId = storedKey.userId;

    await this.prisma.integrationApiKey.update({
      where: {
        id: storedKey.id,
      },
      data: {
        lastUsedAt: new Date(),
      },
    });

    return true;
  }
}
