import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { env } from '../common/env';

@Injectable()
export class InternalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const key = req.headers['x-internal-service-key'];

    if (!key || key !== env.INTERNAL_SERVICE_KEY) {
      throw new ForbiddenException('Invalid internal service key');
    }

    return true;
  }
}