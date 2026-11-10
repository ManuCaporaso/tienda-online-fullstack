import { Logger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null = null;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    this.from =
      config.get<string>('MAIL_FROM') ??
      'Patagonia Sports <no-reply@patagoniasports.com>';
    this.appUrl = (
      config.get<string>('NEXT_PUBLIC_APP_URL') ?? 'http://localhost:3000'
    ).replace(/\/$/, '');

    const host = config.get<string>('SMTP_HOST');
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASS');
    const port = Number(config.get<string>('SMTP_PORT') ?? 587);

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }
  }

  get isConfigured(): boolean {
    return this.transporter !== null;
  }

  buildVerificationUrl(token: string): string {
    return `${this.appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  }

  /**
   * Envía el mail de verificación. Si no hay SMTP configurado, deja el enlace
   * en el log y lo devuelve para poder probar el flujo en desarrollo.
   */
  async sendVerificationEmail(email: string, token: string): Promise<string> {
    const url = this.buildVerificationUrl(token);

    if (!this.transporter) {
      this.logger.warn(
        `SMTP no configurado. Enlace de verificación para ${email}: ${url}`,
      );
      return url;
    }

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: 'Confirmá tu cuenta de Patagonia Sports',
      text: `¡Bienvenido a Patagonia Sports!\n\nConfirmá tu cuenta ingresando a: ${url}\n\nSi no creaste esta cuenta, ignorá este mensaje.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #0f172a;">¡Bienvenido a Patagonia Sports!</h2>
          <p style="color: #475569; font-size: 15px;">
            Para activar tu cuenta hacé clic en el siguiente botón:
          </p>
          <p style="margin: 24px 0;">
            <a href="${url}" style="background: #059669; color: #fff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: bold;">
              Confirmar mi cuenta
            </a>
          </p>
          <p style="color: #94a3b8; font-size: 12px;">
            Si el botón no funciona, copiá este enlace: <br />${url}
          </p>
          <p style="color: #94a3b8; font-size: 12px;">
            Si no creaste esta cuenta, podés ignorar este correo.
          </p>
        </div>
      `,
    });

    return url;
  }
}
