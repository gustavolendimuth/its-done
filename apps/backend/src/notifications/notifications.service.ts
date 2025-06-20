import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class NotificationsService {
  private resend: Resend;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.resend = new Resend(this.configService.get('RESEND_API_KEY'));
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

  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
  }) {
    const fromEmail =
      this.configService.get('FROM_EMAIL') || 'noreply@its-done.com';

    return await this.resend.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
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
}
