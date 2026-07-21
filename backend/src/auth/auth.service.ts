import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { AuthTokenType } from '../generated/prisma/enums';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const VERIFICATION_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_LIFETIME_MS = 60 * 60 * 1000;
const GENERIC_EMAIL_MESSAGE =
  'Si un compte correspond à cette adresse, un e-mail va être envoyé.';

async function hashPassword(password: string): Promise<string> {
  const result: unknown = await argon2.hash(password);

  if (typeof result !== 'string') {
    throw new Error('La génération du hash du mot de passe a échoué.');
  }

  return result;
}

function createToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(raw).digest('hex');

  return { raw, hash };
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException(
        'Un compte existe déjà avec cette adresse e-mail.',
      );
    }

    const passwordHash = await hashPassword(dto.password);
    const token = createToken();
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_LIFETIME_MS);

    const user = await this.prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      await transaction.authToken.create({
        data: {
          userId: createdUser.id,
          type: AuthTokenType.EMAIL_VERIFICATION,
          tokenHash: token.hash,
          expiresAt,
        },
      });

      return createdUser;
    });

    try {
      await this.mailService.sendVerificationEmail(
        user.email,
        user.firstName,
        token.raw,
      );
    } catch (error: unknown) {
      this.logger.warn(
        `Compte créé sans e-mail de vérification pour ${user.email}: ${
          error instanceof Error ? error.message : 'erreur inconnue'
        }`,
      );
    }

    return {
      message: 'Compte créé. Vous pouvez maintenant vous connecter.',
      email: user.email,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException(
        'Adresse e-mail ou mot de passe incorrect.',
      );
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Adresse e-mail ou mot de passe incorrect.',
      );
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async verifyEmail(token: string) {
    const tokenHash = hashToken(token);
    const storedToken = await this.prisma.authToken.findFirst({
      where: {
        tokenHash,
        type: AuthTokenType.EMAIL_VERIFICATION,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException(
        'Le lien de vérification est invalide ou a expiré.',
      );
    }

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: storedToken.userId },
        data: { emailVerifiedAt: now },
      }),
      this.prisma.authToken.updateMany({
        where: {
          userId: storedToken.userId,
          type: AuthTokenType.EMAIL_VERIFICATION,
          usedAt: null,
        },
        data: { usedAt: now },
      }),
    ]);

    return { message: 'Adresse e-mail vérifiée. Vous pouvez vous connecter.' };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user || user.emailVerifiedAt) {
      return { message: GENERIC_EMAIL_MESSAGE };
    }

    const token = await this.replaceToken(
      user.id,
      AuthTokenType.EMAIL_VERIFICATION,
      VERIFICATION_TOKEN_LIFETIME_MS,
    );

    await this.sendWithoutDisclosure(() =>
      this.mailService.sendVerificationEmail(user.email, user.firstName, token),
    );

    return { message: GENERIC_EMAIL_MESSAGE };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return { message: GENERIC_EMAIL_MESSAGE };
    }

    const token = await this.replaceToken(
      user.id,
      AuthTokenType.PASSWORD_RESET,
      PASSWORD_RESET_TOKEN_LIFETIME_MS,
    );

    await this.sendWithoutDisclosure(() =>
      this.mailService.sendPasswordResetEmail(
        user.email,
        user.firstName,
        token,
      ),
    );

    return { message: GENERIC_EMAIL_MESSAGE };
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = hashToken(token);
    const storedToken = await this.prisma.authToken.findFirst({
      where: {
        tokenHash,
        type: AuthTokenType.PASSWORD_RESET,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException(
        'Le lien de réinitialisation est invalide ou a expiré.',
      );
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: storedToken.userId },
        data: { passwordHash },
      }),
      this.prisma.authToken.updateMany({
        where: {
          userId: storedToken.userId,
          type: AuthTokenType.PASSWORD_RESET,
          usedAt: null,
        },
        data: { usedAt: now },
      }),
    ]);

    return {
      message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.',
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException(
        'Utilisateur introuvable ou session invalide.',
      );
    }

    return user;
  }

  private async replaceToken(
    userId: string,
    type: AuthTokenType,
    lifetimeMs: number,
  ): Promise<string> {
    const token = createToken();
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.authToken.updateMany({
        where: { userId, type, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.authToken.create({
        data: {
          userId,
          type,
          tokenHash: token.hash,
          expiresAt: new Date(now.getTime() + lifetimeMs),
        },
      }),
    ]);

    return token.raw;
  }

  private async sendWithoutDisclosure(send: () => Promise<void>) {
    try {
      await send();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erreur inconnue';
      this.logger.error(`Échec de l'envoi d'un e-mail : ${message}`);
    }
  }
}
