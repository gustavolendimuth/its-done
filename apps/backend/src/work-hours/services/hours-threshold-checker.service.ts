import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { InAppNotificationsService } from '../../in-app-notifications/in-app-notifications.service';
import { DraftInvoiceService } from './draft-invoice.service';

@Injectable()
export class HoursThresholdCheckerService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private inAppNotificationsService: InAppNotificationsService,
    private draftInvoiceService: DraftInvoiceService,
  ) {}

  /**
   * Check if any company has reached hours threshold and send notification if needed
   * Creates draft invoice automatically for companies that reach threshold
   * Prevents spam by checking if notification was already sent for this threshold
   */
  async checkAndNotify(userId: string): Promise<void> {
    try {
      // Get user settings
      const settings = await this.prisma.settings.findUnique({
        where: { userId },
      });

      console.log('🔍 Checking notification for user:', userId);
      console.log('⚙️  Settings:', settings);

      const defaultAlertHours = settings?.alertHours;

      if (!defaultAlertHours) {
        console.log('❌ No default alertHours configured');
        // Still check for project-specific thresholds
      }

      // Calculate hours per company and project for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get all work hours grouped by company and project for this month
      const workHoursByCompanyAndProject = await this.prisma.workHour.groupBy({
        by: ['companyId', 'projectId'],
        where: {
          userId,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: {
          hours: true,
        },
      });

      console.log(
        `📊 Work hours by company and project:`,
        workHoursByCompanyAndProject,
      );

      // Check each company/project combination
      for (const data of workHoursByCompanyAndProject) {
        const totalHours = data._sum.hours || 0;
        let threshold = defaultAlertHours;

        // If there's a project, check if it has a custom alertHours
        if (data.projectId) {
          const project = await this.prisma.project.findUnique({
            where: { id: data.projectId },
            select: { alertHours: true },
          });

          if (
            project?.alertHours !== null &&
            project?.alertHours !== undefined
          ) {
            threshold = project.alertHours;
            console.log(
              `📌 Using project-specific threshold: ${threshold}h for project ${data.projectId}`,
            );
          }
        }

        // Skip if no threshold is defined (neither default nor project-specific)
        if (!threshold) {
          console.log(
            `⏭️  No threshold defined for company ${data.companyId}, project ${data.projectId}`,
          );
          continue;
        }

        await this.checkCompanyProjectThreshold(
          userId,
          data.companyId,
          data.projectId,
          totalHours,
          threshold,
          settings?.notificationEmail,
          startOfMonth,
          endOfMonth,
        );
      }
    } catch (error) {
      console.error('❌ Error checking hours threshold notification:', error);
      throw error;
    }
  }

  /**
   * Check threshold for a specific company/project combination
   */
  private async checkCompanyProjectThreshold(
    userId: string,
    companyId: string,
    projectId: string | null,
    totalHours: number,
    threshold: number,
    notificationEmail: string | null | undefined,
    startOfMonth: Date,
    endOfMonth: Date,
  ): Promise<void> {
    const projectInfo = projectId ? `project ${projectId}` : 'no project';
    console.log(
      `\n👤 Checking company ${companyId} (${projectInfo}): ${totalHours}h`,
    );

    if (totalHours < threshold) {
      console.log(
        `⏭️  Company ${companyId} (${projectInfo}) has not reached threshold yet (${totalHours}h < ${threshold}h)`,
      );
      return;
    }

    // Check if notification was already sent for this company/project and threshold this month
    const existingNotification = await this.prisma.notificationLog.findFirst({
      where: {
        userId,
        companyId,
        type: 'HOURS_THRESHOLD',
        threshold,
        sentAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    if (existingNotification) {
      console.log(
        `⏭️  Notification already sent for company ${companyId} (${projectInfo}) this month`,
      );
      return;
    }

    // Threshold reached and notification not sent yet
    console.log(
      `✉️  Company ${companyId} (${projectInfo}) reached threshold! Creating draft invoice and sending notification...`,
    );

    // Get company info
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      console.log(`❌ Company ${companyId} not found`);
      return;
    }

    // Get available hours for this company (and optionally project) this month
    const availableHours = await this.getAvailableHours(
      userId,
      companyId,
      startOfMonth,
      endOfMonth,
      projectId,
    );

    if (availableHours.length === 0) {
      console.log(
        `❌ No available hours found for company ${companyId} (${projectInfo})`,
      );
      return;
    }

    // Create draft invoice
    const draftInvoice = await this.draftInvoiceService.createDraft(
      userId,
      companyId,
      availableHours,
    );

    console.log(`📄 Draft invoice created: ${draftInvoice.id}`);

    // Send email notification if configured
    if (notificationEmail) {
      await this.notificationsService.sendHoursThresholdAlert(
        userId,
        totalHours,
      );
    }

    // Create in-app notification with link to draft invoice
    const companyName = company.name || company.company;
    await this.inAppNotificationsService.createHoursThresholdNotification(
      userId,
      totalHours,
      threshold,
      companyName,
      draftInvoice.id,
    );

    // Log the notification
    await this.prisma.notificationLog.create({
      data: {
        userId,
        companyId,
        type: 'HOURS_THRESHOLD',
        threshold,
        totalHours,
      },
    });

    console.log(
      `✅ Notification sent for company ${companyName} (${projectInfo})!`,
    );
  }

  /**
   * Get available work hours (not yet in any invoice) for a company in a date range
   */
  private async getAvailableHours(
    userId: string,
    companyId: string,
    startDate: Date,
    endDate: Date,
    projectId?: string | null,
  ) {
    return this.prisma.workHour.findMany({
      where: {
        userId,
        companyId,
        ...(projectId !== undefined ? { projectId } : {}),
        date: {
          gte: startDate,
          lte: endDate,
        },
        invoiceWorkHours: {
          none: {},
        },
      },
      include: {
        company: true,
        project: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }
}
