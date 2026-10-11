import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  from: string = 'PyinNyar <noreply@tettoewai.com>';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error(
        'RESEND_API_KEY is not defined in the environment variables.',
      );
    }
    this.resend = new Resend(apiKey);
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
    from: string = this.from,
  ) {
    try {
      const { data, error } = await this.resend.emails.send({
        from,
        to,
        subject,
        html,
        text,
      });
      if (error) {
        throw new InternalServerErrorException(
          `Failed to send email: ${error.message}`,
        );
      }

      return data;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'Failed to send email',
      );
    }
  }
}
