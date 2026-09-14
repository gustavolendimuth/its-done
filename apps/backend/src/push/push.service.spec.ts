import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PushService } from './push.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('web-push');

describe('PushService', () => {
  let service: PushService;
  let prisma: {
    pushSubscription: {
      findMany: jest.Mock;
      delete: jest.Mock;
    };
  };

  const subscriptionA = {
    id: 'sub-a',
    userId: 'user-1',
    endpoint: 'https://push.example.com/a',
    p256dh: 'p256dh-a',
    auth: 'auth-a',
    userAgent: null,
    createdAt: new Date(),
  };
  const subscriptionB = {
    id: 'sub-b',
    userId: 'user-1',
    endpoint: 'https://push.example.com/b',
    p256dh: 'p256dh-b',
    auth: 'auth-b',
    userAgent: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      pushSubscription: {
        findMany: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              ({
                VAPID_PUBLIC_KEY: 'public-key',
                VAPID_PRIVATE_KEY: 'private-key',
                VAPID_SUBJECT: 'mailto:test@its-done.com',
              })[key],
          },
        },
      ],
    }).compile();

    service = module.get(PushService);
  });

  it('sends the payload to every subscription of the user', async () => {
    prisma.pushSubscription.findMany.mockResolvedValue([
      subscriptionA,
      subscriptionB,
    ]);
    (webpush.sendNotification as jest.Mock).mockResolvedValue(undefined);

    const payload = { title: 'Still working?', body: 'Reply to continue' };
    await service.sendToUser('user-1', payload);

    expect(prisma.pushSubscription.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
    expect(webpush.sendNotification).toHaveBeenCalledWith(
      {
        endpoint: subscriptionA.endpoint,
        keys: { p256dh: subscriptionA.p256dh, auth: subscriptionA.auth },
      },
      JSON.stringify(payload),
    );
    expect(webpush.sendNotification).toHaveBeenCalledWith(
      {
        endpoint: subscriptionB.endpoint,
        keys: { p256dh: subscriptionB.p256dh, auth: subscriptionB.auth },
      },
      JSON.stringify(payload),
    );
  });

  it('removes the subscription from the DB on a 410 response', async () => {
    prisma.pushSubscription.findMany.mockResolvedValue([subscriptionA]);
    const error: Error & { statusCode: number } = Object.assign(
      new Error('Gone'),
      { statusCode: 410 },
    );
    (webpush.sendNotification as jest.Mock).mockRejectedValue(error);

    await service.sendToUser('user-1', { title: 't', body: 'b' });

    expect(prisma.pushSubscription.delete).toHaveBeenCalledWith({
      where: { id: subscriptionA.id },
    });
  });

  it('removes the subscription from the DB on a 404 response', async () => {
    prisma.pushSubscription.findMany.mockResolvedValue([subscriptionA]);
    const error: Error & { statusCode: number } = Object.assign(
      new Error('Not Found'),
      { statusCode: 404 },
    );
    (webpush.sendNotification as jest.Mock).mockRejectedValue(error);

    await service.sendToUser('user-1', { title: 't', body: 'b' });

    expect(prisma.pushSubscription.delete).toHaveBeenCalledWith({
      where: { id: subscriptionA.id },
    });
  });

  it('keeps the subscription for other error codes', async () => {
    prisma.pushSubscription.findMany.mockResolvedValue([subscriptionA]);
    const error: Error & { statusCode: number } = Object.assign(
      new Error('Server Error'),
      { statusCode: 500 },
    );
    (webpush.sendNotification as jest.Mock).mockRejectedValue(error);

    await service.sendToUser('user-1', { title: 't', body: 'b' });

    expect(prisma.pushSubscription.delete).not.toHaveBeenCalled();
  });
});
