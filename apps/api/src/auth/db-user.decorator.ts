import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const DbUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<{ dbUserId?: string }>();
  const id = request.dbUserId;
  if (!id) {
    throw new UnauthorizedException('Sesión no resuelta (dbUserId ausente)');
  }
  return id;
});
