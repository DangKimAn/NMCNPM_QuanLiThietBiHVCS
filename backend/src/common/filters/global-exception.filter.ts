import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

/**
 * Global HTTP Exception Filter
 *
 * Bắt tất cả exception (HttpException + runtime errors),
 * chuẩn hóa response JSON, và ghi log nhất quán.
 *
 * Response format:
 * {
 *   statusCode: number,
 *   message:    string | string[],
 *   error:      string,
 *   timestamp:  string,
 *   path:       string,
 * }
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Lỗi server nội bộ';
    let errorName = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const obj = exceptionResponse as Record<string, unknown>;
        message = (obj['message'] as string | string[]) ?? exception.message;
        errorName = (obj['error'] as string) ?? exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorName = exception.name;
    }

    const errorBody = {
      statusCode,
      message,
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log 5xx là error, 4xx là warn
    if (statusCode >= 500) {
      this.logger.error(
        `[Exception] ${request.method} ${request.url} → ${statusCode}`,
        {
          ...errorBody,
          stack: exception instanceof Error ? exception.stack : undefined,
        },
      );
    } else {
      this.logger.warn(
        `[Exception] ${request.method} ${request.url} → ${statusCode}`,
        errorBody,
      );
    }

    response.status(statusCode).json(errorBody);
  }
}
