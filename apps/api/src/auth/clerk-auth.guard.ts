import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './auth.constants';
import { ClerkAuthService } from './clerk-auth.service';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly clerkAuth: ClerkAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      dbUserId?: string;
    }>();

    const authDisabled =
      process.env.AUTH_DISABLED === 'true' && process.env.NODE_ENV !== 'production';
    if (authDisabled) {
      req.dbUserId = process.env.DEV_FALLBACK_USER_ID ?? 'u1';
      return true;
    }

    const authHeader = req.headers.authorization;
    const claims = await this.clerkAuth.verifyBearerToken(authHeader);
    req.dbUserId = await this.clerkAuth.resolveDbUserId(claims);
    return true;
  }
}
