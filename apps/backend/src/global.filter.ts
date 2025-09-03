import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { SentryExceptionCaptured } from '@sentry/nestjs';

@Catch()
export class YourCatchAllExceptionFilter implements ExceptionFilter {
  private readonly baseFilter: BaseExceptionFilter;

  constructor(httpAdapterHost: HttpAdapterHost) {
    this.baseFilter = new BaseExceptionFilter(httpAdapterHost.httpAdapter);
  }

  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost): void {
    // After Sentry captures the exception, delegate to Nest's default handler
    this.baseFilter.catch(exception as any, host);
  }
}
