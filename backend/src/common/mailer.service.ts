import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  constructor(private configService: ConfigService) {}

  private createTransport() {
    const host = this.configService.get<string>('SMTP_HOST')?.trim();
    const port = Number(this.configService.get<string>('SMTP_PORT'));
    const user = this.configService.get<string>('SMTP_USER')?.trim();
    const pass = this.configService.get<string>('SMTP_PASS')?.trim();

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // SSL cho port 465, STARTTLS cho 587
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false, // Cho phép self-signed cert trong dev
      },
    });
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const from = this.configService.get<string>('SMTP_FROM');
    const transporter = this.createTransport();

    const mailOptions = {
      from: `"HVCS.Edu - Hệ thống QLCB" <${from}>`,
      to,
      subject: '[HVCS.Edu] Mã xác nhận đặt lại mật khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 28px; font-weight: 900; color: #2563eb;">HVCS</span><span style="font-size: 28px; font-weight: 900; color: #1e293b;">.Edu</span>
          </div>
          <div style="background: white; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 12px; font-size: 20px; color: #1e293b;">Đặt lại mật khẩu</h2>
            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
              Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản HVCS.Edu. Sử dụng mã OTP bên dưới để tiếp tục:
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <span style="display: inline-block; font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #2563eb; background: #eff6ff; padding: 16px 28px; border-radius: 12px; border: 2px dashed #bfdbfe;">
                ${otp}
              </span>
            </div>
            <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0;">
              ⏱ Mã có hiệu lực trong <strong>15 phút</strong>. Không chia sẻ mã này với bất kỳ ai.
            </p>
          </div>
          <p style="text-align: center; color: #cbd5e1; font-size: 12px; margin-top: 20px;">
            Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.
          </p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (err) {
      console.error('[MailerService] Lỗi gửi email:', err);
      throw new InternalServerErrorException('Không thể gửi email OTP. Vui lòng thử lại sau.');
    }
  }
}
