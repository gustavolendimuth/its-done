import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryGlobalFilter extends BaseExceptionFilter {
  constructor(httpAdapterHost: HttpAdapterHost) {
    super(httpAdapterHost.httpAdapter);
  }

  override catch(exception: unknown, host: ArgumentsHost) {
    try {
      if (process.env.SENTRY_DSN) {
        const err =
          exception instanceof Error
            ? exception
            : new Error(
                typeof exception === 'string' ? exception : 'Unknown error',
              );
        Sentry.captureException(err);
      }
    } catch {
      // noop
    }

    super.catch(exception as any, host);
  }
}
