import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { normalizeUrl } from '../utils/url';

@Injectable()
export class NotificationsService {
  private resend: Resend;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const resendApiKey = this.configService.get('RESEND_API_KEY');
    if (!resendApiKey || resendApiKey === 'your-resend-api-key') {
      console.warn('⚠️  RESEND_API_KEY não configurada ou usando valor padrão');
    } else {
      console.log('✅ Resend API configurada');
    }
    this.resend = new Resend(resendApiKey);
  }

  async sendHoursThresholdAlert(userId: string, totalHours: number) {
    // Buscar configurações do usuário
    const settings = await this.prisma.settings.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!settings || !settings.notificationEmail) {
      return false;
    }

    // Verificar se deve enviar alerta
    if (totalHours >= settings.alertHours) {
      try {
        await this.sendEmail({
          to: settings.notificationEmail,
          subject: 'Hours Threshold Reached - Its Done',
          html: this.generateHoursThresholdEmailTemplate(
            settings.user.name,
            totalHours,
            settings.alertHours,
          ),
        });

        console.log(
          `Hours threshold alert sent to ${settings.notificationEmail} - ${totalHours}h/${settings.alertHours}h`,
        );

        return true;
      } catch (error) {
        console.error('Failed to send hours threshold alert:', error);
        return false;
      }
    }

    return false;
  }

  async sendInvoiceUploadNotification(clientEmail: string, invoiceId: string) {
    try {
      await this.sendEmail({
        to: clientEmail,
        subject: 'New Invoice Available - Its Done',
        html: this.generateInvoiceNotificationEmailTemplate(invoiceId),
      });

      console.log(
        `Invoice notification sent to ${clientEmail} for invoice ${invoiceId}`,
      );

      return true;
    } catch (error) {
      console.error('Failed to send invoice notification:', error);
      return false;
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string) {
    try {
      await this.sendEmail({
        to: userEmail,
        subject: 'Welcome to Its Done!',
        html: this.generateWelcomeEmailTemplate(userName),
      });

      console.log(`Welcome email sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetToken: string,
  ) {
    try {
      console.log(
        `📧 Iniciando envio de email de reset de senha para: ${userEmail}`,
      );

      const frontendUrl = normalizeUrl(
        this.configService.get('FRONTEND_URL') || 'localhost:3000',
      );
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
      const isDevelopment =
        this.configService.get('NODE_ENV') === 'development';

      console.log(`🔗 URL de reset gerada: ${resetUrl}`);
      console.log(`🔧 Modo desenvolvimento: ${isDevelopment}`);

      // Em modo desenvolvimento, o Resend pode ter restrições
      if (isDevelopment) {
        console.log(
          `⚠️  ATENÇÃO: Em modo desenvolvimento, o Resend pode restringir o envio apenas para o email do proprietário da conta`,
        );
        console.log(
          `📝 Para receber emails em desenvolvimento, use o email cadastrado na conta Resend`,
        );
      }

      const emailResult = await this.sendEmail({
        to: userEmail,
        subject: 'Reset Your Password - Its Done',
        html: this.generatePasswordResetEmailTemplate(userName, resetUrl),
      });

      console.log(
        `✅ Email de reset de senha enviado com sucesso para ${userEmail}`,
      );
      console.log(`📊 Resend Response:`, emailResult);

      return true;
    } catch (error) {
      console.error(
        `❌ Falha ao enviar email de reset de senha para ${userEmail}:`,
        error,
      );

      // Log detalhado do erro
      if (error.response) {
        console.error('📄 Resposta do erro:', error.response.data);
      }
      if (error.message) {
        console.error('💬 Mensagem do erro:', error.message);
      }

      // Dicas específicas para erros comuns do Resend
      if (
        error.message?.includes('403') ||
        error.message?.includes('validation_error')
      ) {
        console.error(
          `🔍 DICA: Em desenvolvimento, o Resend só permite envio para o email verificado na conta`,
        );
        console.error(
          `📧 Verifique se o email ${userEmail} está associado à conta Resend ou adicione um domínio verificado`,
        );
      }

      return false;
    }
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
  }) {
    const fromEmail =
      this.configService.get('FROM_EMAIL') || 'noreply@its-done.com';
    const resendApiKey = this.configService.get('RESEND_API_KEY');

    console.log(`📨 Configurações de email:`);
    console.log(`   - De: ${fromEmail}`);
    console.log(`   - Para: ${options.to}`);
    console.log(`   - Assunto: ${options.subject}`);
    console.log(`   - API Key configurada: ${resendApiKey ? 'Sim' : 'Não'}`);

    if (!resendApiKey || resendApiKey === 'your-resend-api-key') {
      throw new Error('RESEND_API_KEY não configurada corretamente');
    }

    try {
      const result = await this.resend.emails.send({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      console.log(`✅ Email enviado via Resend:`, result);
      return result;
    } catch (resendError) {
      console.error(`❌ Erro do Resend:`, resendError);
      throw resendError;
    }
  }

  private generateHoursThresholdEmailTemplate(
    userName: string,
    totalHours: number,
    threshold: number,
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hours Threshold Reached</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8fafc; }
          .alert { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; }
          .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Its Done - Hours Alert</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>
          <div class="alert">
            <strong>Hours Threshold Reached!</strong><br>
            You have logged <strong>${totalHours} hours</strong>, which has reached your configured threshold of <strong>${threshold} hours</strong>.
          </div>
          <p>This is an automated notification to help you track your work hours effectively.</p>
          <p>You can adjust your notification settings anytime in your dashboard.</p>
        </div>
        <div class="footer">
          <p>Best regards,<br>The Its Done Team</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateInvoiceNotificationEmailTemplate(invoiceId: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Invoice Available</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8fafc; }
          .invoice-info { background-color: #e0f2fe; border-left: 4px solid #0284c7; padding: 16px; margin: 20px 0; }
          .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Its Done - New Invoice</h1>
        </div>
        <div class="content">
          <h2>Hello,</h2>
          <div class="invoice-info">
            <strong>New Invoice Available!</strong><br>
            Invoice ID: <strong>${invoiceId}</strong>
          </div>
          <p>A new invoice has been uploaded and is now available for your review.</p>
          <p>Please log in to your client dashboard to view and download the invoice.</p>
        </div>
        <div class="footer">
          <p>Best regards,<br>The Its Done Team</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeEmailTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Its Done</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8fafc; }
          .welcome { background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 16px; margin: 20px 0; }
          .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to Its Done!</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>
          <div class="welcome">
            <strong>Welcome to Its Done!</strong><br>
            Your time tracking account has been successfully created.
          </div>
          <p>You can now:</p>
          <ul>
            <li>Track your work hours</li>
            <li>Manage clients and projects</li>
            <li>Generate reports and analytics</li>
            <li>Configure notification settings</li>
          </ul>
          <p>Get started by logging your first work session!</p>
        </div>
        <div class="footer">
          <p>Best regards,<br>The Its Done Team</p>
        </div>
      </body>
      </html>
    `;
  }

  private generatePasswordResetEmailTemplate(
    userName: string,
    resetUrl: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .button:hover { background-color: #0056b3; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>We received a request to reset your password for your Its Done account. If you didn't make this request, you can safely ignore this email.</p>
            <p>To reset your password, click the button below:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">${resetUrl}</p>
            <div class="warning">
              <strong>Important:</strong> This link will expire in 1 hour for security reasons.
            </div>
            <p>If you continue to have problems, please contact our support team.</p>
            <p>Best regards,<br>The Its Done Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
