import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>('RESEND_API_KEY'),
    );
    this.from = this.configService.getOrThrow<string>('EMAIL_FROM');
    this.frontendUrl = this.configService
      .getOrThrow<string>('FRONTEND_URL')
      .replace(/\/$/, '');
  }

  async sendVerificationEmail(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;

    await this.send({
      to: email,
      subject: 'Vérifiez votre adresse e-mail ApplyFlow',
      html: this.buildTemplate(
        `Bienvenue ${escapeHtml(firstName)} !`,
        'Confirmez votre adresse e-mail pour activer votre compte ApplyFlow.',
        'Vérifier mon adresse e-mail',
        verificationUrl,
        'Ce lien expire dans 24 heures.',
      ),
    });
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await this.send({
      to: email,
      subject: 'Réinitialisez votre mot de passe ApplyFlow',
      html: this.buildTemplate(
        `Bonjour ${escapeHtml(firstName)},`,
        'Une réinitialisation du mot de passe de votre compte ApplyFlow a été demandée.',
        'Choisir un nouveau mot de passe',
        resetUrl,
        "Ce lien expire dans une heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
      ),
    });
  }

  private async send(input: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (error) {
      throw new InternalServerErrorException(
        "L'e-mail n'a pas pu être envoyé.",
      );
    }
  }

  private buildTemplate(
    title: string,
    message: string,
    buttonLabel: string,
    url: string,
    footer: string,
  ): string {
    return `
      <!doctype html>
      <html lang="fr">
        <body style="margin:0;background:#f6f7fb;font-family:Arial,sans-serif;color:#111827">
          <div style="max-width:600px;margin:0 auto;padding:40px 20px">
            <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px">
              <h1 style="margin:0 0 20px;font-size:26px">${title}</h1>
              <p style="font-size:16px;line-height:1.6;color:#4b5563">${message}</p>
              <a href="${url}" style="display:inline-block;margin:18px 0;padding:14px 22px;background:#5538f5;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700">${buttonLabel}</a>
              <p style="font-size:13px;line-height:1.6;color:#6b7280">${footer}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
