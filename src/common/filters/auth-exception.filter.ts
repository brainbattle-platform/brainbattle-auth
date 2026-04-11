import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();

    console.error('AUTH EXCEPTION:', exception);

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'object') {
        return res.status(status).json({
          statusCode: status,
          ...(response as object),
        });
      }

      return res.status(status).json({
        statusCode: status,
        error: {
          code: 'AUTH_ERROR',
          message: exception.message,
        },
      });
    }

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      error: {
        code: 'AUTH_INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  }
}