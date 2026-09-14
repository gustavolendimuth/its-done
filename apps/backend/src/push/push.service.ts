import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actions?: { action: string; title: string }[];
}

@Injectable()
export class PushService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    const publicKey = this.configService.get('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get('VAPID_PRIVATE_KEY');
    const subject = this.configService.get('VAPID_SUBJECT');

    if (publicKey && privateKey && subject) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    }
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    await Promise.all(
      subscriptions.map((subscription) =>
        this.sendToSubscription(subscription, payload),
      ),
    );
  }

  private async sendToSubscription(
    subscription: {
      id: string;
      endpoint: string;
      p256dh: string;
      auth: string;
    },
    payload: PushPayload,
  ): Promise<void> {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify(payload),
      );
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        // Stale/expired subscription (WKT-08) — remove it so future sends
        // don't keep retrying against a dead endpoint.
        await this.prisma.pushSubscription.delete({
          where: { id: subscription.id },
        });
        return;
      }
      // Other errors: one dead/misbehaving subscription must not stop
      // delivery to the user's other subscriptions.
      console.error(`Failed to send push to ${subscription.id}:`, error);
    }
  }
}
