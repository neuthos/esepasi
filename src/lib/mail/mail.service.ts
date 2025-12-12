import nodemailer from "nodemailer";
import {logger} from "../logger";

class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendResetPasswordEmail(to: string, token: string) {
    const host = process.env.HOST || "http://localhost:3555";
    const resetLink = `${host}/auth/reset-password?token=${token}`;

    if (process.env.NODE_ENV === "development") {
      logger.info(`Password Reset Link for ${to}:`);
      logger.info(resetLink);
    }

    // Only send real email if SMTP_USER is configured
    if (process.env.SMTP_USER) {
      try {
        await this.transporter.sendMail({
          from: '"ESepasi Support" <no-reply@esepasi.com>',
          to,
          subject: "Reset Password - ESepasi",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Reset Password</h2>
              <p>Anda menerima email ini karena ada permintaan reset password untuk akun Anda.</p>
              <p>Silakan klik tombol di bawah ini untuk mereset password Anda:</p>
              <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #1677ff; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Reset Password</a>
              <p style="margin-top: 20px;">Atau copy link berikut:</p>
              <p>${resetLink}</p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan email ini.</p>
            </div>
          `,
        });
        console.log(`Email sent to ${to}`);
      } catch (error) {
        console.error("Failed to send email:", error);
        // Note: We don't throw error here to avoid blocking the user flow
        // The detailed error is logged for debugging
      }
    }
  }
}

export const mailService = new MailService();
