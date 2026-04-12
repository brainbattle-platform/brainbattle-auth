import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [];

    if (!requiredRoles.length) return true;

    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id as string | undefined;
    if (!userId) return false;

    const roles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { role: true },
    });

    return requiredRoles.some((r) => roles.some((x) => x.role === r));
  }
}