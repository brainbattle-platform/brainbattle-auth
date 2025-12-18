import { HttpException, HttpStatus } from '@nestjs/common';
import { AuthErrorCode } from './auth-error-code.enum';

export class AuthException extends HttpException {
  constructor(
    code: AuthErrorCode,
    message: string,
    status: HttpStatus,
  ) {
    super(
      {
        error: {
          code,
          message,
        },
      },
      status,
    );
  }
}
